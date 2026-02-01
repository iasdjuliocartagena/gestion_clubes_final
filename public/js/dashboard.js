import { API_URL } from "./config.js";
document.body.classList.add("animate-in");

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token || !user) {
  window.location.href = "login.html";
}

document.getElementById("title").textContent =
  user.rol === "Distrital"
    ? "Vista Distrital"
    : "Mi Club";

document.getElementById("logout").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

// 🔄 Obtener clubes
const res = await fetch(`${API_URL}/clubs`, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

const clubs = await res.json();

const ul = document.getElementById("clubs");

clubs.forEach(club => {
  const li = document.createElement("li");
  li.textContent = club.nombre;
  ul.appendChild(li);
});
