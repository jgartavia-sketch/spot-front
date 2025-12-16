console.log("📁 Script cargado desde:", window.location.href);
console.log("📌 script.js realmente cargado");

// script.js - manejos: fade-up observer, contact form, conditional fields, poll, quiz, comments, year, lightbox

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- YEAR ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- FADE-UP (IntersectionObserver) ---------- */
  const fadeEls = document.querySelectorAll('.fade-up, .masonry-item');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.18 });

  fadeEls.forEach(el => io.observe(el));

  /* ---------- CONTACT / RESERVAS FORM ---------- */
  const form = document.getElementById('contact-form');

  if (form) {
    const motivo = document.getElementById('motivo');
    const campingFields = document.getElementById('campingFields');
    const tourFields = document.getElementById('tourFields');

    // Show/hide conditional fields
    if (motivo) {
      motivo.addEventListener('change', (e) => {
        const v = e.target.value;
        campingFields.style.display = (v === 'camping') ? 'block' : 'none';
        tourFields.style.display = (v === 'tour') ? 'block' : 'none';
      });
    }

    // ------------ SUBMIT FORM + BACKEND ONLINE ------------ //
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
  nombre: document.getElementById('nombre').value.trim(),
  correo: document.getElementById('correo').value.trim(),
  telefono: document.getElementById('telefono').value.trim(),
  motivo: document.getElementById('motivo').value,
  mensaje: document.getElementById('mensaje').value.trim(),
  fecha: document.getElementById('fecha').value.trim() // 👈 ESTE ES CLAVE
};


      console.log("👉 Enviando reserva al backend ONLINE...", payload);

      try {
        const res = await fetch("https://spot-backend-hdft.onrender.com/api/reservas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("✅ Respuesta del backend:", res.status, data);

        alert(data.ok ? "Reserva registrada con éxito" : "Error: " + data.msg);

        if (data.ok) {
          form.reset();
          campingFields.style.display = 'none';
          tourFields.style.display = 'none';
        }

      } catch (err) {
        console.error("❌ Error en fetch hacia backend:", err);
        alert("Error al conectar con el servidor.");
      }
    });
  }

  /* ---------- POLL (localStorage) ---------- */
  const pollBtns = document.querySelectorAll('.poll-btn');
  const pollResult = document.getElementById('poll-result');
  const POLL_KEY = 'eso_poll_choice';

  function renderPoll() {
    const stored = localStorage.getItem(POLL_KEY);
    pollResult.textContent = stored ? `Gracias. Vos votaste: ${stored}` : '';
  }

  renderPoll();

  pollBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.value;
      localStorage.setItem(POLL_KEY, val);
      renderPoll();
    });
  });

  /* ---------- QUIZ (simple) ---------- */
  const quizArea = document.getElementById('quiz-area');
  const quizResult = document.getElementById('quiz-result');

  if (quizArea) {
    quizArea.addEventListener('click', (e) => {
      if (!e.target.matches('.quiz-btn')) return;

      const ans = e.target.dataset.answer;
      let res = 'Eres como una planta resiliente.';

      if (ans === 'sol') res = 'Eres una Planta de Sol — energética y vivaz!';
      if (ans === 'sombra') res = 'Eres una Planta de Sombra — paciente y constante.';

      quizResult.textContent = res;
    });
  }

  /* ---------- COMMENTS (localStorage) ---------- */
  const commentForm = document.getElementById('comment-form');
  const commentsList = document.getElementById('comments-list');
  const COMMENTS_KEY = 'eso_comments_v1';

  function loadComments() {
    const raw = localStorage.getItem(COMMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function renderComments() {
    if (!commentsList) return;

    commentsList.innerHTML = '';
    const items = loadComments();

    if (!items.length) {
      commentsList.innerHTML = '<p style="opacity:.7">No hay comentarios aún. Sé el primero.</p>';
      return;
    }

    items.forEach(c => {
      const div = document.createElement('div');
      div.className = 'comment-item';
      div.innerHTML = `
        <strong>${escapeHtml(c.name)}</strong>
        <p>${escapeHtml(c.text)}</p>
        <small style="opacity:.6">${new Date(c.ts).toLocaleString()}</small>
      `;
      commentsList.appendChild(div);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"'`]/g, (m) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', "`": '&#96;' }[m])
    );
  }

  if (commentForm) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('comment-name').value.trim();
      const text = document.getElementById('comment-text').value.trim();

      if (!name || !text) return alert('Completá nombre y comentario.');

      const arr = loadComments();
      arr.unshift({ name, text, ts: Date.now() });
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(arr));

      commentForm.reset();
      renderComments();
    });
  }

  renderComments();

  /* ---------- LIGHTBOX simple para gallery ---------- */
  const masonryImgs = document.querySelectorAll('.masonry-item img');

  if (masonryImgs.length) {

    const modal = document.createElement('div');
    modal.id = 'lightbox-modal';
    modal.style.cssText =
      'position:fixed;left:0;top:0;width:100%;height:100%;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);z-index:2000;';
    modal.innerHTML =
      '<img id="lightbox-img" style="max-width:92%;max-height:92%;border-radius:8px;box-shadow:0 20px 50px rgba(0,0,0,0.6)"/>';

    document.body.appendChild(modal);

    modal.addEventListener('click', () => modal.style.display = 'none');

    masonryImgs.forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        const lb = document.getElementById('lightbox-img');
        lb.src = img.src;
        modal.style.display = 'flex';
      });
    });
  }

}); // FIN DOMContentLoaded
