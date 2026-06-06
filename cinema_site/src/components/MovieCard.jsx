import React, { useState } from 'react';

export default function MovieCard({ movie, onAction }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Комбинируем базовые стили карточки с эффектом наведения
  const cardStyle = {
    ...styles.card,
    ...(isHovered ? styles.cardHover : {})
  };

  // Комбинируем стили кнопки
  const buttonStyle = {
    ...styles.actionButton,
    ...(isHovered ? styles.actionButtonHover : {}),
    ...(isPressed ? styles.actionButtonPressed : {})
  };

  // Стили для плавного зума картинки
  const imageStyle = {
    ...styles.posterImage,
    ...(isHovered ? styles.posterImageZoom : {})
  };

  return (
    <article 
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
    >
      {/* ОБЁРТКА КАРТИНКИ С ВОЗРАСТНЫМ РЕЙТИНГОМ */}
      <div style={styles.imageWrapper}>
        <span style={styles.ageBadge}>{movie.age_rating}</span> 
        <img 
          src={movie.poster_url || 'https://placeholder.com'} 
          alt={movie.title} 
          style={imageStyle}
          loading="lazy"
        />
      </div>

      {/* КОНТЕНТ КАРТОЧКИ */}
      <div style={styles.cardContent}>
        <h2 style={{...styles.movieTitle, color: isHovered ? '#0070f3' : '#1a1a1a'}}>{movie.title}</h2>
        <p style={styles.description}>
          {movie.description || "Описание фильма появится в ближайшее время."}
        </p>
        
        <div style={styles.metaInfo}>
          <span style={styles.duration}>⏱ {movie.duration_minutes} мин.</span>
          <span style={styles.price}>от {parseInt(movie.base_price)} ₽</span>
        </div>

        <button 
          style={buttonStyle} 
          onClick={() => onAction(movie.id)}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
        >
          Смотреть сеансы
        </button>
      </div>
    </article>
  );
}

const styles = {
  // Базовое состояние карточки
  card: { 
    display: 'flex', 
    flexDirection: 'column', 
    backgroundColor: '#fff', 
    borderRadius: '20px', 
    overflow: 'hidden', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)', 
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    
    // ИСПРАВЛЕНО: Вместо одной строки border пишем три раздельных свойства
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#f1f5f9' 
  },
  
  cardHover: {
    transform: 'translateY(-6px)', 
    boxShadow: '0 12px 30px rgba(0,0,0,0.08)', 
    
    // Теперь это свойство идеально заменяет базовый borderColor без конфликтов
    borderColor: '#e2e8f0' 
  },
  // Обёртка картинки с относительным позиционированием для бейджа
  imageWrapper: { 
    width: '100%', 
    height: '380px', 
    backgroundColor: '#f8fafc', 
    overflow: 'hidden',
    position: 'relative' 
  },
  
  // Бейдж возрастного рейтинга поверх картинки
  ageBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Полупрозрачный темный фон
    backdropFilter: 'blur(4px)', // Эффект размытия стекла под бейджем
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '6px',
    zIndex: 10
  },

  // Базовый постер
  posterImage: { 
    width: '100%', 
    height: '100%', 
    objectFit: 'cover',
    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' // Очень плавный зум
  },
  
  // Эффект зума картинки при наведении на карточку
  posterImageZoom: {
    transform: 'scale(1.05)' // Картинка увеличивается на 5% внутри своих границ
  },

  cardContent: { 
    padding: '20px', 
    display: 'flex', 
    flexDirection: 'column', 
    flexGrow: 1 
  },
  
  movieTitle: { 
    fontSize: '19px', 
    fontWeight: '700', 
    margin: '0 0 10px 0',
    lineHeight: '1.3',
    transition: 'color 0.2s ease' // Название плавно синеет при наведении
  },
  
  description: { 
    fontSize: '14px', 
    color: '#64748b', // Сделали цвет текста описания чуть мягче
    margin: '0 0 15px 0', 
    display: '-webkit-box', 
    WebkitLineClamp: 3, 
    WebkitBoxOrient: 'vertical', 
    overflow: 'hidden', 
    lineHeight: '1.5', 
    flexGrow: 1 
  },
  
  metaInfo: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '15px', 
    borderTop: '1px solid #f1f5f9', 
    paddingTop: '12px' 
  },
  
  duration: { 
    fontSize: '13px', 
    color: '#64748b', 
    fontWeight: '500' 
  },
  
  price: { 
    fontSize: '17px', 
    fontWeight: '700', 
    color: '#10b981' // Современный изумрудно-зеленый цвет для ценника
  },
  
  // Базовая кнопка сеансов
  actionButton: { 
    width: '100%', 
    padding: '11px', 
    backgroundColor: '#0f172a', // Сменили дефолтный синий на стильный глубокий slate-цвет
    color: '#fff', 
    border: 'none', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(15,23,42,0.05)',
    transition: 'all 0.2s ease'
  },
  
  // Ховер кнопки
  actionButtonHover: {
    backgroundColor: '#0070f3', // При наведении кнопка наливается фирменным синим цветом
    boxShadow: '0 4px 12px rgba(0,112,243,0.25)'
  },
  
  // Клик кнопки
  actionButtonPressed: {
    transform: 'scale(0.98)', // Кнопка физически прожимается внутрь
    boxShadow: '0 2px 4px rgba(0,112,243,0.1)'
  }
};
