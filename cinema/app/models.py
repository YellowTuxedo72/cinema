from django.db import models
from django.contrib.auth.models import User
from datetime import timedelta
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal

class CinemaConfig(models.Model):
    weekend_markup = models.DecimalField(max_digits=6, decimal_places=2, default=100.00, verbose_name="Наценка на выходные")
    class Meta:
        verbose_name = "Настройки цен"
    def __str__(self):
        return f"Глобальная наценка {self.weekend_markup} руб."


class Movie(models.Model):
    AGE_RATINGS = [
        ('0+', '0+ (Для всех)'),
        ('6+', '6+ (Для детей старше 6 лет)'),
        ('12+', '12+ (Для детей старше 12 лет)'),
        ('16+', '16+ (Для лиц старше 16 лет)'),
        ('18+', '18+ (Запрещено для детей)'),
    ]
    title = models.CharField(max_length=255, verbose_name="Название фильма")
    description = models.TextField(blank=True, verbose_name="Описание")
    duration_minutes = models.PositiveIntegerField(verbose_name="Длительность (мин.)")
    base_price = models.DecimalField(max_digits=8, decimal_places=2, default=300.00, verbose_name="Базовая цена фильма")
    is_active = models.BooleanField(default=True, verbose_name="В прокате")
    poster = models.ImageField(upload_to="posters/", blank=True, null=True, verbose_name="Постер фильма")
    age_rating = models.CharField(max_length=5, choices=AGE_RATINGS, default='16+', verbose_name="Возрастной рейтинг")
    class Meta:
        verbose_name = "Фильм"
        verbose_name_plural = "Фильмы"
        
    def __str__(self):
        return f"{self.title} [{self.age_rating}] (База: {self.base_price} руб.)"


class Hall(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название зала")
    class Meta:
        verbose_name = "Кинозал"
        verbose_name_plural = "Кинозалы"
    def __str__(self):
        return self.name


class SeatTier(models.Model):
    name = models.CharField(max_length=50, verbose_name="Название категории")
    default_markup = models.DecimalField(max_digits=6, decimal_places=2, default=0.00, verbose_name="Наценка за категорию")
    class Meta:
        verbose_name = "Категория места"
    def __str__(self):
        return f"{self.name} (+{self.default_markup} руб.)"


class HallSeat(models.Model):
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name="seats", verbose_name="Зал")
    row = models.PositiveIntegerField(verbose_name="Ряд")
    seat_number = models.PositiveIntegerField(verbose_name="Место в ряду")
    tier = models.ForeignKey(SeatTier, on_delete=models.PROTECT, verbose_name="Категория места")
    class Meta:
        unique_together = ('hall', 'row', 'seat_number')
        verbose_name = "Место в зале"
        verbose_name_plural = "Места в зале"

    def __str__(self):
        return f"{self.hall.name}: Ряд {self.row}, Место {self.seat_number} ({self.tier.name})"

class Session(models.Model):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="sessions", verbose_name="Фильм")
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name="sessions", verbose_name="Зал")
    start_time = models.DateTimeField(verbose_name="Время начала")
    class Meta:
        verbose_name = "Сеанс"
        verbose_name_plural = "Сеансы"
    def __str__(self):
        return f"{self.movie.title} - {self.start_time.strftime('%d.%m %H:%M')}"

    def clean(self):
        if not self.start_time or not self.movie:
            return
        CLEANING_TIME = 15 
        new_session_end = self.start_time + timedelta(minutes=self.movie.duration_minutes + CLEANING_TIME)
        overlapping_sessions = Session.objects.filter(hall=self.hall).exclude(pk=self.pk)

        for session in overlapping_sessions:
            session_end = session.start_time + timedelta(minutes=session.movie.duration_minutes + CLEANING_TIME)
            if self.start_time < session_end and new_session_end > session.start_time:
                raise ValidationError(
                    f"Зал '{self.hall.name}' занят в это время! "
                    f"Там идет фильм '{session.movie.title}' ({session.start_time.strftime('%H:%M')} - "
                    f"{(session_end - timedelta(minutes=CLEANING_TIME)).strftime('%H:%M')})."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        is_new = self.pk is None      
        super().save(*args, **kwargs)
        if is_new:
            self.generate_prices()
            
    def generate_prices(self):
        is_weekend = self.start_time.weekday() in [5, 6]
        if is_weekend:
            config = CinemaConfig.objects.first()
            time_markup = config.weekend_markup if config else Decimal("100.00")
        else:
            time_markup = Decimal("0.00")   
        tiers = SeatTier.objects.all()
        session_prices = []
        for tier in tiers:
            final_price = self.movie.base_price + tier.default_markup + time_markup
            
            session_prices.append(
                SessionPrice(session=self, tier=tier, final_price=final_price)
            )
        SessionPrice.objects.bulk_create(session_prices)


class SessionPrice(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="prices", verbose_name="Сеанс")
    tier = models.ForeignKey(SeatTier, on_delete=models.CASCADE, verbose_name="Категория места")
    final_price = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="Финальная цена")

    class Meta:
        unique_together = ('session', 'tier')
        verbose_name = "Цена сеанса"
        verbose_name_plural = "Цены сеансов"

    def __str__(self):
        return f"Сеанс {self.session.id} [{self.tier.name}]: {self.final_price} руб."


class Ticket(models.Model):
    STATUS_CHOICES = [
        ('booked', 'Забронирован'),
        ('paid', 'Оплачен'),
        ('canceled', 'Отменен'),
    ]
    
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="tickets", verbose_name="Сеанс")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="tickets", verbose_name="Покупатель")
    customer_email = models.EmailField(verbose_name="Email покупателя", default="guest@example.com")
    customer_phone = models.CharField(max_length=20, verbose_name="Телефон покупателя", default="+70000000000")
    hall_seat = models.ForeignKey(HallSeat, on_delete=models.CASCADE, verbose_name="Место")
    final_price = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="Цена продажи")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='booked', verbose_name="Статус")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата бронирования")
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('session', 'hall_seat')
        verbose_name = "Билет"
        verbose_name_plural = "Билеты"
        
    def clean(self):
        if not self.session:
            return

        if self.session.start_time <= timezone.now():
            raise ValidationError(
                f"Невозможно купить билет! Сеанс фильма '{self.session.movie.title}' "
                f"уже начался или завершился ({self.session.start_time.strftime('%d.%m %H:%M')})."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Билет #{self.id} ({self.customer_email}) - Ряд {self.hall_seat.row}, Место {self.hall_seat.seat_number}"
