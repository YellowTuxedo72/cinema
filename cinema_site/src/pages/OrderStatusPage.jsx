import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

export default function OrderStatusPage() {
  const { ticketsStr } = useParams(); // Достаем ID билетов из URL (например, "4,5")
  const navigate = useNavigate();

  // Состояния для управления экраном
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false); // Лоадер для процесса клика по оплате

  // Функция для получения актуального статуса билетов с бэкенда
  const loadOrderStatus = () => {
    setLoading(true);
    setError(null);
    fetch(`http://31.129.106.22:8000/api/tickets/order-status/${ticketsStr}/`)
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось получить данные о заказе.");
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOrderStatus();
  }, [ticketsStr]);

  // Функция имитации клика по кнопке "Оплатить"
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setPaying(true);

    // Стучимся на созданный нами в Django Ninja эндпоинт фейк-оплаты
    fetch(`http://127.0.0.1:8000/api/payment/mock/${ticketsStr}/pay/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка при обработке платежа.");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          // Если банк "подтвердил" оплату — обновляем данные на экране
          loadOrderStatus();
        } else {
          alert(data.error || "Платеж отклонен");
        }
        setPaying(false);
      })
      .catch((err) => {
        alert(err.message);
        setPaying(false);
      });
  };

  if (loading) return <Loader message="Загрузка деталей заказа..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadOrderStatus} />;
  if (!order) return null;

  const isPaid = order.status === 'paid';

  // Красивое форматирование даты сеанса
  const sessionDate = new Date(order.start_time).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', weekday: 'short'
  });
  const sessionTime = new Date(order.start_time).toLocaleTimeString('ru-RU', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div style={styles.container}>
      
      {/* СЦЕНАРИЙ А: БИЛЕТЫ ЕЩЕ НЕ ОПЛАЧЕНЫ (ЭКРАН БАНКОВСКОГО ШЛЮЗА) */}
      {!isPaid ? (
        <div style={styles.paymentGateway}>
          <div style={styles.gatewayHeader}>
            <span style={styles.bankLogo}>💳 SecurePay</span>
            <span style={styles.timer}>Ожидание оплаты...</span>
          </div>
          
          <div style={styles.paymentInfo}>
            <p style={styles.label}>К оплате за билеты на фильм «{order.movie_title}»</p>
            <h2 style={styles.amount}>{order.total_price} ₽</h2>
          </div>

          <form onSubmit={handlePaymentSubmit} style={styles.cardForm}>
            <div style={styles.mockCard}>
              <input type="text" placeholder="0000 0000 0000 0000" disabled style={styles.cardInput} value="4111 1111 1111 1111" />
              <div style={{display: 'flex', gap: '10px'}}>
                <input type="text" placeholder="12/29" disabled style={styles.cardInputSmall} />
                <input type="password" placeholder="***" disabled style={styles.cardInputSmall} />
              </div>
              <span style={styles.cardNote}>* Учебный проект: данные карты зафиксированы</span>
            </div>

            <button type="submit" style={styles.payButton} disabled={paying}>
              {paying ? "Списание средств..." : `Оплатить ${order.total_price} ₽`}
            </button>
          </form>
        </div>
      ) : (
        
        /* СЦЕНАРИЙ Б: УСПЕШНАЯ ОПЛАТА (ЭЛЕКТРОННЫЙ ЧЕК И БИЛЕТЫ) */
        <div style={styles.ticketCheck}>
          <div style={styles.successBadge}>
            <div style={styles.successIcon}>✓</div>
            <h2>Билеты успешно оплачены!</h2>
            <p>Электронный чек и бланки отправлены на <strong>{order.customer_email}</strong></p>
          </div>

          <div style={styles.receiptBody}>
            <div style={styles.receiptLine}><strong>Фильм:</strong> <span>{order.movie_title}</span></div>
            <div style={styles.receiptLine}><strong>Кинозал:</strong> <span>{order.hall_name}</span></div>
            <div style={styles.receiptLine}><strong>Дата и время:</strong> <span>{sessionDate}, в {sessionTime}</span></div>
            <div style={styles.receiptLine}><strong>Сумма платежа:</strong> <span style={styles.greenText}>{order.total_price} ₽</span></div>
            
            <div style={styles.divider}></div>
            
            <h3>Ваши электронные бланки:</h3>
            <div style={styles.ticketsGrid}>
              {order.tickets.map((ticket) => (
                <div key={ticket.ticket_id} style={styles.ticketCard}>
                  <div style={styles.ticketLeft}>
                    <p style={styles.ticketLabel}>РЯД</p>
                    <p style={styles.ticketValue}>{ticket.row}</p>
                    <p style={styles.ticketLabel}>МЕСТО</p>
                    <p style={styles.ticketValue}>{ticket.seat_number}</p>
                  </div>
                  <div style={styles.ticketRight}>
                    {/* Фейковый QR-код, сгенерированный с помощью бесплатного сервиса картинок */}
                    <img 
                      src={`https://qrserver.com/${ticket.ticket_id}`}
                      alt="QR-код билета" 
                      style={styles.qrCode}
                    />
                    <span style={styles.ticketId}>№ {ticket.ticket_id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button style={styles.homeButton} onClick={() => navigate('/')}>
            Вернуться на главную афишу
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '600px', margin: '50px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' },
  paymentGateway: { backgroundColor: '#fff', borderRadius: '20px', padding: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #eee' },
  gatewayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' },
  bankLogo: { fontWeight: '800', fontSize: '18px', color: '#1e3a8a' },
  timer: { fontSize: '13px', color: '#ef4444', backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' },
  paymentInfo: { textAlign: 'center', marginBottom: '30px' },
  label: { color: '#666', margin: '0 0 8px 0', fontSize: '15px' },
  amount: { fontSize: '36px', fontWeight: '900', color: '#1a1a1a', margin: 0 },
  cardForm: { display: 'flex', flexDirection: 'column', gap: '20px' },
  mockCard: { backgroundColor: '#1e293b', borderRadius: '15px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
  cardInput: { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#334155', color: '#fff', fontSize: '16px', letterSpacing: '2px', fontFamily: 'monospace' },
  cardInputSmall: { width: '45%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#334155', color: '#fff', fontSize: '14px', textAlign: 'center' },
  cardNote: { color: '#94a3b8', fontSize: '11px', textAlign: 'center', marginTop: '5px' },
  payButton: { padding: '15px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', boxShadow: '0 4px 14px rgba(0,112,243,0.3)' },
  
  ticketCheck: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #eee', textAlign: 'center' },
  successBadge: { marginBottom: '30px' },
  successIcon: { width: '60px', height: '60px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 'bold', margin: '0 auto 15px auto' },
  receiptBody: { textAlign: 'left', backgroundColor: '#f8fafc', padding: '25px', borderRadius: '16px', marginBottom: '30px', border: '1px dashed #cbd5e1' },
  receiptLine: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px', color: '#334155' },
  greenText: { color: '#16a34a', fontWeight: '800', fontSize: '18px' },
  divider: { height: '1px', backgroundColor: '#e2e8f0', margin: '20px 0' },
  ticketsGrid: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' },
  ticketCard: { display: 'flex', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', height: '90px' },
  ticketLeft: { width: '60%', backgroundColor: '#f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px', alignItems: 'center', borderRight: '2px dashed #cbd5e1' },
  ticketLabel: { fontSize: '10px', color: '#64748b', margin: 0, fontWeight: '700' },
  ticketValue: { fontSize: '18px', color: '#0f172a', margin: 0, fontWeight: '800' },
  ticketRight: { width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '5px' },
  qrCode: { width: '60px', height: '60px' },
  ticketId: { fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }, homeButton: { width: '100%', padding: '14px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }};
