def movie_to_dict(movie, request):
    return {
        "id": movie.id,
        "title": movie.title,
        "description": movie.description,
        "duration_minutes": movie.duration_minutes,
        "base_price": movie.base_price,
        "poster_url": (request.build_absolute_uri(movie.poster.url) if movie.poster else None),
        "age_rating": movie.age_rating,
    }