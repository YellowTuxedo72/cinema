import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cinemaApi } from '../api/cinemaApi';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function SchedulePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [scheduleData, setScheduleData] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedule = (dateStr) => {
    setLoading(true);
    setError(null);
    cinemaApi.getSchedule(id, dateStr)
      .then((data) => {
        setScheduleData(data);
        setSelectedDate(data.selected_date);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Не удалось загрузить расписание сеансов");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSchedule('');
  }, [id]);

  if (loading && !scheduleData) return <Loader message="Загрузка страницы фильма..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => fetchSchedule(selectedDate)} />;
  if (!scheduleData) return null;

  const { available_dates, schedule } = scheduleData;
  const currentMovieSchedule = schedule[0];

  if (!currentMovieSchedule) {
    return (
      <div style={styles.emptyState}>
        <h2>Фильм не найден</h2>
        <button style={styles.backButton} onClick={() => navigate('/')}>← Назад на главную</button>
      </div>
    );
  }

  const { movie, sessions } = currentMovieSchedule;

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return "Сегодня";
    
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={styles.pageWrapper}>
      
      {/* ==========================================
          1. ВЕРХНИЙ БОЛЬШОЙ ПРЕВЬЮ-БЛОК (ТЁМНЫЙ ФОН)
          ========================================== */}
      <div style={styles.heroSection}>
        <div style={styles.heroOverlay}></div>
        <div style={styles.heroContainer}>
          
          {/* Левая часть: Большой постер */}
          <div style={styles.posterWrapper}>
            <img 
              src={movie.poster_url || 'https://placeholder.com'} 
              alt={movie.title} 
              style={styles.mainPoster}
            />
          </div>

          {/* Правая часть: Описание, название и кнопки */}
          <div style={styles.movieDetails}>
            <div style={styles.badgeRow}>
              <span style={styles.ageBadge}>{movie.age_rating}</span>
              <span style={styles.genreBadge}>⏱ {movie.duration_minutes} мин.</span>
            </div>

            <h1 style={styles.movieTitle}>{movie.title}</h1>
            
            {/* ПОЛНОЕ, НЕ СЖАТОЕ ОПИСАНИЕ ФИЛЬМА */}
            <p style={styles.fullDescription}>{movie.description || "Описание фильма скоро появится."}</p>

            <div style={styles.actionButtonsRow}>
              <button style={styles.primaryBuyButton} onClick={() => {
                const tabsBlock = document.getElementById('schedule-tabs');
                if (tabsBlock) tabsBlock.scrollIntoView({ behavior: 'smooth' });
              }}>
                Выбрать сеанс
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ==========================================
          2. НИЖНИЙ БЛОК: СЕАНСЫ И ПАГИНАЦИЯ (СВЕТЛЫЙ ФОН)
          ========================================== */}
      <div id="schedule-tabs" style={styles.contentSection}>
        <div style={styles.contentContainer}>
          
          {/* Панель переключения дней */}
          <div style={styles.tabsPanel}>
            {available_dates.length > 0 ? (
              <div style={styles.tabsList}>
                {available_dates.map((dateStr) => (
                  <button
                    key={dateStr}
                    style={{
                      ...styles.tabButton,
                      ...(selectedDate === dateStr ? styles.activeTabButton : {})
                    }}
                    onClick={() => fetchSchedule(dateStr)}
                  >
                    {formatDateLabel(dateStr)}
                  </button>
                ))}
              </div>
            ) : (
              <div style={styles.noDatesText}>На этот фильм пока нет доступных дат сеансов.</div>
            )}
          </div>

          {/* Сетка доступного времени сеансов */}
          {sessions.length > 0 ? (
            <div style={styles.sessionsGrid}>
              {sessions.map((session) => {
                const sessionDate = new Date(session.start_time);
                const sessionTime = sessionDate.toLocaleTimeString('ru-RU', {
                  hour: '2-digit', minute: '2-digit',
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                });

                return (
                  <button
                    key={session.id}
                    style={styles.sessionCard}
                    onClick={() => navigate(`/session/${session.id}`)}
                  >
                    <span style={styles.time}>{sessionTime}</span>
                    <span style={styles.priceInfo}>от {parseInt(movie.base_price)} ₽</span>
                    <span style={styles.techInfo}>2D</span>
                    <span style={styles.hallName}>{session.hall_name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={styles.emptySessions}>
              <h3>🍿 Сеансов на выбранный день не найдено</h3>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

// ==========================================
// СТИЛИ, ПОЛНОСТЬЮ ПОВТОРЯЮЩИЕ СКРИНШОТ
// ==========================================
const styles = {
  pageWrapper: { minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' },
  
  // ТЕМНАЯ ХЕРО-ЗОНА (Фильм и постер)
  heroSection: { 
    position: 'relative', 
    backgroundColor: '#0f172a', // Глубокий темный фон
    backgroundImage: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)',
    padding: '60px 0', 
    color: '#fff' 
  },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F8FAFC', zIndex: 1 },
  heroContainer: { position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '50px', alignItems: 'center' },
  
  posterWrapper: { width: '100%', height: '440px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  mainPoster: { width: '100%', height: '100%', objectFit: 'cover' },
  
  movieDetails: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  badgeRow: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' },
  ageBadge: { backgroundColor: '#ef4444', color: '#fff', fontWeight: '800', fontSize: '12px', padding: '3px 8px', borderRadius: '6px' },
  premiumBadge: { backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' },
  genreBadge: { color: '#94a3b8', fontSize: '14px', fontWeight: '500' },
  
  movieTitle: { fontSize: '42px', fontWeight: '900', margin: '0 0 20px 0', letterSpacing: '-1px', lineHeight: '1.1' },
  
  // СТИЛЬ ДЛЯ ПОЛНОГО ОПИСАНИЯ: Текст не обрезается, убраны лимиты строк
  fullDescription: { fontSize: '16px', color: '#636363', margin: '0 0 35px 0', lineHeight: '1.6', maxWidth: '800px' },
  
  actionButtonsRow: { display: 'flex', gap: '15px' },
  primaryBuyButton: { padding: '14px 28px', backgroundColor: '#00ccbb', color: '#ffffff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,204,187,0.3)' },
  secondaryTrailerButton: { padding: '14px 24px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px', transition: 'all 0.2s' },
  
  // СВЕТЛАЯ НИЖНЯЯ ЗОНА С СЕАНСАМИ
  contentSection: { padding: '40px 0', flexGrow: 1 },
  contentContainer: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
  
  // Белая плашка с датами, как на макете
  tabsPanel: { backgroundColor: '#fff', padding: '10px', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', marginBottom: '30px' },
  tabsList: { display: 'flex', gap: '8px' },
  tabButton: { padding: '10px 20px', border: 'none', background: 'none', color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', borderRadius: '10px', transition: 'all 0.2s' },
  activeTabButton: { backgroundColor: '#f1f5f9', color: '#0f172a' },
  
  // Сетка карточек времени сеансов
  sessionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' },
  sessionCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '15px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s ease-in-out', boxShadow: '0 2px 5px rgba(0,0,0,0.01)' },
  time: { fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }, priceInfo: { fontSize: '12px', color: '#64748b', margin: '2px 0', fontWeight: '500' },techInfo: { fontSize: '11px', color: '#94a3b8', fontWeight: '700', backgroundColor: '#f8fafc', padding: '2px 6px', borderRadius: '4px' },hallName: { fontSize: '11px', color: '#475569', marginTop: '6px', fontWeight: '600' },emptyState: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', fontFamily: 'sans-serif' },emptySessions: { textAlign: 'center', padding: '5px', color: '#64748b' },noDatesText: { padding: '10px', color: '#64748b', fontSize: '14px', fontWeight: '500' }};
