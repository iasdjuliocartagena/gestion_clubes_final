// director.js - VERSIÓN CORREGIDA CON ESTILOS ORIGINALES
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
const rol = localStorage.getItem("rol") || "director";
const clubId = localStorage.getItem("club_id");
const clubNombre = localStorage.getItem("club_nombre");
const modo = localStorage.getItem("modo");

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

// Verificar si tenemos club_id, si no, obtenerlo del backend
if (!clubId) {
  console.warn('⚠️ No hay club_id en localStorage, intentando obtener del usuario...');
  // Aquí deberías hacer una petición para obtener el club del usuario
}

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
  if (clubNameElement) {
    if (clubNombre) {
      // Si es distrital en modo lectura, agregar indicador
      if (esDistritalModoLectura) {
        clubNameElement.textContent = `${clubNombre} (MODO LECTURA)`;
        clubNameElement.style.color = '#7CFF8C'; // Verde como tu tema
        clubNameElement.style.fontSize = '1.2rem';
      } else {
        clubNameElement.textContent = clubNombre || "MI CLUB";
      }
    } else {
      // Si no hay clubNombre, poner texto por defecto
      clubNameElement.textContent = "MI CLUB";
    }
  }
  
  // Mostrar/ocultar botones según modo
  if (logoutBtn) {
    if (esDistritalModoLectura) {
      logoutBtn.style.display = 'none';
    } else {
      logoutBtn.classList.remove("hidden");
    }
    
    logoutBtn.addEventListener("click", function() {
      console.log('🚪 Cerrando sesión...');
      localStorage.clear();
      window.location.href = "/login.html";
    });
  }
  
  // Configurar botón volver
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
  
  // ============================================
  // 📚 CARGAR CLASES (MANTENIENDO TUS ESTILOS)
  // ============================================
  if (classesContainer) {
    await cargarClases();
  } else {
    console.error('❌ No se encontró el contenedor de clases');
  }
  
  // Mostrar mensaje si es modo lectura (con estilos)
  if (esDistritalModoLectura && classesContainer) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'modo-lectura-info';
    infoDiv.style.cssText = `
      background: rgba(0, 0, 0, 0.8);
      color: #7CFF8C;
      border-left: 4px solid #7CFF8C;
      padding: 12px;
      margin: 15px 0;
      border-radius: 4px;
      font-size: 0.9rem;
      text-align: center;
    `;
    infoDiv.innerHTML = `
      <strong>👁️ MODO LECTURA</strong>
      <p style="margin: 5px 0 0 0; color: #fff;">
        Estás visualizando este club en modo solo lectura. No puedes modificar datos.
      </p>
    `;
    classesContainer.prepend(infoDiv);
  }
});

