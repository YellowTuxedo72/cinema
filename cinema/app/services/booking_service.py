from datetime import timedelta
from decimal import Decimal

from django.db import transaction, IntegrityError
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError

from ..models import (
    Session,
    HallSeat,
    Ticket,
    SessionPrice,
)

from .utils import (
    current_time,
    clear_expired_bookings,
)

class BookingService:

    @staticmethod
    def book(data):

        clear_expired_bookings()

        if not data.hall_seat_ids:
            return 400, {
                "detail": "Не выбрано ни одно место."
            }

        with transaction.atomic():

            session = get_object_or_404(
                Session.objects.select_for_update(),
                id=data.session_id,
            )

            if session.start_time <= current_time():
                return 400, {
                    "detail": "Сеанс уже начался или завершился."
                }

            already_taken = Ticket.objects.filter(
                session=session,
                hall_seat_id__in=data.hall_seat_ids,
                status__in=["booked", "paid"],
            ).exists()

            if already_taken:
                return 400, {
                    "detail": (
                        "Одно или несколько выбранных мест "
                        "уже успели забронировать."
                    )
                }

            prices_dict = {
                p.tier_id: p.final_price
                for p in SessionPrice.objects.filter(
                    session=session
                )
            }

            seats = list(
                HallSeat.objects.filter(
                    id__in=data.hall_seat_ids,
                    hall=session.hall
                ).select_related("tier")
            )

            if len(seats) != len(data.hall_seat_ids):
                return 400, {
                    "detail": "Некорректные места."
                }

            created_tickets = []
            total_price = Decimal("0.00")

            try:

                for seat in seats:

                    price = prices_dict.get(
                        seat.tier_id,
                        session.movie.base_price
                    )

                    total_price += price

                    ticket = Ticket.objects.create(
                        session=session,
                        hall_seat=seat,
                        customer_email=data.customer_email,
                        customer_phone=data.customer_phone,
                        final_price=price,
                        status="booked",
                        expires_at=current_time()
                        + timedelta(minutes=15),
                    )

                    created_tickets.append(ticket.id)

                tickets_string = ",".join(
                    map(str, created_tickets)
                )

                payment_url = (
                    f"/api/payment/mock/"
                    f"{tickets_string}/pay/"
                )

                return 201, {
                    "message":
                        "Места успешно забронированы "
                        "на 15 минут.",
                    "ticket_ids": created_tickets,
                    "total_price": total_price,
                    "payment_url": payment_url,
                }

            except (
                ValidationError,
                IntegrityError,
            ):
                return 400, {
                    "detail":
                        "Не удалось создать бронь. "
                        "Попробуйте еще раз."
                }