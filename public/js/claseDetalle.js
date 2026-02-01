import { API_URL } from "./config.js";

document.body.classList.add("animate-in");

const token = localStorage.getItem("token");
const rol = localStorage.getItem("rol");
const esDistrital = rol?.toLowerCase() === "distrital";


let requisitos = [];
let conquistadores = [];
let progreso = [];
let conquistadorSeleccionado = null;

/* ========================= INIT ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const claseId = localStorage.getItem("clase_id");
  const claseNombre = localStorage.getItem("clase_nombre");
  const clubNombre = localStorage.getItem("club_nombre");

  if (!claseId || !claseNombre || !clubNombre) {
    document.getElementById("tituloClase").textContent = "Clase no seleccionada";
    return;
  }

  document.getElementById("tituloClase").textContent =
    `${claseNombre} – ${clubNombre}`;

  // 🔒 BLOQUEO PARA DISTRITAL
  if (esDistrital) {
    document.getElementById("btnAdd")?.classList.add("hidden");
    document.querySelector(".btn-editar")?.classList.add("hidden");
    document.querySelector(".btn-eliminar")?.classList.add("hidden");
  }

  await cargarRequisitos(claseId);
  await cargarConquistadores();
  await cargarProgresoDeTodos();
  renderTabla();
});

/* ========================= REQUISITOS ========================= */
async function cargarRequisitos(claseId) {
  const res = await fetch(`${API_URL}/requisitos/${claseId}`);
  requisitos = await res.json();

  const ordenCategorias = [
    "Generales",
    "Descubrimiento espiritual",
    "Sirviendo a los demás",
    "Desarrollo de la amistad",
    "Salud y aptitud física",
    "Organización y liderazgo",
    "Estudio de la naturaleza",
    "Arte de acampar",
    "Estilo de vida",
  ];

  requisitos.sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === "regular" ? -1 : 1;
    const catA = ordenCategorias.indexOf(a.categoria);
    const catB = ordenCategorias.indexOf(b.categoria);
    if (catA !== catB) return catA - catB;
    return a.orden - b.orden;
  });

  const thead = document.getElementById("thead");
  thead.innerHTML = "<th>Conquistador</th>";

  requisitos.forEach((req) => {
    const th = document.createElement("th");
    th.textContent = req.titulo;
    if (req.tipo === "avanzada") th.classList.add("avanzada");
    thead.appendChild(th);
  });
}

/* ========================= CONQUISTADORES ========================= */
async function cargarConquistadores() {
  const clase = localStorage.getItem("clase_nombre");
  console.log("TOKEN:", localStorage.getItem("token"));
  const clubId = localStorage.getItem("club_id");

  const res = await fetch(
    `${API_URL}/conquistadores/clase/${clase}?club_id=${clubId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  conquistadores = await res.json();

  if (!Array.isArray(conquistadores)) {
    conquistadores = [];
  }
}

/* ========================= PROGRESO ========================= */
async function cargarProgresoDeTodos() {
  progreso = [];

  await Promise.all(
    conquistadores.map(async (c) => {
      const res = await fetch(`${API_URL}/progreso/${c.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!Array.isArray(data)) return;

      data.forEach((p) => {
        progreso.push({
          conquistador_id: String(c.id),
          requisito_id: String(p.requisito_id),
          cumplido: !!p.cumplido,
        });
      });
    })
  );
}

