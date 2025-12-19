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
     🛒 TIENDA ONLINE — CARRITO (Drawer Izquierdo + LocalStorage)
     ===================================================== */

  const CART_KEY = 'eso_cart_v2';

  // Drawer + overlay (según tu index)
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');

  // Botones UI
  const cartOpenBtn = document.getElementById('cartOpenBtn');
  const cartCloseBtn = document.getElementById('cartCloseBtn');
  const cartClearBtn = document.getElementById('cartClearBtn');
  const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');

  // Render targets
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartCountEl = document.getElementById('cartCount');

  function moneyCRC(n) {
    const num = Number(n || 0);
    return `₡${num.toLocaleString('es-CR')}`;
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function calcTotals(cart) {
    let total = 0;
    let count = 0;
    cart.forEach(i => {
      const qty = Number(i.qty || 1);
      const price = Number(i.precio || 0);
      count += qty;
      total += qty * price;
    });
    return { total, count };
  }

  function openCart() {
    if (cartDrawer) cartDrawer.setAttribute('aria-hidden', 'false');
    if (cartOverlay) cartOverlay.setAttribute('aria-hidden', 'false');
    if (cartDrawer) cartDrawer.classList.add('open');
    if (cartOverlay) cartOverlay.classList.add('open');
  }

  function closeCart() {
    if (cartDrawer) cartDrawer.setAttribute('aria-hidden', 'true');
    if (cartOverlay) cartOverlay.setAttribute('aria-hidden', 'true');
    if (cartDrawer) cartDrawer.classList.remove('open');
    if (cartOverlay) cartOverlay.classList.remove('open');
  }

  function updateCartBadge() {
    const cart = loadCart();
    const { count } = calcTotals(cart);
    if (cartCountEl) cartCountEl.textContent = String(count);
  }

  function renderCart() {
    if (!cartItemsEl || !cartTotalEl) return;

    const cart = loadCart();
    cartItemsEl.innerHTML = '';

    const { total, count } = calcTotals(cart);

    if (!cart.length) {
      cartItemsEl.innerHTML = '<p class="cart-empty" style="opacity:.7">Tu carrito está vacío.</p>';
      cartTotalEl.textContent = moneyCRC(0);
      if (cartCountEl) cartCountEl.textContent = '0';
      return;
    }

    cart.forEach((item, idx) => {
      const nombre = item.nombre || 'Producto';
      const precio = Number(item.precio || 0);
      const qty = Number(item.qty || 1);

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="cart-item-row">
          <div class="cart-item-info">
            <strong>${escapeHtml(nombre)}</strong>
            <div style="opacity:.75;font-size:.95em">${moneyCRC(precio)} c/u</div>
          </div>

          <div class="cart-item-actions">
            <div class="qty">
              <button type="button" class="qty-btn" data-action="dec" data-idx="${idx}" aria-label="Disminuir">−</button>
              <span class="qty-num" style="min-width:22px;text-align:center;display:inline-block;">${qty}</span>
              <button type="button" class="qty-btn" data-action="inc" data-idx="${idx}" aria-label="Aumentar">+</button>
            </div>

            <button type="button" class="remove-btn" data-action="remove" data-idx="${idx}">
              Eliminar
            </button>
          </div>
        </div>
        <div style="margin-top:6px;opacity:.85">
          Subtotal: <strong>${moneyCRC(qty * precio)}</strong>
        </div>
      `;

      cartItemsEl.appendChild(row);
    });

    cartTotalEl.textContent = moneyCRC(total);
    if (cartCountEl) cartCountEl.textContent = String(count);

    // Delegación de eventos dentro del carrito
    cartItemsEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const idx = Number(btn.dataset.idx);
        const cartNow = loadCart();

        if (!cartNow[idx]) return;

        if (action === 'inc') {
          cartNow[idx].qty = Number(cartNow[idx].qty || 1) + 1;
        }

        if (action === 'dec') {
          const q = Number(cartNow[idx].qty || 1) - 1;
          if (q <= 0) cartNow.splice(idx, 1);
          else cartNow[idx].qty = q;
        }

        if (action === 'remove') {
          cartNow.splice(idx, 1);
        }

        saveCart(cartNow);
        renderCart();
      });
    });
  }

  // Agregar al carrito desde productos (tu index usa .add-to-cart)
  function addItemToCart({ id, nombre, precio, cat }) {
    const cart = loadCart();

    // Si existe por id, suma qty
    const found = cart.find(p => p.id === id);
    if (found) {
      found.qty = Number(found.qty || 1) + 1;
    } else {
      cart.push({ id, nombre, precio: Number(precio || 0), cat: cat || '', qty: 1 });
    }

    saveCart(cart);
    renderCart();
    openCart();
  }

  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id || cryptoId();
      const nombre = btn.dataset.nombre || 'Producto';
      const precio = Number(btn.dataset.precio || 0);
      const cat = btn.dataset.cat || '';

      addItemToCart({ id, nombre, precio, cat });
    });
  });

  // Abrir / cerrar carrito
  if (cartOpenBtn) cartOpenBtn.addEventListener('click', openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // Vaciar carrito
  if (cartClearBtn) {
    cartClearBtn.addEventListener('click', () => {
      saveCart([]);
      renderCart();
      updateCartBadge();
    });
  }

  // Checkout (placeholder PRO sin backend aún):
  // Reutiliza tu sección contacto SIN romper reservas:
  // - llena motivo=producto
  // - escribe el resumen del carrito en mensaje
  // - hace scroll a contacto
  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener('click', () => {
      const cart = loadCart();
      if (!cart.length) {
        alert("Tu carrito está vacío.");
        return;
      }

      const { total } = calcTotals(cart);

      const lines = cart.map(i => {
        const qty = Number(i.qty || 1);
        const precio = Number(i.precio || 0);
        return `• ${qty} x ${i.nombre} — ${moneyCRC(qty * precio)}`;
      }).join('\n');

      const checkoutMsg = `Hola, quiero comprar:\n${lines}\n\nTOTAL: ${moneyCRC(total)}\n\nPor favor confirmar disponibilidad y envío.`;

      const motivoEl = document.getElementById('motivo');
      const mensajeEl = document.getElementById('mensaje');

      if (motivoEl) motivoEl.value = 'producto';
      if (mensajeEl) mensajeEl.value = checkoutMsg;

      // Ocultar campos condicionales si existen (sin romper nada)
      const campingFields = document.getElementById('campingFields');
      const tourFields = document.getElementById('tourFields');
      if (campingFields) campingFields.style.display = 'none';
      if (tourFields) tourFields.style.display = 'none';

      closeCart();

      const contactoSection = document.getElementById('contacto');
      if (contactoSection) contactoSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Inicial
  renderCart();
  updateCartBadge();

  /* =====================================================
     🧭 FILTROS DE CATEGORÍA + BÚSQUEDA (Tienda)
     ===================================================== */

  const catBtns = document.querySelectorAll('.cat-btn');
  const productsGrid = document.getElementById('productsGrid');
  const shopSearch = document.getElementById('shopSearch');

  function filterProducts() {
    if (!productsGrid) return;

    const activeBtn = document.querySelector('.cat-btn.active');
    const activeCat = activeBtn ? activeBtn.dataset.cat : 'all';
    const q = (shopSearch ? shopSearch.value : '').trim().toLowerCase();

    const cards = productsGrid.querySelectorAll('.prod-card');
    cards.forEach(card => {
      const cardCat = card.getAttribute('data-cat') || card.dataset.cat || '';
      const text = card.textContent.toLowerCase();

      const matchCat = (activeCat === 'all') || (cardCat === activeCat);
      const matchText = !q || text.includes(q);

      card.style.display = (matchCat && matchText) ? '' : 'none';
    });
  }

  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterProducts();
    });
  });

  if (shopSearch) {
    shopSearch.addEventListener('input', filterProducts);
  }

  filterProducts();

  /* =====================================================
     📩 FORMULARIO DE CONTACTO / RESERVAS (SIN ROMPER NADA)
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

  /* ---------- Helpers ---------- */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"'`]/g, (m) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', "`": '&#96;' }[m])
    );
  }

  function cryptoId() {
    // fallback simple si no hay id
    return 'P' + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

});
