from typing import List
from ninja import NinjaAPI
from ninja import Query
from .schemas import *
from .services.schedule_service import ScheduleService
from .services.hall_service import HallService
from .services.movie_service import MovieService
from .services.booking_service import BookingService
from .services.order_service import OrderService
from .services.payment_service import PaymentService

api = NinjaAPI()

#Эндпоинт для сбора активных фильмов
@api.get("/movies/active", response=List[MovieOut])
def get_active_movies(request):
    return MovieService.get_active_movies(request)

#Эндпоинт для выгрузки списка сеансов
@api.get("/sessions/schedule", response={200: DayScheduleOut, 400: dict})
def get_schedule(request, filters: Query[ScheduleFilterParams]):
    return ScheduleService.get_schedule(request, filters)

#Эндпоинт для выгрузки схемы зала конкретного сеанса
@api.get("/sessions/{session_id}/map", response={200: HallMapOut, 400: dict})
def get_hall_map(request, session_id: int):
    return HallService.get_hall_map(request, session_id)

#Эндпоинт создание билетов со статусом бронированных мест
@api.post("/tickets/book/", response={201: OrderCreatedOut, 400: dict})
def book_tickets(request, payload: BookTicketsInput):
    return BookingService.book(payload)

#Эндпоинт симуляции оплаты + смена статуса билетов на оплаченные
@api.post("/payment/mock/{tickets_str}/pay/",response={200: dict, 400: dict})
def fake_pay(request, tickets_str: str):
    return PaymentService.pay(tickets_str)


@api.get("/tickets/order-status/{tickets_str}/", response=OrderStatusOut)
def get_order_status(request, tickets_str: str):
    return OrderService.get_order_status(tickets_str)
