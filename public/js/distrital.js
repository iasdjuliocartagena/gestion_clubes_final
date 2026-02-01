// public/js/distrital.js

// Configuración API URL
const API_URL = window.API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://gestion-clubes.onrender.com/api');

const token = localStorage.getItem("token");
const rol = localStorage.getItem("rol");

// Mostrar info de debug
console.log('🔧 Distrital config:', { API_URL, token, rol });

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add("animate-in");

  // 🔐 Proteger vista
  if (!token || rol?.toLowerCase() !== "distrital") {
    console.warn('❌ Acceso no autorizado, redirigiendo...');
    document.body.classList.add("page-exit");
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 300);
    return;
  }

  // Cargar clubes
  cargarClubes();

  // 🔹 Logout
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.clear();
    document.body.classList.add("page-exit");
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 300);
  });
});

// 🔹 Cargar clubes
async function cargarClubes() {
  try {
    console.log('📥 Cargando clubes...');
    const res = await fetch(`${API_URL}/clubs`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📤 Response status:', res.status);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log('📦 Clubes recibidos:', data);

    const container = document.getElementById("clubsContainer");

    if (!container) {
      console.error('❌ No se encontró el contenedor de clubes');
      return;
    }

    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = '<p class="no-data">No hay clubes registrados</p>';
      return;
    }

    data.forEach((club, index) => {
      const div = document.createElement("div");
      div.className = "club-button";
      div.textContent = club.nombre || `Club ${club.id}`;
      div.style.animationDelay = `${index * 0.07}s`;

      // 👉 CLICK EN CLUB
      div.addEventListener("click", () => {
        console.log('🎯 Club seleccionado:', club);
        document.body.classList.add("page-exit");

        setTimeout(() => {
          localStorage.setItem("club_id", club.id);
          localStorage.setItem("club_nombre", club.nombre || `Club ${club.id}`);
          
          // 🔑 CLAVE: Modo lectura para distrital
          localStorage.setItem("modo", "lectura");

          window.location.href = "/dashboard-director.html";
        }, 300);
      });

      container.appendChild(div);
    });

  } catch (err) {
    console.error('❌ Error cargando clubes:', err);
    const container = document.getElementById("clubsContainer");
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <p>⚠️ Error al cargar los clubes</p>
          <p style="font-size: 12px; margin-top: 10px;">${err.message}</p>
          <button onclick="cargarClubes()" style="margin-top: 15px;">Reintentar</button>
        </div>
      `;
    }
  }
}

// Hacer función global para reintento
window.cargarClubes = cargarClubes;