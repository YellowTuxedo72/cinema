from datetime import datetime

from ..models import Session
from .serializers import movie_to_dict
from .utils import current_time


class ScheduleService:
    @staticmethod
    def get_schedule(request, filters):
        now = current_time()
        movie_id = filters.movie_id
        date_param = filters.date_param
        
        if movie_id:
            sessions_query = Session.objects.filter(movie_id=movie_id, start_time__gt=now)
        else:
            sessions_query = Session.objects.filter(start_time__gt=now)

        movie_sessions_dates = (sessions_query.values_list("start_time__date", flat=True).distinct().order_by("start_time__date"))
        available_dates = [d.strftime("%Y-%m-%d") for d in movie_sessions_dates]

        if not available_dates:
            return 200, {"selected_date": date_param or now.date(), "available_dates": [], "schedule": []}

        target_date = date_param or movie_sessions_dates[0]

        if target_date == now.date():
            start_search = now
        else:
            start_search = datetime.combine(target_date, datetime.min.time())

        end_search = datetime.combine(target_date, datetime.max.time())
        day_sessions = Session.objects.filter(start_time__gte=start_search, start_time__lte=end_search)

        if movie_id:
            day_sessions = day_sessions.filter(movie_id=movie_id)

        sessions_today = (day_sessions.select_related("movie", "hall").order_by("start_time"))
        schedule_data = {}
        for s in sessions_today:
            if s.movie_id not in schedule_data:
                schedule_data[s.movie_id] = {"movie": movie_to_dict(s.movie, request), "sessions": []}

            schedule_data[s.movie_id]["sessions"].append({"id": s.id, "hall_name": s.hall.name, "start_time": s.start_time})

        return 200, {
            "selected_date": target_date,
            "available_dates": available_dates,
            "schedule": list(schedule_data.values()),
        }
