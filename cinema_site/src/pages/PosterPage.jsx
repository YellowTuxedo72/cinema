import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- ДОБАВИЛИ ИМПОРТ
import { cinemaApi } from '../api/cinemaApi';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function PosterPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate(); // <--- ИНИЦИАЛИЗИРОВАЛИ НАВИГАЦИЮ

  const loadMovies = () => {
    setLoading(true);
    setError(null);
    cinemaApi.getActiveMovies()
      .then((data) => {
        setMovies(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Не удалось загрузить данные");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMovies();
  }, []);

  if (loading) return <Loader message="Загрузка актуальной афиши..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadMovies} />;
  
  if (movies.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
        <h2>🍿 Афиша сейчас пуста</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 10px 0' }}>Сейчас в кино</h1>
        <p style={{ color: '#666' }}>Выберите фильм для покупки билетов</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
        {movies.map((movie) => (
          <MovieCard 
            key={movie.id} 
            movie={movie} 
            onAction={(id) => navigate(`/movie/${id}`)} 
          />
        ))}
      </div>
    </div>
  );
}
