// admin/login.js

const BACKEND_URL = "https://spot-backend-hdft.onrender.com";

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

// Si ya existe sesión, ir directo al dashboard
const token = localStorage.getItem("token");
if (token) {
  window.location.href = "dashboard.html";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    errorMsg.textContent = "Todos los campos son obligatorios";
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    // Defensa: asegurarse que la respuesta sea JSON
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Respuesta inválida del servidor");
    }

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.msg || "Credenciales incorrectas");
    }

    // Guardar sesión
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // Redirigir al dashboard
    window.location.href = "dashboard.html";

  } catch (err) {
    errorMsg.textContent = err.message || "Error conectando al servidor";
  }
});