/* ========================= RENDER TABLA ========================= */
function renderTabla() {
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";

  conquistadores.forEach((c) => {
    const tr = document.createElement("tr");

    if (conquistadorSeleccionado?.id === c.id) {
      tr.classList.add("seleccionado");
    }

    tr.addEventListener("click", () => seleccionarConquistador(c));

    const tdNombre = document.createElement("td");
    tdNombre.textContent = c.nombre;
    tr.appendChild(tdNombre);

    requisitos.forEach((req) => {
      const td = document.createElement("td");
      if (req.tipo === "avanzada") td.classList.add("avanzada");

      const checkbox = crearCheckbox(c.id, req.id);
      td.appendChild(checkbox);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

/* ========================= CHECKBOX ========================= */
function crearCheckbox(conquistadorId, requisitoId) {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  // 🚫 DISTRITAL = SOLO LECTURA
  if (esDistrital) {
    checkbox.disabled = true; // ← CLAVE
  }

  checkbox.addEventListener("click", (e) => e.stopPropagation());

  const existe = progreso.find(
    (p) =>
      p.conquistador_id === String(conquistadorId) &&
      p.requisito_id === String(requisitoId) &&
      p.cumplido
  );

  checkbox.checked = !!existe;

  // ❌ NO listener change para distrital
  if (!esDistrital) {
    checkbox.addEventListener("change", async () => {
      try {
        const res = await fetch(`${API_URL}/progreso`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conquistador_id: conquistadorId,
            requisito_id: requisitoId,
            cumplido: checkbox.checked,
          }),
        });

        if (!res.ok) throw new Error();

        const index = progreso.findIndex(
          (p) =>
            p.conquistador_id === String(conquistadorId) &&
            p.requisito_id === String(requisitoId)
        );

        if (index >= 0) {
          progreso[index].cumplido = checkbox.checked;
        } else {
          progreso.push({
            conquistador_id: String(conquistadorId),
            requisito_id: String(requisitoId),
            cumplido: checkbox.checked,
          });
        }

        actualizarPanel();
      } catch (err) {
        console.error(err);
        checkbox.checked = !checkbox.checked;
        alert("No se pudo actualizar el progreso");
      }
    });
  }

  return checkbox;
}

/* ========================= SELECCIÓN ========================= */
function seleccionarConquistador(c) {
  conquistadorSeleccionado = c;
  renderTabla();
  actualizarPanel();
}

/* ========================= PANEL ========================= */
function actualizarPanel() {
  const panel = document.getElementById("panelAcciones");

  if (!conquistadorSeleccionado) {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");
  document.getElementById("nombreSeleccionado").textContent =
    conquistadorSeleccionado.nombre;

  const totalRegular = requisitos.filter((r) => r.tipo === "regular").length;
  const totalAvanzada = requisitos.filter((r) => r.tipo === "avanzada").length;

  const completadosRegular = progreso.filter(
    (p) =>
      p.conquistador_id === String(conquistadorSeleccionado.id) &&
      p.cumplido &&
      requisitos.find((r) => r.id === p.requisito_id)?.tipo === "regular"
  ).length;

  const completadosAvanzada = progreso.filter(
    (p) =>
      p.conquistador_id === String(conquistadorSeleccionado.id) &&
      p.cumplido &&
      requisitos.find((r) => r.id === p.requisito_id)?.tipo === "avanzada"
  ).length;

  const porcentajeRegular =
    Math.round((completadosRegular / totalRegular) * 100) || 0;
  const porcentajeAvanzada =
    Math.round((completadosAvanzada / totalAvanzada) * 100) || 0;

  document.getElementById("porcentaje").innerHTML = `
    Clase regular: ${porcentajeRegular}%<br>
    Clase avanzada: ${porcentajeAvanzada}%
  `;
}

/* ========================= EDITAR ========================= */
window.editarSeleccionado = function () {
  if (!conquistadorSeleccionado) {
    alert("Selecciona un conquistador primero");
    return;
  }

  localStorage.setItem(
    "conquistador_editar",
    JSON.stringify(conquistadorSeleccionado)
  );

  document.getElementById("modalEditar")?.classList.remove("hidden");
};

/* ========================= ELIMINAR ========================= */
window.eliminarSeleccionado = async function () {
  if (!conquistadorSeleccionado) {
    alert("Selecciona un conquistador primero");
    return;
  }

  const ok = confirm(
    `¿Eliminar a ${conquistadorSeleccionado.nombre}?`
  );
  if (!ok) return;

  try {
    const res = await fetch(
      `${API_URL}/conquistadores/${conquistadorSeleccionado.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error("Error al eliminar");

    conquistadores = conquistadores.filter(
      (c) => c.id !== conquistadorSeleccionado.id
    );

    progreso = progreso.filter(
      (p) => p.conquistador_id !== String(conquistadorSeleccionado.id)
    );

    conquistadorSeleccionado = null;
    renderTabla();
    actualizarPanel();
  } catch (err) {
    console.error(err);
    alert("No se pudo eliminar");
  }
};

/* ========================= VOLVER ========================= */
document.getElementById("btnVolver").addEventListener("click", () => {
  window.history.back();
});

/* =========================
   MODAL (AÑADIR / EDITAR)
========================= */

const modal = document.getElementById("modalConquistador");
const inputNombre = document.getElementById("inputNombre");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const btnAdd = document.getElementById("btnAdd");

let modoEdicion = false;

/* ---------- ABRIR MODAL ---------- */
function abrirModal(nombre = "") {
  inputNombre.value = nombre;
  modal.classList.remove("hidden");
  inputNombre.focus();
}

/* ---------- CERRAR MODAL ---------- */
function cerrarModal() {
  modal.classList.add("hidden");
  inputNombre.value = "";
  modoEdicion = false;
}

/* =========================
   AÑADIR
========================= */
btnAdd.addEventListener("click", () => {
  modoEdicion = false;
  document.getElementById("modalTitulo").textContent =
    "Nuevo Conquistador";
  abrirModal();
});

/* =========================
   EDITAR
========================= */
window.editarSeleccionado = function () {
  if (!conquistadorSeleccionado) {
    alert("Selecciona un conquistador primero");
    return;
  }

  modoEdicion = true;
  document.getElementById("modalTitulo").textContent =
    "Editar Conquistador";

  abrirModal(conquistadorSeleccionado.nombre);
};

/* =========================
   GUARDAR (POST / PUT)
========================= */
btnGuardar.addEventListener("click", async () => {
  const nombre = inputNombre.value.trim();
  if (!nombre) {
    alert("Escribe un nombre");
    return;
  }

  try {
    let res;

    if (modoEdicion) {
      // ✏️ EDITAR
      res = await fetch(
        `${API_URL}/conquistadores/${conquistadorSeleccionado.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nombre }),
        }
      );

      if (!res.ok) throw new Error();

      conquistadorSeleccionado.nombre = nombre;
    } else {
      // ➕ CREAR
      res = await fetch(`${API_URL}/conquistadores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre,
          clase: localStorage.getItem("clase_nombre"),
        }),
      });

      const nuevo = await res.json();
      conquistadores.push(nuevo);
    }

    cerrarModal();
    renderTabla();
    actualizarPanel();
  } catch (err) {
    console.error(err);
    alert("No se pudo guardar");
  }
});

/* =========================
   CANCELAR
========================= */
btnCancelar.addEventListener("click", cerrarModal);
