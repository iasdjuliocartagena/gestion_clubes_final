// public/js/auth.js

// Quitar type="module" del HTML y usar window.API_URL
const API_URL = window.API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://gestion-clubes.onrender.com/api');

console.log('🔗 API URL:', API_URL);

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("loginForm");
  const errorText = document.getElementById("error");

  if (!form) {
    console.error('❌ No se encontró el formulario de login');
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = document.getElementById("user").value;
    const password = document.getElementById("password").value;
    
    console.log('📤 Login attempt:', { user });

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ user, password })
      });

      console.log('📥 Response status:', res.status);

      const data = await res.json();
      console.log('📥 Response data:', data);

      if (!res.ok) {
        errorText.textContent = data.error || "Credenciales incorrectas";
        return;
      }

      // Guardar sesión
      localStorage.setItem("token", data.token);
      localStorage.setItem("rol", data.user.rol);
      localStorage.setItem("club_id", data.user.club_id || '');
      localStorage.setItem("user_name", data.user.nombre || user);

      console.log('✅ Login successful, role:', data.user.rol);

      // Redirigir según rol
      if (data.user.rol.toLowerCase() === "distrital") {
        window.location.href = "/dashboard-distrital.html";
      } else {
        window.location.href = "/dashboard-director.html";
      }

    } catch (err) {
      console.error('❌ Login error:', err);
      errorText.textContent = "Error de conexión con el servidor. Verifica tu conexión.";
    }
  });
});