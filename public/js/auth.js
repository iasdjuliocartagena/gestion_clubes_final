// auth.js - VERSIÓN FINAL SIN CONFLICTOS
// ============================================

// 🔧 VERIFICAR SI CONFIG.JS SE CARGÓ
(function initAuth() {
  console.log('🚀 auth.js cargado');
  
  // Si config.js no se cargó, definir API_URL aquí
  if (typeof window.API_URL === 'undefined') {
    console.warn('⚠️ config.js no se cargó, usando fallback');
    window.API_URL = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000/api'
      : 'https://gestion-clubes.onrender.com/api';
  }
  
  console.log('🔗 API_URL configurada:', window.API_URL);
})();

// ============================================
// 📋 ESPERAR A QUE EL DOM ESTÉ LISTO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ DOM cargado, inicializando login...');
  
  const form = document.getElementById("loginForm");
  const errorText = document.getElementById("error");
  const userInput = document.getElementById("user");
  const passwordInput = document.getElementById("password");

  // 🔍 VERIFICAR ELEMENTOS DEL DOM
  if (!form) {
    console.error('❌ ERROR: No se encontró el formulario con id="loginForm"');
    return;
  }
  
  if (!userInput || !passwordInput) {
    console.error('❌ ERROR: Campos de usuario o contraseña no encontrados');
    return;
  }

  // 🔗 VERIFICAR URL DE API
  const API_URL = window.API_URL;
  if (!API_URL) {
    console.error('❌ ERROR CRÍTICO: API_URL no está definida');
    errorText.textContent = "Error de configuración. Recarga la página.";
    return;
  }
  
  console.log('🔗 Endpoint de login:', `${API_URL}/auth/login`);

  // ============================================
  // 🎯 CONFIGURAR EVENTO DE LOGIN
  // ============================================
  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    console.log('📤 Iniciando proceso de login...');

    // Limpiar mensajes anteriores
    errorText.textContent = "";
    errorText.classList.remove("error-visible");

    // Obtener valores
    const user = userInput.value.trim();
    const password = passwordInput.value;

    // Validaciones básicas
    if (!user) {
      showError("⚠️ Ingresa tu usuario");
      userInput.focus();
      return;
    }
    
    if (!password) {
      showError("⚠️ Ingresa tu contraseña");
      passwordInput.focus();
      return;
    }

    // Mostrar indicador de carga
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Conectando...";
    submitBtn.disabled = true;

    try {
      console.log('📤 Enviando credenciales a:', `${API_URL}/auth/login`);
      console.log('📤 Datos:', { user: user, password: '••••••' });

      // Realizar petición
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ user, password }),
        // Timeout de 30 segundos
        signal: AbortSignal.timeout(30000)
      });

      console.log('📥 Respuesta recibida, status:', res.status);

      // Intentar parsear respuesta
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error('❌ Error parseando respuesta JSON:', parseError);
        throw new Error("Respuesta inválida del servidor");
      }

      console.log('📥 Datos de respuesta:', data);

      // Verificar si hay error
      if (!res.ok) {
        const errorMsg = data.error || data.message || `Error ${res.status}: ${res.statusText}`;
        console.error('❌ Error en login:', errorMsg);
        showError(`❌ ${errorMsg}`);
        return;
      }

      // ✅ LOGIN EXITOSO
      console.log('✅ Login exitoso:', {
        token: data.token ? "Presente" : "Ausente",
        rol: data.user?.rol,
        user: data.user
      });

      // Guardar datos en localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("rol", data.user?.rol || "");
      localStorage.setItem("club_id", data.user?.club_id || "");
      localStorage.setItem("user_name", data.user?.nombre || user);
      localStorage.setItem("user_id", data.user?.id || "");

      // Limpiar formulario
      userInput.value = "";
      passwordInput.value = "";

      // Mostrar mensaje de éxito
      errorText.textContent = "✅ Login exitoso, redirigiendo...";
      errorText.style.color = "green";
      errorText.classList.add("error-visible");

      // Pequeña pausa para mostrar mensaje
      await new Promise(resolve => setTimeout(resolve, 800));

      // Redirigir según rol
      const rol = (data.user?.rol || "").toLowerCase();
      
      if (rol === "distrital") {
        console.log('🔄 Redirigiendo a panel distrital...');
        window.location.href = "/dashboard-distrital.html";
      } else if (rol === "director" || rol === "instructor") {
        console.log('🔄 Redirigiendo a panel director...');
        window.location.href = "/dashboard-director.html";
      } else {
        console.warn('⚠️ Rol desconocido:', rol, 'redirigiendo a director');
        window.location.href = "/dashboard-director.html";
      }

    } catch (err) {
      console.error('❌ Error en login:', err);
      
      // Mensajes de error específicos
      let errorMessage = "Error de conexión con el servidor";
      
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        errorMessage = "⏱️ Tiempo de espera agotado. Verifica tu conexión a internet.";
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = "🔌 No se pudo conectar al servidor. Verifica tu conexión.";
      } else if (err.message) {
        errorMessage = `❌ ${err.message}`;
      }
      
      showError(errorMessage);
      
      // Sugerencia para localhost
      if (window.location.hostname === 'localhost' && API_URL.includes('onrender.com')) {
        console.warn('💡 Estás en localhost pero usando API de producción. ¿Es correcto?');
      }
      
    } finally {
      // Restaurar botón
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // ============================================
  // 🛠️ FUNCIONES AUXILIARES
  // ============================================
  
  function showError(message) {
    errorText.textContent = message;
    errorText.classList.add("error-visible");
    
    // Scroll al error si es necesario
    errorText.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ============================================
  // 🎪 CONFIGURACIÓN ADICIONAL
  // ============================================
  
  // Auto-focus en usuario al cargar
  userInput.focus();
  
  // Limpiar error al empezar a escribir
  userInput.addEventListener('input', () => {
    errorText.textContent = "";
    errorText.classList.remove("error-visible");
  });
  
  passwordInput.addEventListener('input', () => {
    errorText.textContent = "";
    errorText.classList.remove("error-visible");
  });
  
  // Atajo de teclado: Enter para login
  form.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.type !== 'submit') {
      // El submit ya se maneja con el evento submit
    }
  });
  
  // Mostrar info de debug en consola
  console.log('🎯 Login inicializado correctamente');
  console.log('🔧 Entorno:', window.CONFIG?.ENV || 'desconocido');
  console.log('🔗 API Base:', window.API_URL);
  console.log('🔗 URL Completa:', window.location.href);
});

// ============================================
// 📊 FUNCIONES GLOBALES PARA DEBUG
// ============================================

// Función para probar conexión manualmente
window.testConnection = async function() {
  try {
    const API_URL = window.API_URL;
    console.log('🧪 Probando conexión a:', API_URL);
    
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    console.log('✅ Conexión exitosa:', data);
    alert(`✅ Servidor respondió: ${data.status || 'OK'}`);
    return data;
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    alert(`❌ Error: ${error.message}`);
    return null;
  }
};

// Función para limpiar localStorage
window.clearLoginData = function() {
  localStorage.removeItem("token");
  localStorage.removeItem("rol");
  localStorage.removeItem("club_id");
  localStorage.removeItem("user_name");
  console.log('🧹 Datos de login limpiados');
  alert('Datos de sesión limpiados. Recarga la página.');
};