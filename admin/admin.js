// ESO/admin/admin.js
console.log("ADMIN DASHBOARD CARGADO");

const BACKEND_URL = "https://spot-backend-hdft.onrender.com/api";

// ===============================
// ESTADO GLOBAL
// ===============================
let paginaActual = 1;
let totalPaginas = 1;
let idReservaAEliminar = null;
let cargando = false;

// 🔹 NUEVO: cache de reservas
let reservasOriginales = [];
let reservasFiltradas = [];

// ===============================
// AUTH / SESIÓN
// ===============================
function logoutForzado(mensaje = "Sesión inválida. Inicia sesión nuevamente.") {
  alert(mensaje);
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/admin/login.html";
}

function obtenerToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    logoutForzado("No hay sesión activa.");
    return null;
  }
  return token;
}

// ===============================
// UI HELPERS
// ===============================
function setLoading(estado) {
  cargando = estado;
  document.body.style.opacity = estado ? "0.6" : "1";
  document.querySelectorAll("button").forEach((b) => (b.disabled = estado));
}

function mostrarMensajeTabla(msg) {
  document.querySelector("#tablaReservas tbody").innerHTML =
    `<tr><td colspan="7">${msg}</td></tr>`;
}

// ===============================
// CARGAR RESERVAS (BASE)
// ===============================
async function cargarReservas(page = 1) {
  if (cargando) return;

  const token = obtenerToken();
  if (!token) return;

  paginaActual = page;
  setLoading(true);
  mostrarMensajeTabla("Cargando reservas...");

  try {
    const res = await fetch(
      `${BACKEND_URL}/reservas?page=${page}&limit=50`,
      {
        headers: { Authorization: "Bearer " + token },
      }
    );

    if (res.status === 401) {
      logoutForzado("Tu sesión expiró.");
      return;
    }

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error();

    reservasOriginales = data.data || [];
    aplicarFiltros(); // 🔹 siempre pasa por filtros

  } catch (e) {
    console.error(e);
    mostrarMensajeTabla("❌ Error cargando reservas");
  } finally {
    setLoading(false);
  }
}

// ===============================
// APLICAR FILTROS (CORE)
// ===============================
function aplicarFiltros() {
  const estado = document.getElementById("filtroEstado")?.value || "";
  const texto = document.getElementById("busqueda")?.value.toLowerCase() || "";
  const desde = document.getElementById("fechaInicio")?.value;
  const hasta = document.getElementById("fechaFin")?.value;

  reservasFiltradas = reservasOriginales.filter((r) => {
    if (estado && r.estado !== estado) return false;

    if (texto) {
      const combinado =
        `${r.nombre} ${r.correo} ${r.motivo}`.toLowerCase();
      if (!combinado.includes(texto)) return false;
    }

    if (desde && new Date(r.fecha) < new Date(desde)) return false;
    if (hasta && new Date(r.fecha) > new Date(hasta)) return false;

    return true;
  });

  renderTabla(reservasFiltradas);
  actualizarContadores(reservasFiltradas);
}

// ===============================
// LIMPIAR FILTROS
// ===============================
function limpiarFiltros() {
  document.getElementById("filtroEstado").value = "";
  document.getElementById("busqueda").value = "";
  document.getElementById("fechaInicio").value = "";
  document.getElementById("fechaFin").value = "";

  reservasFiltradas = [...reservasOriginales];
  renderTabla(reservasFiltradas);
  actualizarContadores(reservasFiltradas);
}

// ===============================
// RENDER TABLA
// ===============================
function renderTabla(reservas) {
  const tbody = document.querySelector("#tablaReservas tbody");
  tbody.innerHTML = "";

  if (!reservas.length) {
    mostrarMensajeTabla("No hay reservas");
    return;
  }

  reservas.forEach((r) => {
    tbody.innerHTML += `
      <tr>
        <td>${r.id}</td>
        <td>${r.nombre}</td>
        <td>${r.correo}</td>
        <td>${r.motivo}</td>
        <td>${new Date(r.fecha).toLocaleDateString()}</td>
        <td class="${r.estado === "revisada" ? "estado-revisada" : "estado-pendiente"}">
          ${r.estado}
        </td>
        <td>
          ${
            r.estado === "pendiente"
              ? `<button onclick="marcarRevisada(${r.id})">Revisar</button>`
              : `<span class="estado-revisada">✔</span>`
          }
          <button class="btn-danger" onclick="abrirModalEliminar(${r.id})">
            Eliminar
          </button>
        </td>
      </tr>
    `;
  });
}

// ===============================
// CONTADORES
// ===============================
function actualizarContadores(reservas) {
  document.getElementById("total").textContent = `Total: ${reservas.length}`;
  document.getElementById("pendientes").textContent =
    `Pendientes: ${reservas.filter(r => r.estado === "pendiente").length}`;
  document.getElementById("revisadas").textContent =
    `Revisadas: ${reservas.filter(r => r.estado === "revisada").length}`;
}

// ===============================
// EXPORTAR A EXCEL (CSV REAL)
// ===============================
function exportarExcel() {
  if (!reservasFiltradas.length) {
    alert("No hay datos para exportar");
    return;
  }

  const encabezados = [
    "ID","Nombre","Correo","Telefono","Motivo","Fecha","Estado"
  ];

  const filas = reservasFiltradas.map(r => [
    r.id,
    r.nombre,
    r.correo,
    r.telefono || "",
    r.motivo,
    new Date(r.fecha).toLocaleDateString(),
    r.estado
  ]);

  let csv = encabezados.join(",") + "\n";
  filas.forEach(f => {
    csv += f.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `reservas_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ===============================
// MARCAR / ELIMINAR (SIN CAMBIOS)
// ===============================
async function marcarRevisada(id) {
  const token = obtenerToken();
  if (!token) return;

  await fetch(`${BACKEND_URL}/reservas/${id}/estado`, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ estado: "revisada" }),
  });

  cargarReservas(paginaActual);
}

function abrirModalEliminar(id) {
  idReservaAEliminar = id;
  document.getElementById("modalEliminar").style.display = "flex";
}

function cerrarModalEliminar() {
  idReservaAEliminar = null;
  document.getElementById("modalEliminar").style.display = "none";
}

async function eliminarReserva() {
  const token = obtenerToken();
  if (!token || !idReservaAEliminar) return;

  await fetch(`${BACKEND_URL}/reservas/${idReservaAEliminar}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });

  cerrarModalEliminar();
  cargarReservas(paginaActual);
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  cargarReservas();

  document
    .getElementById("btnCancelarEliminar")
    ?.addEventListener("click", cerrarModalEliminar);

  document
    .getElementById("btnConfirmarEliminar")
    ?.addEventListener("click", eliminarReserva);
});
