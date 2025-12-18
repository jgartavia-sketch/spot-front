console.log("📁 Script cargado desde:", window.location.href);
console.log("📌 script.js realmente cargado");

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- YEAR ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- FADE-UP ---------- */
  const fadeEls = document.querySelectorAll('.fade-up, .masonry-item');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.18 });
  fadeEls.forEach(el => io.observe(el));

  /* =====================================================
     🛒 TIENDA ONLINE — CARRITO (NUEVO MÓDULO)
     ===================================================== */

  const CART_KEY = 'eso_cart_v1';
  const cartPanel = document.getElementById('cartPanel');
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');

  function loadCart() {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function openCart() {
    if (cartPanel) cartPanel.classList.add('open');
  }

  function closeCart() {
    if (cartPanel) cartPanel.classList.remove('open');
  }

  window.toggleCart = () => {
    if (!cartPanel) return;
    cartPanel.classList.toggle('open');
  };

  function renderCart() {
    if (!cartItemsEl || !cartTotalEl) return;

    const cart = loadCart();
    cartItemsEl.innerHTML = '';
    let total = 0;

    if (!cart.length) {
      cartItemsEl.innerHTML = '<p style="opacity:.6">Carrito vacío</p>';
      cartTotalEl.textContent = '0';
      return;
    }

    cart.forEach((item, index) => {
      total += item.precio;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <strong>${item.nombre}</strong><br>
        ₡${item.precio}<br>
        <button data-index="${index}">Eliminar</button>
      `;
      div.querySelector('button').addEventListener('click', () => {
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
      });
      cartItemsEl.appendChild(div);
    });

    cartTotalEl.textContent = total;
  }

  document.querySelectorAll('.comprar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const nombre = btn.dataset.producto || 'Producto';
      const precio = Number(btn.dataset.precio || 0);

      const cart = loadCart();
      cart.push({ nombre, precio });
      saveCart(cart);

      renderCart();
      openCart();
    });
  });

  renderCart();

  /* =====================================================
     📩 FORMULARIO DE CONTACTO / RESERVAS (SIN CAMBIOS)
     ===================================================== */

  const form = document.getElementById('contact-form');
  const motivo = document.getElementById('motivo');
  const campingFields = document.getElementById('campingFields');
  const tourFields = document.getElementById('tourFields');

  if (motivo) {
    motivo.addEventListener('change', (e) => {
      const v = e.target.value;
      if (campingFields) campingFields.style.display = (v === 'camping') ? 'block' : 'none';
      if (tourFields) tourFields.style.display = (v === 'tour') ? 'block' : 'none';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        nombre: document.getElementById('nombre').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        motivo: motivo ? motivo.value : '',
        mensaje: document.getElementById('mensaje').value.trim(),
        fecha: document.getElementById('fecha').value.trim()
      };

      try {
        const res = await fetch("https://spot-backend-hdft.onrender.com/api/reservas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        alert(data.ok ? "Reserva registrada con éxito" : "Error: " + data.msg);

        if (data.ok) {
          form.reset();
          if (campingFields) campingFields.style.display = 'none';
          if (tourFields) tourFields.style.display = 'none';
        }

      } catch (err) {
        console.error(err);
        alert("Error al conectar con el servidor.");
      }
    });
  }

  /* ---------- LIGHTBOX (SIN CAMBIOS) ---------- */
  const masonryImgs = document.querySelectorAll('.masonry-item img');
  if (masonryImgs.length) {
    const modal = document.createElement('div');
    modal.id = 'lightbox-modal';
    modal.style.cssText =
      'position:fixed;left:0;top:0;width:100%;height:100%;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);z-index:2000;';
    modal.innerHTML =
      '<img id="lightbox-img" style="max-width:92%;max-height:92%;border-radius:8px"/>';
    document.body.appendChild(modal);
    modal.addEventListener('click', () => modal.style.display = 'none');
    masonryImgs.forEach(img => {
      img.addEventListener('click', () => {
        document.getElementById('lightbox-img').src = img.src;
        modal.style.display = 'flex';
      });
    });
  }

});
