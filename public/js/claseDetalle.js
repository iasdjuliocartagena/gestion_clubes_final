// public/js/claseDetalle.js

// Configuración API URL
const API_URL = window.API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://gestion-clubes.onrender.com/api');

const token = localStorage.getItem("token");
const rol = localStorage.getItem("rol");
const esDistrital = rol?.toLowerCase() === "distrital";

console.log('🔧 ClaseDetalle config:', { API_URL, token, rol, esDistrital });

let requisitos = [];
let conquistadores = [];
let progreso = [];
let conquistadorSeleccionado = null;

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  document.body.classList.add("animate-in");

  // Verificar autenticación
  if (!token) {
    alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
    window.location.href = "/login.html";
    return;
  }

  await inicializarAplicacion();
  configurarEventos();
});

/* ========================= INIT ========================= */
async function inicializarAplicacion() {
  const claseId = localStorage.getItem("clase_id");
  const claseNombre = localStorage.getItem("clase_nombre");
  const clubNombre = localStorage.getItem("club_nombre");

  console.log('📋 Datos de inicialización:', { claseId, claseNombre, clubNombre });

  if (!claseId || !claseNombre || !clubNombre) {
    document.getElementById("tituloClase").textContent = "Clase no seleccionada";
    console.error('❌ Faltan datos en localStorage');
    return;
  }

  document.getElementById("tituloClase").textContent =
    `${claseNombre} – ${clubNombre}`;

  // 🔒 BLOQUEO PARA DISTRITAL
  if (esDistrital) {
    console.log('👁️ Modo distrital: solo lectura');
    document.getElementById("btnAdd")?.classList.add("hidden");
    const btnEditar = document.querySelector(".btn-editar");
    const btnEliminar = document.querySelector(".btn-eliminar");
    
    if (btnEditar) btnEditar.classList.add("hidden");
    if (btnEliminar) btnEliminar.classList.add("hidden");
  }

  await cargarRequisitos(claseId);
  await cargarConquistadores();
  await cargarProgresoDeTodos();
  renderTabla();
}

/* ========================= REQUISITOS ========================= */
async function cargarRequisitos(claseId) {
  try {
    console.log(`📥 Cargando requisitos para clase ${claseId}...`);
    const res = await fetch(`${API_URL}/requisitos/${claseId}`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    requisitos = await res.json();
    console.log(`✅ ${requisitos.length} requisitos cargados`);

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
      th.title = `${req.categoria} - ${req.tipo}`;
      if (req.tipo === "avanzada") th.classList.add("avanzada");
      thead.appendChild(th);
    });
  } catch (err) {
    console.error('❌ Error cargando requisitos:', err);
    alert("Error al cargar los requisitos de la clase");
  }
}

