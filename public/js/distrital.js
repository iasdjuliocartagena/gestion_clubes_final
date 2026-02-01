const token = localStorage.getItem("token");
const rol = localStorage.getItem("rol");
document.body.classList.add("animate-in");

// 🔐 Proteger vista
if (!token || rol?.toLowerCase() !== "distrital") {
  document.body.classList.add("page-exit");
  setTimeout(() => {
    window.location.href = "/login.html";
  }, 300);
}

// 🔹 Cargar clubes
async function cargarClubes() {
  try {
    const res = await fetch("/api/clubs", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    const container = document.getElementById("clubsContainer");

    container.innerHTML = "";

    data.forEach((club, index) => {
      const div = document.createElement("div");
      div.className = "club-button";
      div.textContent = club.nombre;
      div.style.animationDelay = `${index * 0.07}s`;

      // 👉 CLICK EN CLUB

    div.addEventListener("click", () => {
      document.body.classList.add("page-exit");

      setTimeout(() => {
        localStorage.setItem("club_id", club.id);
        localStorage.setItem("club_nombre", club.nombre);

        // 🔑 CLAVE
        localStorage.setItem("modo", "lectura");

        window.location.href = "/dashboard-director.html";
      }, 300);
    });



      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
  }
}

cargarClubes();

// 🔹 Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  document.body.classList.add("page-exit");
  setTimeout(() => {
    window.location.href = "/login.html";
  }, 300);
});

// 🔙 Volver
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  document.body.classList.add("page-exit");
  setTimeout(() => {
    window.location.href = "/login.html";
  }, 300);
});
