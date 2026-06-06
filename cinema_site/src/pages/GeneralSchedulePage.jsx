import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cinemaApi } from '../api/cinemaApi';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

// ==========================================
// АНИМИРОВАННЫЙ КОМПОНЕНТ КНОПКИ СЕАНСА
// ==========================================
function SessionButton({ session, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const sessionTime = new Date(session.start_time).toLocaleTimeString('ru-RU', {
    hour: '2-digit', minute: '2-digit',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  const currentStyle = {
    ...styles.sessionButton,
    ...(isHovered ? styles.sessionButtonHover : {}),
    ...(isPressed ? styles.sessionButtonPressed : {})
  };

  return (
    <button
      className="cinema-session-btn" // ДОБАВИЛИ КЛАСС ДЛЯ СТРОГОГО CSS
      style={currentStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={(e) => {
        setIsPressed(false);
        e.currentTarget.blur(); // Мягко сбрасываем фокус
      }}
    >
      <span style={{...styles.time, color: isHovered ? '#0070f3' : '#1a1a1a'}}>{sessionTime}</span>
      <span style={styles.hall}>{session.hall_name}</span>
    </button>
  );
}

// ==========================================
// ОСНОВНОЙ КОМПОНЕНТ СТРАНИЦЫ
// ==========================================
export default function GeneralSchedulePage() {
  const navigate = useNavigate();
  const [scheduleData, setScheduleData] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGeneralSchedule = (dateStr) => {
    setLoading(true);
    setError(null);
    cinemaApi.getGeneralSchedule(dateStr)
      .then((data) => {
        setScheduleData(data);
        setSelectedDate(data.selected_date);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Не удалось загрузить общее расписание");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGeneralSchedule('');
  }, []);

  if (loading) return <Loader message="Загрузка сводного расписания..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => fetchGeneralSchedule(selectedDate)} />;
  if (!scheduleData) return null;

  const { available_dates, schedule } = scheduleData;

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date().toISOString().split('T');
    if (dateStr === today) return "Сегодня";
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={styles.container}>
      {/* ГЛОБАЛЬНЫЙ CSS ИНЖЕКТ: Намертво вырезает черные/синие обводки браузера при фокусе и клике */}
      <style>{`
        .cinema-session-btn:focus, 
        .cinema-session-btn:active, 
        .cinema-session-btn:focus-visible {
          outline: none !important;
          box-shadow: none !important;
          border-color: #cbd5e1 !important;
        }
        .cinema-session-btn:hover {
          border-color: #0070f3 !important;
        }
      `}</style>

      <header style={styles.header}>
        <h1 style={styles.mainTitle}>Расписание сеансов</h1>
        <p style={styles.subtitle}>Сводное расписание всех залов кинотеатра</p>
      </header>

      {/* Переключатель общих дней */}
      {available_dates.length > 0 && (
        <div style={styles.tabsContainer}>
          {available_dates.map((dateStr) => (
            <button
              key={dateStr}
              style={{
                ...styles.tabButton,
                ...(selectedDate === dateStr ? styles.activeTabButton : {})
              }}
              onClick={(e) => {
                e.currentTarget.blur();
                fetchGeneralSchedule(dateStr);
              }}
            >
              {formatDateLabel(dateStr)}
            </button>
          ))}
        </div>
      )}

      {/* Список всех фильмов */}
      {schedule.length > 0 ? (
        <div style={styles.moviesList}>
          {schedule.map((item) => (
            <div key={item.movie.id} style={styles.movieRow}>
              <div style={styles.movieInfo}>
                <h3 style={styles.movieTitle}>{item.movie.title}</h3>
                <div style={styles.movieMeta}>
                  <span style={styles.movieDuration}>⏱ {item.movie.duration_minutes} мин.</span>
                  <span style={styles.moviePrice}>от {parseInt(item.movie.base_price)} ₽</span>
                </div>
              </div>

              <div style={styles.sessionsGrid}>
                {item.sessions.map((session) => (
                  <SessionButton 
                    key={session.id} 
                    session={session} 
                    onClick={() => navigate(`/session/${session.id}`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.empty}>На выбранный день сеансов нет.</div>
      )}
    </div>
  );
}

// ==========================================
// СТИЛИ (ГАРМОНИЧНЫЕ И ЧИСТЫЕ)
// ==========================================
const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' },
  header: { marginBottom: '25px', textAlign: 'left'},
  mainTitle: { fontSize: '26px', fontWeight: '800', margin: '0 0 5px 0' },
  subtitle: { color: '#666', margin: 0, fontSize: '14px' },
  tabsContainer: { display: 'flex', gap: '10px', borderBottom: '2px solid #eaeaea', paddingBottom: '12px', marginBottom: '25px', overflowX: 'auto' },
  tabButton: { padding: '6px 14px', border: '1px solid #ddd', borderRadius: '20px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', outline: 'none', transition: 'all 0.2s ease-in-out' },
  activeTabButton: { backgroundColor: '#0070f3', color: '#fff', borderColor: '#0070f3', fontWeight: '600', transform: 'scale(1.03)', boxShadow: '0 4px 12px rgba(0, 112, 243, 0.2)' },
  moviesList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  movieRow: { backgroundColor: '#fff', padding: '10px 20px', borderRadius: '12px', border: '1px solid #eee', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'center' },
  movieInfo: { display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' },
  movieTitle: { fontSize: '16px', fontWeight: '700', margin: 0, color: '#1a1a1a', lineHeight: '1.2' },
  movieMeta: { display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px' },
  movieDuration: { color: '#777', fontWeight: '500' },
  moviePrice: { color: '#00c853', fontWeight: '700' },
  sessionsGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  
  sessionButton: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    padding: '6px 12px', 
    border: '1px solid #cbd5e1', 
    borderRadius: '8px', 
    backgroundColor: '#ffffff', 
    cursor: 'pointer', 
    minWidth: '80px', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    outline: 'none', 
    transition: 'all 0.15s ease-in-out' 
  },
  sessionButtonHover: {
    transform: 'translateY(-2px)',               
    boxShadow: '0 4px 12px rgba(0, 112, 243, 0.15)' 
  },
  sessionButtonPressed: {
    transform: 'translateY(1px)',                
    boxShadow: '0 1px 2px rgba(0, 112, 243, 0.1)'  
  },
  time: { fontSize: '15px', fontWeight: '700', transition: 'color 0.15s ease' },
  hall: { fontSize: '10px', color: '#718096', marginTop: '1px', fontWeight: '500' },
  empty: { textAlign: 'center', padding: '30px', color: '#666' }
};
