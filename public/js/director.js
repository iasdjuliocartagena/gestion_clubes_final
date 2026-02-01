// director.js - VERSIÓN CORREGIDA
// ============================================

console.log('🚀 director.js cargado');

// 🔧 VERIFICAR CONFIGURACIÓN
if (!window.API_URL) {
  console.warn('⚠️ config.js no se cargó, usando fallback');
  window.API_URL = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://gestion-clubes.onrender.com/api';
}

// OBTENER DATOS DE LOCALSTORAGE
const token = localStorage.getItem("token");
const rol = localStorage.getItem("rol") || "director"; // ← VALOR POR DEFECTO
const clubId = localStorage.getItem("club_id");
const clubNombre = localStorage.getItem("club_nombre");
const modo = localStorage.getItem("modo"); // Para distrital en modo lectura

console.log('🔧 director.js - Config:', {
  API_URL: window.API_URL,
  token: token ? 'Presente' : 'Ausente',
  rol: rol,
  clubId: clubId,
  clubNombre: clubNombre,
  modo: modo || 'escritura'
});

// ============================================
// 🔐 VERIFICAR AUTENTICACIÓN
// ============================================
if (!token) {
  console.error('❌ No autenticado, redirigiendo a login...');
  window.location.href = "/login.html";
  throw new Error("No autenticado");
}

// Si es distrital en modo lectura, mostrar indicador
const esDistritalModoLectura = (rol?.toLowerCase() === "distrital" && modo === "lectura");
if (esDistritalModoLectura) {
  console.log('👁️ Distrital en modo lectura');
}

console.log('✅ Director panel cargado, club_id:', clubId);

// ============================================
// 📋 INICIALIZAR PANEL
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
  console.log('✅ DOM cargado para director');
  
  // Configurar elementos del DOM
  const clubNameElement = document.getElementById("clubName");
  const logoutBtn = document.getElementById("logoutBtn");
  const btnVolver = document.getElementById("btnVolver");
  const classesContainer = document.getElementById("classesContainer");
  
  // 🔧 CONFIGURAR INTERFAZ
  if (clubNameElement && clubNombre) {
    // Si es distrital en modo lectura, agregar indicador
    if (esDistritalModoLectura) {
      clubNameElement.textContent = `${clubNombre} (MODO LECTURA)`;
      clubNameElement.style.color = '#666';
      clubNameElement.style.fontSize = '1.1em';
    } else {
      clubNameElement.textContent = clubNombre;
    }
  }
  
  // Mostrar/ocultar botones según modo
  if (logoutBtn && esDistritalModoLectura) {
    logoutBtn.style.display = 'none';
  }
  
  if (btnVolver) {
    if (esDistritalModoLectura) {
      btnVolver.classList.remove("hidden");
      btnVolver.textContent = "← Volver a clubes";
    } else {
      btnVolver.classList.add("hidden");
    }
    
    btnVolver.addEventListener("click", function() {
      if (esDistritalModoLectura) {
        // Distrital: volver a lista de clubes
        window.location.href = "/dashboard-distrital.html";
      } else {
        // Director: no hay volver
        window.history.back();
      }
    });
  }
  
  // Configurar logout
  if (logoutBtn && !esDistritalModoLectura) {
    logoutBtn.classList.remove("hidden");
    logoutBtn.addEventListener("click", function() {
      console.log('🚪 Cerrando sesión...');
      localStorage.clear();
      window.location.href = "/login.html";
    });
  }
  
  // ============================================
  // 📚 CARGAR CLASES
  // ============================================
  if (classesContainer) {
    await cargarClases();
  } else {
    console.error('❌ No se encontró el contenedor de clases');
  }
  
  // Mostrar mensaje si es modo lectura
  if (esDistritalModoLectura && classesContainer) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'modo-lectura-info';
    infoDiv.innerHTML = `
      <div style="background: #f0f8ff; border-left: 4px solid #007bff; padding: 10px; margin: 10px 0; border-radius: 4px;">
        <strong>👁️ MODO LECTURA</strong>
        <p style="margin: 5px 0 0 0; font-size: 0.9em; color: #555;">
          Estás visualizando este club en modo solo lectura. No puedes modificar datos.
        </p>
      </div>
    `;
    classesContainer.prepend(infoDiv);
  }
});

// ============================================
// 📚 FUNCIÓN PARA CARGAR CLASES
// ============================================
async function cargarClases() {
  try {
    console.log('📥 Cargando clases para club:', clubId);
    
    const response = await fetch(`${window.API_URL}/clases?club_id=${clubId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📤 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const clases = await response.json();
    console.log('📦 Clases recibidas:', clases);
    
    const container = document.getElementById("classesContainer");
    if (!container) return;
    
    container.innerHTML = "";
    
    if (!clases || clases.length === 0) {
      container.innerHTML = `
        <div class="no-classes">
          <p>No hay clases registradas en este club</p>
          ${!esDistritalModoLectura ? '<button onclick="crearNuevaClase()">➕ Crear nueva clase</button>' : ''}
        </div>
      `;
      return;
    }
    
    // Crear botones para cada clase
    clases.forEach((clase, index) => {
      const button = document.createElement("button");
      button.className = "class-button";
      button.textContent = clase.nombre;
      
      // Estilo especial para distrital
      if (esDistritalModoLectura) {
        button.style.backgroundColor = '#e9ecef';
        button.style.color = '#495057';
        button.style.border = '2px solid #dee2e6';
      }
      
      button.style.animationDelay = `${index * 0.05}s`;
      
      button.addEventListener("click", function() {
        console.log('🎯 Clase seleccionada:', clase);
        
        // Guardar datos de la clase
        localStorage.setItem("clase_id", clase.id);
        localStorage.setItem("clase_nombre", clase.nombre);
        
        // Redirigir a la página de la clase
        window.location.href = "/clase.html";
      });
      
      container.appendChild(button);
    });
    
  } catch (error) {
    console.error('❌ Error cargando clases:', error);
    
    const container = document.getElementById("classesContainer");
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <p>⚠️ Error al cargar las clases</p>
          <p style="font-size: 12px; margin-top: 10px;">${error.message}</p>
          <button onclick="cargarClases()" style="margin-top: 15px;">Reintentar</button>
        </div>
      `;
    }
  }
}

// ============================================
// 🛠️ FUNCIONES AUXILIARES GLOBALES
// ============================================

// Función para crear nueva clase (solo para directores)
window.crearNuevaClase = function() {
  if (esDistritalModoLectura) {
    alert('❌ No tienes permisos para crear clases en modo lectura');
    return;
  }
  
  const nombre = prompt("Nombre de la nueva clase:");
  if (!nombre) return;
  
  console.log('➕ Creando nueva clase:', nombre);
  // Aquí iría la lógica para crear la clase
  alert(`Clase "${nombre}" sería creada (función por implementar)`);
};

// Función global para recargar
window.recargarClases = cargarClases;

// Verificar si hay una sesión válida
window.verificarSesion = function() {
  return {
    token: localStorage.getItem("token"),
    rol: localStorage.getItem("rol"),
    clubId: localStorage.getItem("club_id"),
    clubNombre: localStorage.getItem("club_nombre"),
    modo: localStorage.getItem("modo")
  };
};

console.log('✅ director.js inicializado correctamente');