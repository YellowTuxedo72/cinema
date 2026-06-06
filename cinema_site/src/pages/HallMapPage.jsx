import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cinemaApi } from '../api/cinemaApi';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

// Маленький анимированный компонент для каждого отдельного кресла
function SeatButton({ seat, isSelected, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  // Формируем динамический стиль точки
  let currentStyle = {
    ...styles.seatPoint,
    ...(seat.tier_name === "Стандарт+" ? styles.seatPremium : {}),
    ...(isSelected ? styles.seatSelected : {}),
    ...(seat.is_taken ? styles.seatTaken : {}),
    ...(isHovered && !seat.is_taken && !isSelected ? styles.seatHover : {})
  };

  return (
    <button
      style={currentStyle}
      title={`Ряд ${seat.row}, Место ${seat.seat_number}\n${seat.tier_name}: ${parseInt(seat.price)} ₽`}
      onClick={onClick}
      disabled={seat.is_taken}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  );
}

export default function HallMapPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mapData, setMapData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const loadHallMap = () => {
    setLoading(true);
    setError(null);
    cinemaApi.getHallMap(id)
      .then((data) => {
        setMapData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Не удалось загрузить карту зала");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadHallMap();
  }, [id]);

  if (loading) return <Loader message="Загрузка компактной схемы зала..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadHallMap} />;
  if (!mapData) return null;

  // Группировка мест по рядам
  const rowsData = {};
  mapData.seats.forEach((seat) => {
    if (!rowsData[seat.row]) {
      rowsData[seat.row] = [];
    }
    rowsData[seat.row].push(seat);
  });

  // Автоматически находим цены для категорий из пришедшего массива мест для вывода в легенду
  const standardSeat = mapData.seats.find(s => s.tier_name === "Стандарт");
  const premiumSeat = mapData.seats.find(s => s.tier_name === "Стандарт+");

  const standardPrice = standardSeat ? parseInt(standardSeat.price) : 0;
  const premiumPrice = premiumSeat ? parseInt(premiumSeat.price) : 0;

  const handleSeatClick = (seat) => {
    if (seat.is_taken) return;
    const isAlreadySelected = selectedSeats.some(s => s.seat_id === seat.seat_id);
    if (isAlreadySelected) {
      setSelectedSeats(selectedSeats.filter(s => s.seat_id !== seat.seat_id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + parseFloat(seat.price), 0);
    // Функция, которая превращает сырые цифры в красивую маску на лету
    const handlePhoneChange = (e) => {
    const input = e.target.value;
    
    // 1. Если пользователь просто стирает символы — РАЗРЕШАЕМ делать это без всяких условий
    if (phone && input.length < phone.length) {
      setPhone(input);
      return;
    }

    // 2. Если пользователь вводит новые данные — включаем маску
    // Оставляем только чистые цифры
    const numValue = input.replace(/\D/g, '');
    if (!numValue) {
      setPhone('');
      return;
    }

    // Пропускаем первую 7 или 8, если пользователь начал вводить с неё
    const startIdx = (numValue[0] === '7' || numValue[0] === '8') ? 1 : 0;
    const digits = numValue.substring(startIdx);

    // Пошагово собираем маску по мере ввода цифр
    let formattedValue = '+7 ';
    if (digits.length > 0) formattedValue += '(' + digits.substring(0, 3);
    if (digits.length >= 3) formattedValue += ') ' + digits.substring(3, 6);
    if (digits.length >= 6) formattedValue += '-' + digits.substring(6, 8);
    if (digits.length >= 8) formattedValue += '-' + digits.substring(8, 10);

    // Записываем и ограничиваем длину (максимум 18 символов)
    setPhone(formattedValue.substring(0, 18));
  };


  const handleBookSubmit = (e) => {
    
    e.preventDefault();
    if (selectedSeats.length === 0) return alert("Пожалуйста, выберите хотя бы одно место.");
    if (!email || !phone) return alert("Заполните контактные данные для отправки билетов.");

    setBookingLoading(true);

    const bookingPayload = {
      session_id: parseInt(id),
      hall_seat_ids: selectedSeats.map(s => s.seat_id),
      customer_email: email,
      customer_phone: phone
    };

    fetch('http://127.0.0.1:8000/api/tickets/book/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload)
    })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.detail || "Ошибка бронирования") });
        return res.json();
      })
      .then((orderData) => {
        setBookingLoading(false);
        const pathParts = orderData.payment_url.split('/').filter(Boolean);
        const ticketsStr = pathParts[pathParts.length - 2]; 
        navigate(`/order-status/${ticketsStr}`);
      })
      .catch(err => {
        alert(err.message);
        setBookingLoading(false);
      });
  };

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate(-1)}>
        ← К расписанию
      </button>

      <header style={styles.header}>
        <h1 style={styles.movieTitle}>{mapData.movie_title}</h1>
        <p style={styles.hallTitle}>Зал: {mapData.hall_name}</p>
      </header>

      {/* ЛИНЕЙКА ЭКРАНА */}
      <div style={styles.screenWrapper}>
        <div style={styles.screen}>ЭКРАН</div>
      </div>

      {/* МИНИАТЮРНАЯ СХЕМА ЗАЛА */}
      <div style={styles.hallGrid}>
        {Object.keys(rowsData).map((rowNum) => (
          <div key={rowNum} style={styles.rowLine}>
            <span style={styles.rowNumber}>Ряд {rowNum}</span>
            <div style={styles.seatsRow}>
              {rowsData[rowNum].map((seat) => {
                const isSelected = selectedSeats.some(s => s.seat_id === seat.seat_id);
                return (
                  <SeatButton
                    key={seat.seat_id}
                    seat={seat}
                    isSelected={isSelected}
                    onClick={() => handleSeatClick(seat)}
                  />
                );
              })}
            </div>
            <span style={styles.rowNumber}>Ряд {rowNum}</span>
          </div>
        ))}
      </div>

      {/* ЛЕГЕНДА СХЕМЫ С ЦЕНАМИ МЕСТ */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={styles.seatPoint}></div>
          <span style={styles.legendText}>Стандарт <span style={styles.legendPrice}>({standardPrice} ₽)</span></span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.seatPoint, ...styles.seatPremium}}></div>
          <span style={styles.legendText}>Центр <span style={styles.legendPrice}>({premiumPrice} ₽)</span></span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.seatPoint, ...styles.seatSelected}}></div>
          <span style={styles.legendText}>Выбрано</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.seatPoint, ...styles.seatTaken}}></div>
          <span style={styles.legendText}>Занято</span>
        </div>
      </div>

      {/* ДЕТАЛИ ЗАКАЗА И КОНТАКТЫ */}
      {selectedSeats.length > 0 && (
        <div style={styles.orderSummary}>
          <div style={styles.summaryDetails}>
            <h3 style={{margin: '0 0 10px 0', fontSize: '17px', fontWeight: '700'}}>Выбранные места:</h3>
            <p style={styles.seatsList}>
              {selectedSeats.map(s => `Ряд ${s.row} место ${s.seat_number}`).join(', ')}
            </p>
            <p style={styles.totalPriceText}>Сумма заказа: <span style={styles.priceNum}>{totalPrice} ₽</span></p>
          </div>

          <form style={styles.form} onSubmit={handleBookSubmit}>
            <h4 style={styles.formTitle}>Куда отправить билеты?</h4>
            <input 
              type="email" 
              placeholder="Электронная почта" 
              required 
              style={styles.input} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="tel" 
              placeholder="Номер телефона" 
              required 
              style={styles.input} 
              value={phone}
              onChange={handlePhoneChange}
              maxLength="18" 
            />

            <button type="submit" style={styles.submitButton} disabled={bookingLoading}>
              {bookingLoading ? "Бронирование..." : "Перейти к оплате →"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '30px 20px', fontFamily: 'system-ui, sans-serif' },
  backButton: { background: 'none', border: 'none', color: '#0070f3', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '20px', padding: 0 },
  header: { textAlign: 'center', marginBottom: '25px' },
  movieTitle: { fontSize: '24px', fontWeight: '800', margin: '0 0 5px 0', color: '#1a1a1a' },
  hallTitle: { fontSize: '14px', color: '#666', margin: 0 },
  screenWrapper: { display: 'flex', justifyContent: 'center', marginBottom: '35px' },
  screen: { width: '60%', backgroundColor: '#e2e8f0', color: '#718096', textIndent: '4px', letterSpacing: '6px', textAlign: 'center', padding: '6px 0', fontSize: '10px', fontWeight: '700', borderRadius: '0 0 15px 15px' },
  hallGrid: { display: 'flex', flexDirection: 'column', gap: '6px', overflowX: 'auto', padding: '25px 15px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 2px 12px rgba(0,0,0,0.01)' },
  rowLine: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '950px', gap: '10px' },
  rowNumber: { fontSize: '11px', color: '#a0aec0', fontWeight: '600', width: '50px', textAlign: 'center', whiteSpace: 'nowrap' },
  seatsRow: { display: 'flex', gap: '5px', justifyContent: 'center', flexGrow: 1 },
  
  // Базовая круглая точка
  seatPoint: { width: '13px', height: '13px', backgroundColor: '#38bdf8', border: 'none', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.15s ease-in-out', padding: 0 },
  seatPremium: { backgroundColor: '#f43f5e' },
  seatSelected: { backgroundColor: '#0070f3', transform: 'scale(1.25)', boxShadow: '0 0 8px rgba(0,112,243,0.5)' },
  seatTaken: { backgroundColor: '#cbd5e1', cursor: 'not-allowed' },
  
  // Эффект плавного наведения на свободное кресло
  seatHover: {
    transform: 'scale(1.35)',
    boxShadow: '0 0 8px rgba(56,189,248,0.6)',
    backgroundColor: '#0288d1'
  },
  
  // Оформление легенды
  legend: { display: 'flex', justifyContent: 'center', gap: '25px', margin: '25px 0', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' },legendItem: { display: 'flex', alignItems: 'center', gap: '8px' },legendText: { fontSize: '13px', color: '#334155', fontWeight: '500' },legendPrice: { fontWeight: '700', color: '#1e293b' },orderSummary: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '30px', backgroundColor: '#fff', padding: '25px', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },seatsList: { fontSize: '14px', color: '#4a5568', fontWeight: '500', margin: '0 0 15px 0', lineHeight: '1.4' },totalPriceText: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: 0 },priceNum: { color: '#00c853', fontSize: '22px', fontWeight: '800' },form: { display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '1px solid #edf2f7', paddingLeft: '40px' },formTitle: { margin: '0 0 5px 0', fontSize: '14px', color: '#2d3748', fontWeight: '600' },input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '14px' },submitButton: { padding: '12px', backgroundColor: '#00c853', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', marginTop: '5px' }};
