from django.shortcuts import get_object_or_404

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

class HallService:
    @staticmethod
    def get_hall_map(request, session_id: int):
        clear_expired_bookings()

        session = get_object_or_404(
            Session.objects.select_related("movie", "hall"),
            id=session_id,
        )

        if session.start_time <= current_time():
            return 400, {"detail": "Этот сеанс уже начался или завершился."}

        taken_seat_ids = set(
            Ticket.objects.filter(session=session, status__in=["booked", "paid"])
            .values_list("hall_seat_id", flat=True)
        )

        prices_dict = {
            p.tier_id: p.final_price
            for p in SessionPrice.objects.filter(session=session)
        }

        all_seats = (
            HallSeat.objects.filter(hall=session.hall)
            .select_related("tier")
            .order_by("row", "seat_number")
        )

        seats_statuses = []
        for seat in all_seats:
            seats_statuses.append(
                {
                    "seat_id": seat.id,
                    "row": seat.row,
                    "seat_number": seat.seat_number,
                    "tier_name": seat.tier.name,
                    "price": prices_dict.get(seat.tier_id, session.movie.base_price),
                    "is_taken": seat.id in taken_seat_ids,
                }
            )

        return 200, {
            "session_id": session.id,
            "movie_title": session.movie.title,
            "hall_name": session.hall.name,
            "seats": seats_statuses,
        }