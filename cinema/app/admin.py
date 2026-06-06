from django.contrib import admin
from django.utils import timezone
from .models import CinemaConfig, Movie, Hall, SeatTier, HallSeat, Session, SessionPrice, Ticket

# Настройка заголовков самой админки
admin.site.site_header = "Панель управления кинотеатром"
admin.site.site_title = "Администрация Кино"
admin.site.index_title = "Управление репертуаром и билетами"


# ==========================================
# 1. ГЛОБАЛЬНЫЕ НАСТРОЙКИ И СПРАВОЧНИКИ
# ==========================================

@admin.register(CinemaConfig)
class CinemaConfigAdmin(admin.ModelAdmin):
    list_display = ['weekend_markup']
    
    def has_add_permission(self, request):
        """Запрещает создавать вторую строку настроек, если одна уже есть."""
        if CinemaConfig.objects.exists():
            return False
        return super().has_add_permission(request)


@admin.register(SeatTier)
class SeatTierAdmin(admin.ModelAdmin):
    list_display = ['name', 'default_markup']


# ==========================================
# 2. УПРАВЛЕНИЕ КИНОЗАЛАМИ И МЕСТАМИ
# ==========================================

class HallSeatInline(admin.TabularInline):
    """Позволяет быстро добавлять места прямо на странице кинозала."""
    model = HallSeat
    extra = 5  # Сколько пустых строк для новых мест выводить по умолчанию
    fields = ['row', 'seat_number', 'tier']


@admin.register(Hall)
class HallAdmin(admin.ModelAdmin):
    list_display = ['name', 'get_total_seats']
    inlines = [HallSeatInline]

    def get_total_seats(self, obj):
        """Выводит общее количество кресел в зале."""
        return obj.seats.count()
    get_total_seats.short_description = "Всего мест в зале"


# ==========================================
# 3. УПРАВЛЕНИЕ ФИЛЬМАМИ
# ==========================================

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    # Что менеджер видит в общей таблице фильмов (добавили age_rating)
    list_display = ['title', 'age_rating', 'duration_minutes', 'base_price', 'is_active']
    
    # По каким полям работает поиск вверху страницы
    search_fields = ['title', 'description']
    
    # Боковые фильтры для быстрой сортировки (теперь можно фильтровать по прокату и цензу)
    list_filter = ['is_active', 'age_rating']
    
    # Позволяет менять статус и возрастной ценз прямо из списка, не кликая внутрь каждого фильма
    list_editable = ['is_active', 'age_rating']
    
    # Красивая группировка полей внутри карточки фильма
    fieldsets = [
        ("Основная информация", {
            'fields': ('title', 'description', 'poster')
        }),
        ("Финансовые и технические параметры", {
            'fields': ('duration_minutes', 'base_price', 'age_rating', 'is_active'), # Добавили age_rating в форму
        }),
    ]

# ==========================================
# 4. СЕАНСЫ И АВТОМАТИЧЕСКИЕ ЦЕНЫ (ГЛАВНЫЙ ЭКРАН МЕНЕДЖЕРА)
# ==========================================

class SessionPriceInline(admin.TabularInline):
    """Отображает сгенерированные цены прямо внутри карточки сеанса."""
    model = SessionPrice
    extra = 0
    # Запрещаем менеджеру вручную править рассчитанные цены, чтобы не ломать логику
    readonly_fields = ['tier', 'final_price']
    can_delete = False  # Запрещаем удалять отдельные категории цен из сеанса


class SessionStatusFilter(admin.SimpleListFilter):
    """Кастомный боковой фильтр: Прошедшие сеансы / Актуальные сеансы."""
    title = 'Статус проведения'
    parameter_name = 'status'

    def lookups(self, request, model_admin):
        return [
            ('active', 'Предстоящие сеансы'),
            ('past', 'Прошедшие сеансы'),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'active':
            return queryset.filter(start_time__gt=timezone.now())
        if self.value() == 'past':
            return queryset.filter(start_time__lte=timezone.now())


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['movie', 'hall', 'start_time', 'get_prices_status']
    search_fields = ['movie__title']
    # Удобные фильтры по датам, залам и нашему кастомному статусу времени
    list_filter = ['hall', 'start_time', SessionStatusFilter]
    # Встраиваем таблицу цен прямо в карточку сеанса
    inlines = [SessionPriceInline]

    def get_prices_status(self, obj):
        """Визуальный индикатор в общем списке: сгенерировались ли цены."""
        count = obj.prices.count()
        if count > 0:
            return f"Прайс готов ({count} кат.)"
        return "❌ Цены не сгенерированы"
    get_prices_status.short_description = "Статус прайс-листа"


# ==========================================
# 5. КОНТРОЛЬ ПРОДАЖ БИЛЕТОВ
# ==========================================

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'get_seat_info', 'customer_email', 'final_price', 'status']
    list_filter = ['status', 'session__start_time', 'session__hall']
    search_fields = ['customer_email', 'customer_phone', 'session__movie__title']
    list_editable = ['status'] # Позволяет кассиру/админу менять статус билета прямо из списка
    
    # Все поля билета, кроме статуса, делаем только для чтения. 
    # Никто не должен иметь возможности вручную изменить цену проданного билета или пересадить человека!
    readonly_fields = [
        'session', 'user', 'customer_email', 'customer_phone', 
        'hall_seat', 'final_price', 'created_at'
    ]

    def get_seat_info(self, obj):
        """Формирует красивую строку с местом для общего списка билетов."""
        return f"Ряд {obj.hall_seat.row}, Мест {obj.hall_seat.seat_number}"
    get_seat_info.short_description = "Место в зале"