// ============================================
// 📚 FUNCIÓN PARA CARGAR CLASES CON TUS ESTILOS
// ============================================
async function cargarClases() {
  try {
    console.log('📥 Cargando clases para club:', clubId);
    
    // Si no hay clubId, no podemos cargar clases
    if (!clubId) {
      console.error('❌ No hay club_id disponible');
      const container = document.getElementById("classesContainer");
      if (container) {
        container.innerHTML = `
          <div style="color: white; text-align: center; padding: 40px;">
            <p>No se pudo identificar el club</p>
            <button onclick="window.location.href='/login.html'" style="margin-top: 15px; padding: 10px 20px; background: #7CFF8C; border: none; cursor: pointer;">
              Volver al login
            </button>
          </div>
        `;
      }
      return;
    }
    
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
        <div style="color: white; text-align: center; padding: 30px;">
          <p>No hay clases registradas en este club</p>
          ${!esDistritalModoLectura ? 
            '<button onclick="crearNuevaClase()" style="margin-top: 15px; padding: 10px 20px; background: #7CFF8C; border: none; cursor: pointer;">➕ Crear nueva clase</button>' 
            : ''}
        </div>
      `;
      return;
    }
    
    // Array de colores según tu CSS
    const coloresClases = [
      '#2f80ed', // AMIGO - azul
      '#eb0000', // COMPAÑERO - rojo
      '#2e7d32', // EXPLORADOR - verde
      '#8e8e8e', // PIONERO - gris
      '#7b1fa2', // EXCURSIONISTA - morado
      '#cddc00'  // GUÍA - amarillo verdoso
    ];
    
    // Crear botones para cada clase CON TUS ESTILOS ORIGINALES
    clases.forEach((clase, index) => {
      // Crear DIV con clase class-card (como tu CSS original)
      const card = document.createElement("div");
      card.className = "class-card";
      card.style.cssText = `
        color: white;
        text-align: center;
        padding: 14px;
        font-size: 1.2rem;
        letter-spacing: 1px;
        cursor: pointer;
        border: none;
        opacity: 0;
        transform: translateY(8px);
        animation: itemIn 0.35s ease forwards ${index * 0.05}s;
      `;
      
      // Aplicar color según índice (ciclo si hay más de 6 clases)
      const colorIndex = index % coloresClases.length;
      card.style.backgroundColor = coloresClases[colorIndex];
      
      // Si es GUÍA (índice 5) y el color es amarillo, cambiar texto a negro
      if (colorIndex === 5) {
        card.style.color = '#000';
      }
      
      // Si es distrital modo lectura, hacer más transparente
      if (esDistritalModoLectura) {
        card.style.opacity = '0.8';
        card.style.border = '2px dashed rgba(255,255,255,0.3)';
      }
      
      // Contenido de la tarjeta
      card.innerHTML = `<h4>${clase.nombre}</h4>`;
      
      // Evento click
      card.addEventListener("click", function() {
        console.log('🎯 Clase seleccionada:', clase);
        
        // Guardar TODOS los datos necesarios para clase.html
        localStorage.setItem("clase_id", clase.id);
        localStorage.setItem("clase_nombre", clase.nombre);
        
        // Asegurar que tenemos club_nombre
        if (!localStorage.getItem("club_nombre") && clubNombre) {
          localStorage.setItem("club_nombre", clubNombre);
        }
        
        // Si falta club_nombre, intentar obtenerlo
        if (!localStorage.getItem("club_nombre")) {
          console.warn('⚠️ club_nombre no está en localStorage, usando valor por defecto');
          localStorage.setItem("club_nombre", "Mi Club");
        }
        
        console.log('📋 Datos guardados para clase:', {
          clase_id: clase.id,
          clase_nombre: clase.nombre,
          club_nombre: localStorage.getItem("club_nombre"),
          club_id: localStorage.getItem("club_id")
        });
        
        // Efecto de transición
        document.body.classList.add("page-exit");
        setTimeout(() => {
          window.location.href = "/clase.html";
        }, 300);
      });
      
      // Hover effect
      card.addEventListener("mouseenter", function() {
        if (!esDistritalModoLectura) {
          this.style.opacity = '0.9';
          this.style.transform = 'scale(1.02)';
        }
      });
      
      card.addEventListener("mouseleave", function() {
        if (!esDistritalModoLectura) {
          this.style.opacity = '1';
          this.style.transform = 'scale(1)';
        }
      });
      
      container.appendChild(card);
    });
    
  } catch (error) {
    console.error('❌ Error cargando clases:', error);
    
    const container = document.getElementById("classesContainer");
    if (container) {
      container.innerHTML = `
        <div style="color: white; text-align: center; padding: 40px; background: rgba(0,0,0,0.8); border-radius: 10px;">
          <p style="color: #ff6b6b; margin-bottom: 10px;">⚠️ Error al cargar las clases</p>
          <p style="font-size: 0.9rem; margin-bottom: 20px; color: #ccc;">${error.message}</p>
          <button onclick="cargarClases()" style="padding: 10px 20px; background: #7CFF8C; border: none; cursor: pointer; margin: 5px;">
            Reintentar
          </button>
          <button onclick="window.location.href='/dashboard-distrital.html'" style="padding: 10px 20px; background: #2f80ed; border: none; cursor: pointer; margin: 5px; color: white;">
            Volver a clubes
          </button>
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

console.log('✅ director.js inicializado correctamente');