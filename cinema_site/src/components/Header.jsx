import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// 1. ИМПОРТИРУЕМ ВАШУ КАРТИНКУ ЛОГОТИПА
import logoImg from '../assets/test.png'; 

export default function Header() {
  const location = useLocation();

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        
        {/* ЛОГОТИП */}
        <Link to="/" style={styles.logoLink}>
          {/* 2. ЗАМЕНИЛИ ЭМОДЗИ НА СВОЙ ТЕГ IMG */}
          <img 
            src={logoImg} 
            alt="Логотип CinemaCore" 
            style={styles.logoImage} 
          />
          {/* <span style={styles.logoText}>
            <span style={styles.logoYellow}>LOL</span>
            <span style={styles.logoRed}>KEK</span>
            </span> */}

        </Link>

        {/* МЕНЮ НАВИГАЦИИ */}
        <nav style={styles.nav}>
          <Link 
            to="/" 
            style={{
              ...styles.navLink,
              ...(location.pathname === '/' ? styles.activeNavLink : {})
            }}
          >
            Афиша
          </Link>
          
          <Link 
            to="/schedule" 
            style={{
              ...styles.navLink,
              ...(location.pathname === '/schedule' ? styles.activeNavLink : {})
            }}
          >
            Сеансы
          </Link>
        </nav>

      </div>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #ececec',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
    fontFamily: 'system-ui, sans-serif'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    height: '120px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'black'
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    color: '#1a1a1a'
  },
  
  // 3. ДОБАВИЛИ СТИЛИ ДЛЯ КОРРЕКТНОГО МАСШТАБИРОВАНИЯ КАРТИНКИ
  logoImage: {
    height: '120px',         // Жестко ограничиваем высоту под размер хедера
    width: 'auto',          // Пропорции ширины подстроятся автоматически
    objectFit: 'contain'
  },
  
  logoText: {
    fontSize: '30px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: '#0f172a'
  },

  logoYellow: {
    color: '#ffb300'         // Приятный насыщенный желтый цвет (золотой)
  },
  
  logoRed: {
    color: '#e53935'         // Насыщенный красный цвет
  },

  nav: {
    display: 'flex',
    gap: '30px',
  },
  navLink: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#64748b',
    textDecoration: 'none',
    padding: '8px 4px',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s ease'
  },
  activeNavLink: {
    color: '#0070f3',
    borderBottom: '2px solid #0070f3'
  }
};
