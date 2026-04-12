// ============================================================================
// PROFIFLORA – Ansicht: Schnittbestellung
// ============================================================================

const SchnittView = {

  // Temporärer Zustand: { productId -> menge }
  _mengen: {},
  _date: '',

  render() {
    this._date = Utils.todayISO();
    this._mengen = {};

    const catalog = Store.getCatalog();
    const expected = Store.getExpectedSales();
    const branchId = Auth.getBranchId();

    // Bestehende Einträge für heute laden
    const existingOrders = Store.getOrders(branchId, 'schnitt');
    const todayOrders = existingOrders.filter(o => o.date === this._date);
    todayOrders.forEach(o => { this._mengen[o.productId] = o.menge; });

    const html = `
      <div class="date-bar">
        <label>Bestelldatum:</label>
        <input type="date" id="schnitt-date" value="${this._date}" onchange="SchnittView.onDateChange(this.value)" />
        <span style="font-size:0.85rem;color:var(--gray-500)">
          Filiale: <strong>${Utils.escHtml(Auth.getBranchName())}</strong>
        </span>
      </div>

      <div class="action-bar">
        <button class="btn btn-secondary btn-sm" onclick="SchnittView.expandAll()">Alle aufklappen</button>
        <div class="action-bar-end">
          <button class="btn btn-success" onclick="SchnittView.submit()">
            ✓ Bestellung absenden
          </button>
        </div>
      </div>

      <div id="schnitt-categories">
        ${catalog.schnitt.categories.map(cat => this._renderCategory(cat, expected)).join('')}
      </div>

      <div class="summary-bar" id="schnitt-summary">
        ${this._renderSummary()}
      </div>
    `;

    document.getElementById('page-content').innerHTML = html;
    document.getElementById('topbar-title').textContent = 'Schnittbestellung';
  },

  _renderCategory(cat, expected) {
    return `
      <div class="category-section">
        <div class="category-header" onclick="Utils.toggleCategory(this)">
          <span>${Utils.escHtml(cat.name)}</span>
          <span class="chevron">▼</span>
        </div>
        <div class="category-body">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style="width:35%">Artikel / Sorte</th>
                  <th style="width:10%">VE</th>
                  <th style="width:14%" class="text-right">VK-Preis</th>
                  <th style="width:16%" class="text-right">Erwartet</th>
                  <th style="width:14%" class="text-right">Menge</th>
                  <th style="width:11%" class="text-right">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                ${cat.items.map(item => this._renderRow(item, expected)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  _renderRow(item, expected) {
    const menge = this._mengen[item.id] || 0;
    const exp   = expected[item.id] || 0;
    const total = menge * item.vk;
    return `
      <tr id="row-s-${item.id}">
        <td>${Utils.escHtml(item.name)}</td>
        <td><span class="badge badge-yellow">${Utils.escHtml(item.ve)}</span></td>
        <td class="text-right">${Utils.fmtEuro(item.vk)}</td>
        <td class="text-right text-muted">${exp > 0 ? exp : '—'}</td>
        <td class="text-right">
          <input type="number" min="0" step="1"
            class="input input-sm text-right"
            style="width:80px"
            value="${menge > 0 ? menge : ''}"
            placeholder="0"
            oninput="SchnittView.onMengeChange('${item.id}', ${item.vk}, this.value)"
          />
        </td>
        <td class="text-right text-bold" id="total-s-${item.id}">
          ${total > 0 ? Utils.fmtEuro(total) : '—'}
        </td>
      </tr>
    `;
  },

  _renderSummary() {
    let total = 0;
    let count = 0;
    Object.entries(this._mengen).forEach(([id, menge]) => {
      if (menge > 0) {
        count++;
        const catalog = Store.getCatalog();
        let vk = 0;
        catalog.schnitt.categories.forEach(cat => {
          const item = cat.items.find(i => i.id === id);
          if (item) vk = item.vk;
        });
        total += menge * vk;
      }
    });
    return `
      <div class="summary-item">
        <span class="summary-label">Positionen</span>
        <span class="summary-value">${count}</span>
      </div>
      <div class="summary-item summary-total">
        <span class="summary-label">Gesamtwert (VK)</span>
        <span class="summary-value">${Utils.fmtEuro(total)}</span>
      </div>
    `;
  },

  onDateChange(date) {
    this._date = date;
    this._mengen = {};
    const branchId = Auth.getBranchId();
    const orders = Store.getOrders(branchId, 'schnitt').filter(o => o.date === date);
    orders.forEach(o => { this._mengen[o.productId] = o.menge; });
    this.render();
    document.getElementById('schnitt-date').value = date;
  },

  onMengeChange(productId, vk, val) {
    const menge = Utils.parseNum(val);
    this._mengen[productId] = menge;

    // Live-Update Gesamt-Zelle
    const cell = document.getElementById(`total-s-${productId}`);
    if (cell) cell.textContent = menge > 0 ? Utils.fmtEuro(menge * vk) : '—';

    // Summary aktualisieren
    const summaryEl = document.getElementById('schnitt-summary');
    if (summaryEl) summaryEl.innerHTML = this._renderSummary();

    // Zwischenspeichern (kein Absenden)
    const branchId = Auth.getBranchId();
    const items = Object.entries(this._mengen).map(([pid, m]) => ({ productId: pid, menge: m }));
    Store.saveBatchOrder(branchId, 'schnitt', this._date, items);
  },

  expandAll() {
    const container = document.getElementById('schnitt-categories');
    if (container) Utils.openAllCategories(container);
  },

  submit() {
    const branchId = Auth.getBranchId();
    const items = Object.entries(this._mengen)
      .filter(([, m]) => m > 0)
      .map(([pid, m]) => ({ productId: pid, menge: m }));

    if (items.length === 0) {
      Utils.toast('Bitte mindestens eine Menge eingeben.', 'warning');
      return;
    }

    Store.saveBatchOrder(branchId, 'schnitt', this._date, items);
    Store.submitBatchOrder(branchId, 'schnitt', this._date);
    Utils.toast('Schnittbestellung erfolgreich abgesendet!', 'success');
  }
};

window.SchnittView = SchnittView;
