console.log("ADMIN.JS CARGÓ CORRECTAMENTE");

// ===============================
// CONFIG
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  // tu código aquí...
});

// ===============================
// VARIABLES DE PAGINACIÓN
// ===============================
let paginaActual = 1;
let totalPaginas = 1;

// ID temporal para modal de eliminación
let idReservaAEliminar = null;

// ===============================
// VERIFICAR TOKEN
// ===============================
function verificarToken() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return null;
  }

  return token;
}

// ===============================
// LOGIN ADMIN
// ===============================
async function iniciarLogin(e) {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();

    if (!data.ok) {
      msg.textContent = "Credenciales incorrectas";
      msg.style.color = "red";
      return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";

  } catch (err) {
    console.error(err);
    msg.textContent = "Error conectando al servidor";
  }
}

// ===============================
// ARMAR QUERY STRING DE FILTROS
// ===============================
function obtenerQueryFiltros() {
  const estadoEl = document.getElementById("filtroEstado");
  const busquedaEl = document.getElementById("busqueda");
  const inicioEl = document.getElementById("fechaInicio");
  const finEl = document.getElementById("fechaFin");

  const estado = estadoEl ? estadoEl.value : "";
  const busqueda = busquedaEl ? busquedaEl.value.trim() : "";
  const inicio = inicioEl ? inicioEl.value : "";
  const fin = finEl ? finEl.value : "";

  const params = [];

  if (estado) params.push(`estado=${encodeURIComponent(estado)}`);
  if (busqueda) params.push(`busqueda=${encodeURIComponent(busqueda)}`);
  if (inicio) params.push(`inicio=${encodeURIComponent(inicio)}`);
  if (fin) params.push(`fin=${encodeURIComponent(fin)}`);

  return params.join("&");
}

// ===============================
// MARCAR COMO REVISADA
// ===============================
async function marcarRevisada(id) {
  const token = verificarToken();
  if (!token) return;

  try {
    const res = await fetch(`${BASE_URL}/reservas/${id}/revisada`, {
      method: "PUT",
      headers: {
        "authorization": "Bearer " + token,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (!data.ok) {
      alert("No se pudo actualizar la reserva");
      return;
    }

    cargarReservas(paginaActual);

  } catch (err) {
    console.error(err);
    alert("Error conectando con el servidor");
  }
}

// ===============================
// CARGAR RESERVAS
// ===============================
async function cargarReservas(page = 1) {
  const token = verificarToken();
  if (!token) return;

  paginaActual = page;

  const tablaBody = document.querySelector("#tablaReservas tbody");

  try {
    let url = `${BASE_URL}/reservas?page=${page}&limit=10`;

    const qsFiltros = obtenerQueryFiltros();
    if (qsFiltros) url += `&${qsFiltros}`;

    const res = await fetch(url, {
      headers: { "authorization": "Bearer " + token }
    });

    const data = await res.json();

    if (!data.ok) {
      alert("Error obteniendo reservas");
      return;
    }

    // Ordenar
    if (Array.isArray(data.data)) {
      data.data.sort((a, b) => {
        if (a.estado === b.estado) return 0;
        if (a.estado === "pendiente") return -1;
        return 1;
      });
    }

    const total = data.data.length;
    const pendientes = data.data.filter(r => r.estado === "pendiente").length;
    const revisadas = data.data.filter(r => r.estado === "revisada").length;

    document.getElementById("total").textContent = `Total: ${total}`;
    document.getElementById("pendientes").textContent = `Pendientes: ${pendientes}`;
    document.getElementById("revisadas").textContent = `Revisadas: ${revisadas}`;

    totalPaginas = data.totalPages || 1;
    document.getElementById("infoPagina").textContent =
      `Página ${data.page} de ${data.totalPages}`;

    tablaBody.innerHTML = "";

    if (!data.data.length) {
      tablaBody.innerHTML = `<tr><td colspan="7">No hay reservas</td></tr>`;
      return;
    }

    data.data.forEach(r => {
      tablaBody.innerHTML += `
        <tr>
          <td>${r.id}</td>
          <td>${r.nombre}</td>
          <td>${r.correo}</td>
          <td>${r.motivo}</td>
          <td>${r.fecha}</td>
          <td class="${r.estado === 'revisada' ? 'estado-revisada' : 'estado-pendiente'}">${r.estado}</td>
          <td>
            ${r.estado === "revisada"
              ? "<span class='estado-revisada'>✔ Revisada</span>"
              : `<button onclick="marcarRevisada(${r.id})">Revisar</button>`}
            <button onclick="abrirModalEliminar(${r.id})" class="btn-danger">Eliminar</button>
          </td>
        </tr>`;
    });

  } catch (err) {
    console.error(err);
    alert("Error conectando con el servidor");
  }
}

// ===============================
// FILTROS
// ===============================
function aplicarFiltros() { cargarReservas(1); }
function limpiarFiltros() {
  document.getElementById("filtroEstado").value = "";
  document.getElementById("busqueda").value = "";
  document.getElementById("fechaInicio").value = "";
  document.getElementById("fechaFin").value = "";
  cargarReservas(1);
}

// ===============================
// MODAL ELIMINAR
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
  const token = verificarToken();
  if (!token || !idReservaAEliminar) return;

  try {
    const res = await fetch(`${BASE_URL}/reservas/${idReservaAEliminar}`, {
      method: "DELETE",
      headers: {
        "authorization": "Bearer " + token,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (!data.ok) {
      alert("No se pudo eliminar la reserva");
      return;
    }

    cerrarModalEliminar();
    cargarReservas(paginaActual);

  } catch (err) {
    console.error(err);
    alert("Error conectando con el servidor");
  }
}

// ===============================
// EXPORTAR CSV
// ===============================
function exportarExcel() {
  const tabla = document.getElementById("tablaReservas");
  let csv = "";
  const filas = tabla.querySelectorAll("tr");

  filas.forEach(fila => {
    const celdas = fila.querySelectorAll("th, td");
    const filaDatos = [];

    celdas.forEach(celda => {
      const texto = celda.innerText.replace(/"/g, '""');
      filaDatos.push(`"${texto}"`);
    });

    csv += filaDatos.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  const fechaStr = new Date().toISOString().slice(0, 10);

  a.href = url;
  a.download = `reservas_el_spot_${fechaStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
// INICIALIZAR
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("tablaReservas")) cargarReservas();
  if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", iniciarLogin);
  }

  // Modal listeners
  document.getElementById("btnCancelarEliminar")?.addEventListener("click", cerrarModalEliminar);
  document.getElementById("btnConfirmarEliminar")?.addEventListener("click", eliminarReserva);
});
