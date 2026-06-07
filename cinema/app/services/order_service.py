from django.http import Http404

from ..models import Ticket

from .utils import clear_expired_bookings


class OrderService:

    @staticmethod
    def get_order_status(tickets_str):

        clear_expired_bookings()

        ticket_ids = [int(i) for i in tickets_str.split(",") if i.isdigit()]

        tickets = (Ticket.objects.filter(id__in=ticket_ids).select_related("session__movie","session__hall","hall_seat"))

        if not tickets.exists():
            raise Http404("Заказ не найден")

        first_ticket = tickets.first()

        total_price = sum(t.final_price for t in tickets)

        tickets_info = [
            {
                "ticket_id": t.id,
                "row": t.hall_seat.row,
                "seat_number": t.hall_seat.seat_number,
                "price": t.final_price,
            }
            for t in tickets
        ]

        return {
            "movie_title": first_ticket.session.movie.title,
            "hall_name": first_ticket.session.hall.name,
            "start_time": first_ticket.session.start_time,
            "customer_email": first_ticket.customer_email,
            "status": first_ticket.status,
            "total_price": total_price,
            "tickets": tickets_info,
        }