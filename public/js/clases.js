import { API_URL } from "./config.js";
document.body.classList.add("animate-in");

async function cargarClases() {
  const res = await fetch(`${API_URL}/clases`);
  const clases = await res.json();

  const contenedor = document.getElementById("clases");

  clases.forEach(clase => {
    const btn = document.createElement("button");
    btn.textContent = clase.nombre;
    btn.classList.add("btn-clase");

    btn.addEventListener("click", () => {
      localStorage.setItem("clase_id", clase.id);
      localStorage.setItem("clase_nombre", clase.nombre);
      localStorage.setItem("club_nombre", "MI CLUB"); // luego dinámico
      window.location.href = "clase.html";
    });

    contenedor.appendChild(btn);
  });
}

cargarClases();
