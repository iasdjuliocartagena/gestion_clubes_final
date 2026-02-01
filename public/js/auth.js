import { API_URL } from "./config.js";

const form = document.getElementById("loginForm");
const errorText = document.getElementById("error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = document.getElementById("user").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorText.textContent = data.error;
      return;
    }

    // Guardar sesión
    localStorage.setItem("token", data.token);
    localStorage.setItem("rol", data.user.rol);
    localStorage.setItem("club_id", data.user.club_id);

    // Redirigir según rol
    if (data.user.rol.toLowerCase() === "distrital") {
      window.location.href = "/dashboard-distrital.html";
    } else {
      window.location.href = "/dashboard-director.html";
    }

  } catch (err) {
    errorText.textContent = "Error de conexión con el servidor";
  }
});
