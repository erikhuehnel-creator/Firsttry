// ============================================================================
// PROFIFLORA – Utilities (Toast, Modal, Formatierung)
// ============================================================================

const Utils = {

  // ── Zahlen formatieren ───────────────────────────────────────────────────
  fmtEuro(n) {
    const num = parseFloat(n) || 0;
    return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  },

  fmtNum(n) {
    const num = parseFloat(n) || 0;
    return num.toLocaleString('de-DE', { maximumFractionDigits: 2 });
  },

  parseNum(val) {
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(',', '.').replace(/[^\d.]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  },

  fmtDate(isoOrDate) {
    if (!isoOrDate) return '—';
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  todayISO() {
    return new Date().toISOString().slice(0, 10);
  },

  escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // ── Toast Notifications ──────────────────────────────────────────────────
  toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span style="font-size:1.1rem">${icons[type] || icons.info}</span>
      <span class="toast-message">${this.escHtml(message)}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },

  // ── Modal ────────────────────────────────────────────────────────────────
  showModal({ title, body, footer = '' }) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-footer').innerHTML = footer;
    document.getElementById('modal-overlay').classList.add('show');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
  },

  // ── Confirm Dialog ───────────────────────────────────────────────────────
  confirm(message, onConfirm) {
    this.showModal({
      title: 'Bestätigung',
      body: `<p style="font-size:0.95rem;color:var(--gray-700)">${this.escHtml(message)}</p>`,
      footer: `
        <button class="btn btn-secondary btn-sm" onclick="Utils.closeModal()">Abbrechen</button>
        <button class="btn btn-danger btn-sm" id="confirm-ok-btn">Bestätigen</button>
      `
    });
    setTimeout(() => {
      const btn = document.getElementById('confirm-ok-btn');
      if (btn) btn.onclick = () => { this.closeModal(); onConfirm(); };
    }, 50);
  },

  // ── Kategorie aufklappen/zuklappen ───────────────────────────────────────
  toggleCategory(header) {
    const body = header.nextElementSibling;
    const isOpen = header.classList.contains('active');
    if (isOpen) {
      header.classList.remove('active');
      body.classList.remove('open');
    } else {
      header.classList.add('active');
      body.classList.add('open');
    }
  },

  // ── Alle Kategorien einer Sektion aufklappen ─────────────────────────────
  openAllCategories(container) {
    container.querySelectorAll('.category-header').forEach(h => {
      h.classList.add('active');
      h.nextElementSibling.classList.add('open');
    });
  }
};

window.Utils = Utils;
