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


@api.get("/sessions/schedule", response={200: DayScheduleOut, 400: dict})
def get_schedule(request, filters: Query[ScheduleFilterParams]):
    return ScheduleService.get_schedule(request, filters)


@api.get("/sessions/{session_id}/map", response={200: HallMapOut, 400: dict})
def get_hall_map(request, session_id: int):
    return HallService.get_hall_map(request, session_id)


@api.post("/tickets/book/", response={201: OrderCreatedOut, 400: dict})
def book_tickets(request, data: BookTicketsInput):
    return BookingService.book(data)


@api.post("/payment/mock/{tickets_str}/pay/",response={200: dict, 400: dict})
def fake_pay(request, tickets_str: str):
    return PaymentService.pay(tickets_str)


@api.get("/tickets/order-status/{tickets_str}/", response=OrderStatusOut)
def get_order_status(request, tickets_str: str):
    return OrderService.get_order_status(tickets_str)
