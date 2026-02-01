// config.js
(function() {
  'use strict';
  
  if (window._CONFIG_LOADED) {
    console.warn('⚠️ config.js ya fue cargado anteriormente');
    return;
  }
  
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  
  const API_URL = isLocalhost 
    ? 'http://localhost:3000/api'
    : 'https://gestion-clubes.onrender.com/api';
  
  window.API_URL = API_URL;
  window.CONFIG = {
    API_URL: API_URL,
    ENV: isLocalhost ? 'development' : 'production',
    TIMESTAMP: new Date().toISOString()
  };
  
  window._CONFIG_LOADED = true;
  
  console.log('✅ Config loaded:', window.CONFIG);
})();