/* ========================= CONQUISTADORES ========================= */
async function cargarConquistadores() {
  try {
    const clase = localStorage.getItem("clase_nombre");
    const clubId = localStorage.getItem("club_id");

    console.log(`📥 Cargando conquistadores para clase ${clase}, club ${clubId}...`);

    const res = await fetch(
      `${API_URL}/conquistadores/clase/${clase}?club_id=${clubId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    conquistadores = await res.json();
    
    if (!Array.isArray(conquistadores)) {
      console.warn('⚠️ Los conquistadores no son un array:', conquistadores);
      conquistadores = [];
    }
    
    console.log(`✅ ${conquistadores.length} conquistadores cargados`);
  } catch (err) {
    console.error('❌ Error cargando conquistadores:', err);
    conquistadores = [];
  }
}

/* ========================= PROGRESO ========================= */
async function cargarProgresoDeTodos() {
  progreso = [];
  
  if (conquistadores.length === 0) return;

  console.log('📥 Cargando progreso de todos los conquistadores...');

  try {
    await Promise.all(
      conquistadores.map(async (c) => {
        try {
          const res = await fetch(`${API_URL}/progreso/${c.id}`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });

          if (!res.ok) return;

          const data = await res.json();

          if (Array.isArray(data)) {
            data.forEach((p) => {
              progreso.push({
                conquistador_id: String(c.id),
                requisito_id: String(p.requisito_id),
                cumplido: !!p.cumplido,
              });
            });
          }
        } catch (err) {
          console.warn(`⚠️ Error cargando progreso para ${c.nombre}:`, err);
        }
      })
    );
    
    console.log(`✅ Progreso cargado para ${progreso.length} registros`);
  } catch (err) {
    console.error('❌ Error general cargando progreso:', err);
  }
}

/* ========================= RENDER TABLA ========================= */
function renderTabla() {
  const tbody = document.getElementById("tbody");
  if (!tbody) {
    console.error('❌ No se encontró tbody');
    return;
  }
  
  tbody.innerHTML = "";

  if (conquistadores.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${requisitos.length + 1}" style="text-align: center; padding: 40px;">
          No hay conquistadores en esta clase
          ${!esDistrital ? '<br><button onclick="abrirModalNuevo()" style="margin-top: 15px;">➕ Agregar conquistador</button>' : ''}
        </td>
      </tr>
    `;
    return;
  }

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
  checkbox.className = "requisito-checkbox";

  // 🚫 DISTRITAL = SOLO LECTURA
  if (esDistrital) {
    checkbox.disabled = true;
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

        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorData}`);
        }

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
        console.log('✅ Progreso actualizado:', { conquistadorId, requisitoId, cumplido: checkbox.checked });
      } catch (err) {
        console.error('❌ Error actualizando progreso:', err);
        checkbox.checked = !checkbox.checked;
        alert("No se pudo actualizar el progreso. Intenta nuevamente.");
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

  if (!panel) {
    console.warn('⚠️ No se encontró el panel de acciones');
    return;
  }

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

  const porcentajeElement = document.getElementById("porcentaje");
  if (porcentajeElement) {
    porcentajeElement.innerHTML = `
      Clase regular: ${porcentajeRegular}%<br>
      Clase avanzada: ${porcentajeAvanzada}%
    `;
  }
}

/* ========================= MODAL ========================= */
function configurarEventos() {
  const modal = document.getElementById("modalConquistador");
  const inputNombre = document.getElementById("inputNombre");
  const btnGuardar = document.getElementById("btnGuardar");
  const btnCancelar = document.getElementById("btnCancelar");
  const btnAdd = document.getElementById("btnAdd");
  const btnVolver = document.getElementById("btnVolver");

  let modoEdicion = false;

  // 🚫 Esconder botón de añadir si es distrital
  if (esDistrital && btnAdd) {
    btnAdd.style.display = 'none';
  }

  /* ---------- ABRIR MODAL ---------- */
  function abrirModal(nombre = "") {
    if (!modal || !inputNombre) return;
    
    inputNombre.value = nombre;
    modal.classList.remove("hidden");
    inputNombre.focus();
  }

  /* ---------- CERRAR MODAL ---------- */
  function cerrarModal() {
    if (!modal || !inputNombre) return;
    
    modal.classList.add("hidden");
    inputNombre.value = "";
    modoEdicion = false;
  }

  /* ---------- ABRIR MODAL NUEVO ---------- */
  window.abrirModalNuevo = function() {
    if (esDistrital) return;
    
    modoEdicion = false;
    const modalTitulo = document.getElementById("modalTitulo");
    if (modalTitulo) {
      modalTitulo.textContent = "Nuevo Conquistador";
    }
    abrirModal();
  };

  /* ---------- EDITAR ---------- */
  window.editarSeleccionado = function () {
    if (esDistrital) return;
    
    if (!conquistadorSeleccionado) {
      alert("Selecciona un conquistador primero");
      return;
    }

    modoEdicion = true;
    const modalTitulo = document.getElementById("modalTitulo");
    if (modalTitulo) {
      modalTitulo.textContent = "Editar Conquistador";
    }
    abrirModal(conquistadorSeleccionado.nombre);
  };

  /* ---------- ELIMINAR ---------- */
  window.eliminarSeleccionado = async function () {
    if (esDistrital) return;
    
    if (!conquistadorSeleccionado) {
      alert("Selecciona un conquistador primero");
      return;
    }

    const ok = confirm(
      `¿Eliminar a ${conquistadorSeleccionado.nombre}? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    try {
      const res = await fetch(
        `${API_URL}/conquistadores/${conquistadorSeleccionado.id}`,
        {
          method: "DELETE",
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorData}`);
      }

      conquistadores = conquistadores.filter(
        (c) => c.id !== conquistadorSeleccionado.id
      );

      progreso = progreso.filter(
        (p) => p.conquistador_id !== String(conquistadorSeleccionado.id)
      );

      conquistadorSeleccionado = null;
      renderTabla();
      actualizarPanel();
      
      console.log('✅ Conquistador eliminado');
    } catch (err) {
      console.error('❌ Error eliminando:', err);
      alert("No se pudo eliminar el conquistador. Intenta nuevamente.");
    }
  };

  /* ---------- GUARDAR ---------- */
  if (btnGuardar) {
    btnGuardar.addEventListener("click", async () => {
      if (!inputNombre) return;
      
      const nombre = inputNombre.value.trim();
      if (!nombre) {
        alert("Escribe un nombre");
        return;
      }

      try {
        let res;

        if (modoEdicion && conquistadorSeleccionado) {
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
          console.log('✅ Conquistador editado:', conquistadorSeleccionado);
        } else {
          // ➕ CREAR
          const clase = localStorage.getItem("clase_nombre");
          const clubId = localStorage.getItem("club_id");
          
          res = await fetch(`${API_URL}/conquistadores`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              nombre,
              clase: clase,
              club_id: clubId
            }),
          });

          if (!res.ok) throw new Error();

          const nuevo = await res.json();
          conquistadores.push(nuevo);
          console.log('✅ Conquistador creado:', nuevo);
        }

        cerrarModal();
        renderTabla();
        actualizarPanel();
      } catch (err) {
        console.error('❌ Error guardando:', err);
        alert("No se pudo guardar. Verifica tu conexión e intenta nuevamente.");
      }
    });
  }

  /* ---------- CANCELAR ---------- */
  if (btnCancelar) {
    btnCancelar.addEventListener("click", cerrarModal);
  }

  /* ---------- BOTÓN AÑADIR ---------- */
  if (btnAdd && !esDistrital) {
    btnAdd.addEventListener("click", window.abrirModalNuevo);
  }

  /* ---------- VOLVER ---------- */
  if (btnVolver) {
    btnVolver.addEventListener("click", () => {
      window.history.back();
    });
  }

  // Cerrar modal con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      cerrarModal();
    }
  });
}