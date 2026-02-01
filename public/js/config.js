// config.js - VERSIÓN SEGURA
(function() {
  'use strict';
  
  // Evitar duplicación
  if (window._CONFIG_LOADED) {
    console.warn('⚠️ config.js ya fue cargado anteriormente');
    return;
  }
  
  // Determinar entorno
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  
  // Configurar URL de API
  const API_URL = isLocalhost 
    ? 'http://localhost:3000/api'
    : 'https://gestion-clubes.onrender.com/api';
  
  // Hacer disponibles globalmente
  window.API_URL = API_URL;
  window.CONFIG = {
    API_URL: API_URL,
    ENV: isLocalhost ? 'development' : 'production',
    TIMESTAMP: new Date().toISOString()
  };
  
  // Marcar como cargado
  window._CONFIG_LOADED = true;
  
  console.log('✅ Config loaded:', {
    API_URL: API_URL,
    ENV: window.CONFIG.ENV,
    Timestamp: window.CONFIG.TIMESTAMP
  });
  
  // Verificar si hay conflictos
  if (typeof API_URL !== 'undefined' && window.API_URL !== API_URL) {
    console.warn('⚠️ Posible conflicto de variables API_URL');
  }
})();