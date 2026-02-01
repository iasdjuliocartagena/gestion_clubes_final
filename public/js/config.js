// public/js/config.js
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

const API_URL = isLocalhost 
  ? 'http://localhost:3000/api'
  : 'https://gestion-clubes.onrender.com/api';

// Hacer global
window.API_URL = API_URL;
window.CONFIG = {
  API_URL: API_URL,
  ENV: isLocalhost ? 'development' : 'production'
};

console.log('✅ Config loaded:', window.CONFIG);