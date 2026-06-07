from django.db import transaction

from ..models import Ticket

from .utils import clear_expired_bookings


class PaymentService:

    @staticmethod
    def pay(tickets_str: str):

        clear_expired_bookings()

        ticket_ids = [int(i) for i in tickets_str.split(",") if i.isdigit()]

        with transaction.atomic():
            tickets = Ticket.objects.filter(id__in=ticket_ids, status="booked")

            if not tickets.exists():
                return 400, {"detail":"Билеты не найдены или уже были оплачены."}

            tickets.update(status="paid")
            
            return 200, {"success": True, "message": "Оплата успешно подтверждена."}