// ESO/admin/login.js

const BACKEND_URL = "https://spot-backend-hdft.onrender.com";

console.log("LOGIN ADMIN CARGADO");
console.log("BACKEND_URL =", BACKEND_URL);

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

// Si ya hay token, ir directo al dashboard
if (localStorage.getItem("token")) {
  window.location.href = "/admin/dashboard.html";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.msg || "Credenciales incorrectas");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    window.location.href = "/admin/dashboard.html";

  } catch (err) {
    errorMsg.textContent = err.message;
  }
});
