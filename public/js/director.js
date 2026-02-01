// director.js

// NO declarar API_URL aquí, usar window.API_URL
if (!window.API_URL) {
  console.error('❌ ERROR: config.js no se cargó');
  // Fallback
  window.API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://gestion-clubes.onrender.com/api';
}

const token = localStorage.getItem("token");
const clubId = localStorage.getItem("club_id");

console.log('🔧 director.js - API_URL:', window.API_URL);
console.log('🔧 Token:', token ? 'Presente' : 'Ausente');
console.log('🔧 Club ID:', clubId);

// ... el resto del código igual que antes ...
// Verificar autenticación
if (!token) {
  window.location.href = "/login.html";
  throw new Error("No autenticado");
}
console.log('🎯 Director panel loaded, club_id:', clubId);

// Resto de tu código director.js...

const btnVolver = document.getElementById("btnVolver");
const logoutBtn = document.getElementById("logoutBtn");

// 🎯 Mostrar botón correcto según rol
if (rol?.toLowerCase() === "distrital") {
  btnVolver.classList.remove("hidden");
} else {
  logoutBtn.classList.remove("hidden");
}

// 🔐 Proteger vista (director y distrital)
if (!token || !["director", "distrital"].includes(rol?.toLowerCase())) {
  document.body.classList.add("page-exit");
  setTimeout(() => {
    window.location.href = "/login.html";
  }, 300);
}

document.body.classList.add("animate-in");

// 🔹 Cargar nombre del club
async function cargarClub() {
  const clubNameEl = document.getElementById("clubName");

  // 🟢 DIRECTOR → su club desde API
  if (rol.toLowerCase() === "director") {
    try {
      const res = await fetch(`${API_URL}/clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      const club = Array.isArray(data) ? data[0] : data;

      localStorage.setItem("club_id", club.id);
      localStorage.setItem("club_nombre", club.nombre);

      clubNameEl.textContent = club.nombre;
    } catch (err) {
      console.error(err);
      clubNameEl.textContent = "MI CLUB";
    }
  }

  // 🔵 DISTRITAL → club elegido previamente
  else {
    const nombre = localStorage.getItem("club_nombre");
    clubNameEl.textContent = nombre ?? "CLUB";
  }
}

// 🔹 Cargar clases
async function cargarClases() {
  const res = await fetch(`${API_URL}/clases`);
  const clases = await res.json();

  const container = document.getElementById("classesContainer");
  container.innerHTML = "";

  clases.forEach((clase, index) => {
    const div = document.createElement("div");
    div.className = "class-card";
    div.innerHTML = `<h4>${clase.nombre}</h4>`;
    div.style.animationDelay = `${index * 0.07}s`;

    div.addEventListener("click", () => {
      // 🔑 Guardar info común
      localStorage.setItem("clase_id", clase.id);
      localStorage.setItem("clase_nombre", clase.nombre);

      // 🚫 Distrital → solo lectura
      if (rol.toLowerCase() === "distrital") {
        localStorage.setItem("solo_lectura", "true");
      } else {
        localStorage.setItem("solo_lectura", "false");
      }

      document.body.classList.add("page-exit");
      setTimeout(() => {
        window.location.href = "/clase.html";
      }, 300);
    });

    container.appendChild(div);
  });
}

cargarClub();
cargarClases();

// 🔹 Logout
logoutBtn?.addEventListener("click", () => {
  localStorage.clear();
  document.body.classList.add("page-exit");
  setTimeout(() => {
    window.location.href = "/login.html";
  }, 300);
});

// 🔁 Reanimar al volver atrás
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    document.body.style.opacity = "1";

    document.body.classList.remove("animate-in");
    void document.body.offsetWidth; // reflow
    document.body.classList.add("animate-in");

    document.querySelectorAll(".class-card").forEach((card, i) => {
      card.style.animation = "none";
      card.offsetHeight;
      card.style.animation = "";
      card.style.animationDelay = `${i * 0.07}s`;
    });
  }
});

btnVolver?.addEventListener("click", () => {
  document.body.classList.add("page-exit");

  setTimeout(() => {
    // Limpieza del club seleccionado
    localStorage.removeItem("club_id");
    localStorage.removeItem("club_nombre");

    window.location.href = "/dashboard-distrital.html";
  }, 300);
});
