import React from 'react';

export default function Loader({ message = "Загрузка..." }) {
  return (
    <div style={styles.center}>
      <div style={styles.spinner}></div>
      <p style={styles.text}>{message}</p>
    </div>
  );
}

const styles = {
  center: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', fontFamily: 'sans-serif' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #0070f3', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  text: { marginTop: '15px', color: '#666', fontSize: '15px' }
};