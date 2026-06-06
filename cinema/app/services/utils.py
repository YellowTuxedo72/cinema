from django.utils import timezone
from ..models import Ticket


def current_time():
    return timezone.now()


def clear_expired_bookings():
    Ticket.objects.filter(
        status="booked",
        expires_at__lt=current_time(),
    ).update(status="canceled")