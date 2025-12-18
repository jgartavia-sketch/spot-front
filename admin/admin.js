// ESO/admin/admin.js
console.log("ADMIN DASHBOARD CARGADO");

const BACKEND_URL = "https://spot-backend-hdft.onrender.com/api";

// ===============================
// ESTADO GLOBAL
// ===============================
let paginaActual = 1;
let totalPaginas = 1;
let idReservaAEliminar = null;

// ===============================
// AUTH / SESIÓN (PASO 3.3.1)
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
// CARGAR RESERVAS
// ===============================
async function cargarReservas(page = 1) {
  const token = obtenerToken();
  if (!token) return;

  paginaActual = page;

  const tbody = document.querySelector("#tablaReservas tbody");
  tbody.innerHTML = "<tr><td colspan='7'>Cargando...</td></tr>";

  try {
    const res = await fetch(
      `${BACKEND_URL}/reservas?page=${page}&limit=10`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    // 👉 NUEVO: token vencido
    if (res.status === 401) {
      logoutForzado("Tu sesión expiró.");
      return;
    }

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.msg || "Error obteniendo reservas");
    }

    const reservas = data.data || [];

    // ===============================
    // CONTADORES
    // ===============================
    document.getElementById("total").textContent = `Total: ${reservas.length}`;
    document.getElementById("pendientes").textContent =
      `Pendientes: ${reservas.filter(r => r.estado === "pendiente").length}`;
    document.getElementById("revisadas").textContent =
      `Revisadas: ${reservas.filter(r => r.estado === "revisada").length}`;

    tbody.innerHTML = "";

    if (!reservas.length) {
      tbody.innerHTML =
        "<tr><td colspan='7'>No hay reservas</td></tr>";
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

  } catch (err) {
    console.error(err);
    tbody.innerHTML =
      "<tr><td colspan='7'>Error cargando reservas</td></tr>";
  }
}

// ===============================
// MARCAR COMO REVISADA
// ===============================
async function marcarRevisada(id) {
  const token = obtenerToken();
  if (!token) return;

  try {
    const res = await fetch(
      `${BACKEND_URL}/reservas/${id}/estado`,
      {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: "revisada" }),
      }
    );

    if (res.status === 401) {
      logoutForzado("Tu sesión expiró.");
      return;
    }

    const data = await res.json();
    if (!data.ok) throw new Error();

    cargarReservas(paginaActual);

  } catch {
    alert("No se pudo marcar como revisada");
  }
}

// ===============================
// ELIMINAR RESERVA
// ===============================
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

  try {
    const res = await fetch(
      `${BACKEND_URL}/reservas/${idReservaAEliminar}`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    if (res.status === 401) {
      logoutForzado("Tu sesión expiró.");
      return;
    }

    const data = await res.json();
    if (!data.ok) throw new Error();

    cerrarModalEliminar();
    cargarReservas(paginaActual);

  } catch {
    alert("Error eliminando reserva");
  }
}

// ===============================
// PAGINACIÓN
// ===============================
function paginaAnterior() {
  if (paginaActual > 1) cargarReservas(paginaActual - 1);
}

function paginaSiguiente() {
  if (paginaActual < totalPaginas) cargarReservas(paginaActual + 1);
}

// ===============================
// LOGOUT MANUAL
// ===============================
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  logoutForzado("Sesión cerrada.");
});

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
