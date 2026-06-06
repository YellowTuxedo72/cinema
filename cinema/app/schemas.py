from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
from ninja import Schema


# СХЕМЫ ДЛЯ АФИШИ И РАСПИСАНИЯ
class ScheduleFilterParams(Schema):
    """Схема для валидации параметров фильтрации расписания"""
    # Делаем оба параметра полностью опциональными со значениями по умолчанию None
    movie_id: Optional[int] = None
    date_param: Optional[date] = None
    
class MovieOut(Schema):
    id: int
    title: str
    description: str
    duration_minutes: int
    base_price: Decimal
    poster_url: Optional[str] = None
    age_rating: str

class SessionShortOut(Schema):
    """Короткая информация о сеансе внутри расписания дня"""
    id: int
    hall_name: str
    start_time: datetime

class MovieWithSessionsOut(Schema):
    """Фильм со списком его сеансов на конкретный день"""
    movie: MovieOut
    sessions: List[SessionShortOut]

class DayScheduleOut(Schema):
    """Основной ответ для вкладки 'Сеансы' и страницы фильма"""
    selected_date: date
    available_dates: List[str]  # Список дат (YYYY-MM-DD), на которые вообще есть сеансы
    schedule: List[MovieWithSessionsOut]


# ==========================================
# 2. СХЕМЫ ДЛЯ КАРТЫ ЗАЛА (ВЫБОР МЕСТА)
# ==========================================

class SeatStatusOut(Schema):
    """Одно кресло на схеме зала"""
    seat_id: int
    row: int
    seat_number: int
    tier_name: str
    price: Decimal
    is_taken: bool  # True - занято/забронировано, False - свободно

class HallMapOut(Schema):
    """Полная карта зала для выбранного сеанса"""
    session_id: int
    movie_title: str
    hall_name: str
    seats: List[SeatStatusOut]


# ==========================================
# 3. СХЕМЫ ДЛЯ БРОНИРОВАНИЯ И ОПЛАТЫ
# ==========================================

class BookTicketsInput(Schema):
    """Данные от фронтенда при покупке (поддерживает выбор нескольких мест сразу)"""
    session_id: int
    hall_seat_ids: List[int]  # Массив ID выбранных кресел [12, 13, 14]
    customer_email: str
    customer_phone: str

class OrderCreatedOut(Schema):
    """Ответ бэкенда после клика на кнопку 'Купить' перед оплатой"""
    message: str
    ticket_ids: List[int]
    total_price: Decimal
    payment_url: str  # Ссылка на фейк-оплату: /api/payment/mock/...


class TicketInfoOut(Schema):
    """Детали одного билета для финального чека"""
    ticket_id: int
    row: int
    seat_number: int
    price: Decimal

class OrderStatusOut(Schema):
    """Финальный статус заявки после возвращения с оплаты"""
    movie_title: str
    hall_name: str
    start_time: datetime
    customer_email: str
    status: str  # 'paid' или 'booked'
    total_price: Decimal
    tickets: List[TicketInfoOut]
