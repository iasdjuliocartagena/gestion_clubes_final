// claseDetalle.js - VERSIÓN FINAL COMPLETA
// ============================================

console.log('🚀 claseDetalle.js cargado');

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
const esDistrital = rol?.toLowerCase() === "distrital";
const modo = localStorage.getItem("modo");
const esDistritalModoLectura = (esDistrital && modo === "lectura");

console.log('🔧 claseDetalle.js - Config:', {
  API_URL: window.API_URL,
  token: token ? 'Presente' : 'Ausente',
  rol: rol,
  esDistrital: esDistrital,
  modo: modo,
  esDistritalModoLectura: esDistritalModoLectura
});

let requisitos = [];
let conquistadores = [];
let progreso = [];
let conquistadorSeleccionado = null;

// ============================================
// 📋 INICIALIZAR APLICACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
  console.log('✅ DOM cargado para claseDetalle');
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
  let clubNombre = localStorage.getItem("club_nombre");
  
  console.log('📋 Datos de inicialización:', { 
    claseId, 
    claseNombre, 
    clubNombre,
    clubId: localStorage.getItem("club_id")
  });

  // Validación de datos críticos
  if (!claseId || !claseNombre) {
    console.error('❌ Faltan datos críticos en localStorage');
    
    // Mostrar mensaje amigable
    const tituloClase = document.getElementById("tituloClase");
    if (tituloClase) {
      tituloClase.textContent = "Clase no seleccionada";
      tituloClase.style.color = "#ff6b6b";
    }
    
    // Agregar botón para volver
    const claseContainer = document.querySelector('.clase-container');
    if (claseContainer) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        text-align: center;
        padding: 40px;
        color: white;
        background: rgba(0,0,0,0.8);
        margin: 20px;
        border-radius: 10px;
      `;
      errorDiv.innerHTML = `
        <h3 style="color: #ff6b6b; margin-bottom: 15px;">⚠️ Error al cargar la clase</h3>
        <p style="margin-bottom: 20px;">No se encontraron los datos necesarios.</p>
        <button onclick="window.history.back()" style="padding: 10px 20px; background: #7CFF8C; border: none; cursor: pointer; margin: 5px;">
          ← Volver
        </button>
        <button onclick="window.location.href='/dashboard-director.html'" style="padding: 10px 20px; background: #2f80ed; border: none; cursor: pointer; margin: 5px; color: white;">
          Ir a mi club
        </button>
      `;
      claseContainer.appendChild(errorDiv);
    }
    
    return;
  }

  // Si no hay clubNombre, intentar obtenerlo del club_id
  if (!clubNombre && localStorage.getItem("club_id")) {
    console.log('🔍 Obteniendo nombre del club...');
    try {
      const clubId = localStorage.getItem("club_id");
      const response = await fetch(`${window.API_URL}/clubs/${clubId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const clubData = await response.json();
        clubNombre = clubData.nombre;
        localStorage.setItem("club_nombre", clubNombre);
        console.log('✅ Club nombre obtenido:', clubNombre);
      }
    } catch (error) {
      console.warn('⚠️ No se pudo obtener el nombre del club:', error);
      clubNombre = "Mi Club";
      localStorage.setItem("club_nombre", clubNombre);
    }
  } else if (!clubNombre) {
    // Si aún no hay, usar valor por defecto
    clubNombre = "Mi Club";
    localStorage.setItem("club_nombre", clubNombre);
  }

  // Actualizar título
  const tituloClase = document.getElementById("tituloClase");
  if (tituloClase) {
    if (esDistritalModoLectura) {
      tituloClase.textContent = `${claseNombre} – ${clubNombre} (LECTURA)`;
      tituloClase.style.color = '#7CFF8C';
    } else {
      tituloClase.textContent = `${claseNombre} – ${clubNombre}`;
    }
  }

  // 🔒 BLOQUEO PARA DISTRITAL EN MODO LECTURA
  const btnAdd = document.getElementById("btnAdd");
  if (btnAdd && esDistritalModoLectura) {
    btnAdd.style.display = 'none';
    console.log('👁️ Botón añadir oculto para modo lectura');
  }

  // Cargar datos
  console.log('📥 Cargando datos...');
  await cargarRequisitos(claseId);
  await cargarConquistadores(claseNombre);
  await cargarProgresoDeTodos();
  renderTabla();
  
  // Si es modo lectura, agregar indicador
  if (esDistritalModoLectura) {
    const header = document.querySelector('.clase-header');
    if (header) {
      const infoBadge = document.createElement('div');
      infoBadge.style.cssText = `
        background: rgba(124, 255, 140, 0.2);
        color: #7CFF8C;
        border: 1px solid #7CFF8C;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 0.8rem;
        margin-left: 10px;
        display: inline-block;
      `;
      infoBadge.textContent = 'MODO LECTURA';
      header.appendChild(infoBadge);
    }
  }
}

/* ========================= REQUISITOS ========================= */
async function cargarRequisitos(claseId) {
  try {
    console.log(`📥 Cargando requisitos para clase ${claseId}...`);
    const res = await fetch(`${window.API_URL}/requisitos/${claseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📤 Response status requisitos:', res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: No se pudieron cargar los requisitos`);
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
    if (!thead) {
      console.error('❌ No se encontró thead');
      return;
    }
    
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
    
    // Mostrar error en la tabla
    const thead = document.getElementById("thead");
    if (thead) {
      thead.innerHTML = "<th>Conquistador</th><th colspan='10' style='color: #ff6b6b;'>Error cargando requisitos</th>";
    }
  }
}

