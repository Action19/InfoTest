import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/css/index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ─── Service Worker Registration (PWA) ───────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW: Registered successfully', registration.scope);

        // Background Sync ni register qilish
        if ('sync' in registration) {
          registration.sync.register('sync-submissions')
            .then(() => console.log('🔄 SW: Background sync registered'))
            .catch((err) => console.log('⚠️ SW: Background sync not supported', err));
        }

        // Yangilanishlarni tekshirish
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('🆕 SW: New version available');
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ SW: Registration failed:', error);
      });

    // Service Worker dan xabarlarni qabul qilish
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SYNC_COMPLETE') {
        // Offline saqlangan javoblar yuborildi
        const count = event.data.count;
        showNotification(`✅ ${count} ta offline javob muvaffaqiyatli yuborildi!`);
      }

      // SW token so'raganda
      if (event.data.type === 'GET_TOKEN') {
        const token = localStorage.getItem('token');
        event.ports[0].postMessage({ token });
      }
    });
  });
}

// Bildirishnoma ko'rsatish (oddiy toast)
function showNotification(message) {
  // Custom event dispatch qilish — App.js da ushlab olinadi
  window.dispatchEvent(new CustomEvent('sw-notification', {
    detail: { message }
  }));
}
