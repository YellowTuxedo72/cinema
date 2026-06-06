import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PosterPage from './pages/PosterPage';
import SchedulePage from './pages/SchedulePage';
import GeneralSchedulePage from './pages/GeneralSchedulePage'; // <--- ДОБАВИЛИ ИМПОРТ
import HallMapPage from './pages/HallMapPage';
import OrderStatusPage from './pages/OrderStatusPage';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header /> 
        <div style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<PosterPage />} />
            <Route path="/movie/:id" element={<SchedulePage />} />
            
            {/* НОВЫЙ МАРШРУТ ДЛЯ ВКЛАДКИ СЕАНСЫ */}
            <Route path="/schedule" element={<GeneralSchedulePage />} /> 
            
            <Route path="/session/:id" element={<HallMapPage />} />
            <Route path="/order-status/:ticketsStr" element={<OrderStatusPage />} />
            <Route path="*" element={<div style={{textAlign: 'center', marginTop: '50px'}}>404 — Не найдено</div>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