/* ========================= CONQUISTADORES ========================= */
async function cargarConquistadores(claseNombre) {
  try {
    const clubId = localStorage.getItem("club_id");
    
    if (!clubId) {
      console.error('❌ No hay club_id en localStorage');
      conquistadores = [];
      return;
    }

    console.log(`📥 Cargando conquistadores para clase ${claseNombre}, club ${clubId}...`);

    const res = await fetch(
      `${window.API_URL}/conquistadores/clase/${claseNombre}?club_id=${clubId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );

    console.log('📤 Response status conquistadores:', res.status);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: No se pudieron cargar los conquistadores`);
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
          const res = await fetch(`${window.API_URL}/progreso/${c.id}`, {
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
        <td colspan="${requisitos.length + 1}" style="text-align: center; padding: 40px; color: white; background: rgba(0,0,0,0.7);">
          No hay conquistadores en esta clase
          ${!esDistritalModoLectura ? '<br><button onclick="window.abrirModalNuevo()" style="margin-top: 15px; padding: 10px 20px; background: #7CFF8C; border: none; cursor: pointer;">➕ Agregar conquistador</button>' : ''}
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
    tdNombre.style.fontWeight = "bold";
    tdNombre.style.color = "#333";
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
  checkbox.style.cssText = `
    width: 18px;
    height: 18px;
    cursor: pointer;
  `;

  // 🚫 DISTRITAL MODO LECTURA = SOLO LECTURA
  if (esDistritalModoLectura) {
    checkbox.disabled = true;
    checkbox.style.cursor = "not-allowed";
    checkbox.style.opacity = "0.7";
  }

  checkbox.addEventListener("click", (e) => e.stopPropagation());

  const existe = progreso.find(
    (p) =>
      p.conquistador_id === String(conquistadorId) &&
      p.requisito_id === String(requisitoId) &&
      p.cumplido
  );

  checkbox.checked = !!existe;

  // ❌ NO listener change para distrital modo lectura
  if (!esDistritalModoLectura) {
    checkbox.addEventListener("change", async () => {
      try {
        const res = await fetch(`${window.API_URL}/progreso`, {
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
      <span style="color: #2f80ed;">Clase regular: ${porcentajeRegular}%</span><br>
      <span style="color: #eb0000;">Clase avanzada: ${porcentajeAvanzada}%</span>
    `;
  }
  
  // Mostrar/ocultar botones de edición según modo
  const btnEditar = document.querySelector(".btn-editar");
  const btnEliminar = document.querySelector(".btn-eliminar");
  
  if (esDistritalModoLectura) {
    if (btnEditar) btnEditar.style.display = 'none';
    if (btnEliminar) btnEliminar.style.display = 'none';
  } else {
    if (btnEditar) btnEditar.style.display = 'inline-block';
    if (btnEliminar) btnEliminar.style.display = 'inline-block';
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

  // 🚫 Esconder botón de añadir si es distrital modo lectura
  if (esDistritalModoLectura && btnAdd) {
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
    if (esDistritalModoLectura) {
      alert('❌ No tienes permisos para añadir conquistadores en modo lectura');
      return;
    }
    
    modoEdicion = false;
    const modalTitulo = document.getElementById("modalTitulo");
    if (modalTitulo) {
      modalTitulo.textContent = "Nuevo Conquistador";
    }
    abrirModal();
  };

  /* ---------- EDITAR ---------- */
  window.editarSeleccionado = function () {
    if (esDistritalModoLectura) {
      alert('❌ No tienes permisos para editar en modo lectura');
      return;
    }
    
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
    if (esDistritalModoLectura) {
      alert('❌ No tienes permisos para eliminar en modo lectura');
      return;
    }
    
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
        `${window.API_URL}/conquistadores/${conquistadorSeleccionado.id}`,
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
            `${window.API_URL}/conquistadores/${conquistadorSeleccionado.id}`,
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
          
          res = await fetch(`${window.API_URL}/conquistadores`, {
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
  if (btnAdd && !esDistritalModoLectura) {
    btnAdd.addEventListener("click", window.abrirModalNuevo);
  }

  /* ---------- VOLVER ---------- */
/* ---------- VOLVER ---------- */
  if (btnVolver) {
    btnVolver.addEventListener("click", () => {
      if (esDistritalModoLectura) {
        // Distrital en modo lectura: volver a lista de clubes
        window.location.href = "/dashboard-distrital.html";
      } else {
        // Director normal: NO usar history.back(), mejor ir directamente
        document.body.classList.add("page-exit");
        setTimeout(() => {
          window.location.href = "/dashboard-director.html";
        }, 300);
      }
    });
  }

  // Cerrar modal con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      cerrarModal();
    }
  });
}

// ============================================
// 🛠️ FUNCIONES DE DEBUG
// ============================================

window.mostrarDatosDebug = function() {
  console.log('📊 DATOS DEBUG:', {
    requisitos: requisitos.length,
    conquistadores: conquistadores.length,
    progreso: progreso.length,
    seleccionado: conquistadorSeleccionado,
    localStorage: {
      clase_id: localStorage.getItem("clase_id"),
      clase_nombre: localStorage.getItem("clase_nombre"),
      club_id: localStorage.getItem("club_id"),
      club_nombre: localStorage.getItem("club_nombre"),
      token: localStorage.getItem("token") ? "Presente" : "Ausente",
      rol: localStorage.getItem("rol"),
      modo: localStorage.getItem("modo")
    }
  });
};

window.limpiarCacheClase = function() {
  localStorage.removeItem("clase_id");
  localStorage.removeItem("clase_nombre");
  console.log('🧹 Cache de clase limpiado');
  alert('Cache limpiado. Recarga la página.');
};

console.log('✅ claseDetalle.js inicializado correctamente');