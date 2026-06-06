from ..models import Movie

from .utils import current_time
from .serializers import movie_to_dict


class MovieService:

    @staticmethod
    def get_active_movies(request):
        now = current_time()
        active_movies = (Movie.objects.filter(is_active=True, sessions__start_time__gt=now).distinct())
        return [movie_to_dict(movie, request) for movie in active_movies]