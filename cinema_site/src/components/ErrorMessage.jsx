import React from 'react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h3 style={styles.title}>⚠️ Ошибка подключения</h3>
        <p style={styles.text}>{message}</p>
        {onRetry && <button style={styles.button} onClick={onRetry}>Повторить попытку</button>}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', fontFamily: 'sans-serif' },
  box: { textAlign: 'center', padding: '25px', border: '1px solid #ffcdd2', backgroundColor: '#ffebee', borderRadius: '12px', maxWidth: '400px' },
  title: { margin: '0 0 10px 0', color: '#c62828' },
  text: { color: '#555', fontSize: '14px', margin: '0 0 15px 0' },
  button: { padding: '8px 16px', backgroundColor: '#d32f2f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }
};
