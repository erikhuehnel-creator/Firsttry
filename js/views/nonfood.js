// ============================================================================
// PROFIFLORA – Ansicht: Non-Food Bestellung (freie Eingabe)
// ============================================================================

const NonFoodView = {

  _date: '',

  render() {
    this._date = Utils.todayISO();
    const branchId = Auth.getBranchId();
    const orders = Store.getOrders(branchId, 'nonfood');

    const html = `
      <div class="date-bar">
        <label>Bestelldatum:</label>
        <input type="date" id="nonfood-date" value="${this._date}"
          onchange="NonFoodView.onDateChange(this.value)" />
        <span style="font-size:0.85rem;color:var(--gray-500)">
          Filiale: <strong>${Utils.escHtml(Auth.getBranchName())}</strong>
        </span>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Non-Food Bestellung</h3>
          <button class="btn btn-secondary btn-sm" onclick="NonFoodView.addRow()">+ Zeile hinzufügen</button>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th style="width:35%">Artikel / Bezeichnung</th>
                  <th style="width:12%">Menge</th>
                  <th style="width:12%">VE</th>
                  <th style="width:18%">Farbe / Variante</th>
                  <th style="width:14%">Hinweis</th>
                  <th style="width:44px"></th>
                </tr>
              </thead>
              <tbody id="nonfood-tbody">
                ${this._renderRows(orders.filter(o => o.date === this._date))}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer" style="display:flex;justify-content:space-between;align-items:center">
          <button class="btn btn-secondary btn-sm" onclick="NonFoodView.addRow()">+ Zeile hinzufügen</button>
          <button class="btn btn-success" onclick="NonFoodView.submit()">✓ Bestellung absenden</button>
        </div>
      </div>

      ${UrgentOrderView.render('nonfood')}

      <div class="card mt-md">
        <div class="card-header"><h3>Frühere Bestellungen</h3></div>
        <div class="card-body" style="padding:0">
          ${this._renderHistory(orders)}
        </div>
      </div>
    `;

    document.getElementById('page-content').innerHTML = html;
    document.getElementById('topbar-title').textContent = 'Non-Food Bestellung';
  },

  _renderRows(items) {
    if (items.length === 0) {
      return `<tr id="nonfood-empty"><td colspan="7" class="text-center text-muted" style="padding:24px">
        Noch keine Zeilen. Klicke auf "+ Zeile hinzufügen".
      </td></tr>`;
    }
    return items.map((item, idx) => `
      <tr id="nf-row-${item.id}">
        <td class="text-muted" style="width:32px">${idx + 1}</td>
        <td><input type="text" class="input input-sm" value="${Utils.escHtml(item.artikel || '')}"
          placeholder="Artikel / Bezeichnung"
          onchange="NonFoodView.updateField('${item.id}','artikel',this.value)" /></td>
        <td><input type="number" min="0" class="input input-sm text-right" style="width:70px"
          value="${item.menge || ''}" placeholder="0"
          onchange="NonFoodView.updateField('${item.id}','menge',this.value)" /></td>
        <td><input type="text" class="input input-sm" value="${Utils.escHtml(item.ve || '')}"
          placeholder="Stk / Pack"
          onchange="NonFoodView.updateField('${item.id}','ve',this.value)" /></td>
        <td><input type="text" class="input input-sm" value="${Utils.escHtml(item.farbe || '')}"
          placeholder="z.B. weiß"
          onchange="NonFoodView.updateField('${item.id}','farbe',this.value)" /></td>
        <td><input type="text" class="input input-sm" value="${Utils.escHtml(item.hinweis || '')}"
          placeholder="Optional"
          onchange="NonFoodView.updateField('${item.id}','hinweis',this.value)" /></td>
        <td><button class="btn-delete-row" onclick="NonFoodView.deleteRow('${item.id}')">✕</button></td>
      </tr>
    `).join('');
  },

  _renderHistory(allOrders) {
    const grouped = {};
    allOrders.forEach(o => {
      if (!grouped[o.date]) grouped[o.date] = [];
      grouped[o.date].push(o);
    });
    const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    if (dates.length === 0) {
      return '<div class="empty-state"><p>Keine früheren Bestellungen.</p></div>';
    }
    return dates.map(date => `
      <div style="padding:14px 22px;border-bottom:1px solid var(--gray-100)">
        <div style="font-weight:600;font-size:0.9rem;margin-bottom:8px;color:var(--gray-600)">
          ${Utils.fmtDate(date)}
          ${grouped[date].some(o => o.submitted) ? '<span class="badge badge-success" style="margin-left:8px">Abgesendet</span>' : ''}
        </div>
        <div style="font-size:0.88rem;color:var(--gray-500)">
          ${grouped[date].map(o => `${Utils.escHtml(o.artikel || '—')} (${o.menge || 0} ${Utils.escHtml(o.ve || '')})`).join(' · ')}
        </div>
      </div>
    `).join('');
  },

  onDateChange(date) {
    this._date = date;
    this.render();
    document.getElementById('nonfood-date').value = date;
  },

  addRow() {
    const branchId = Auth.getBranchId();
    Store.createOrder(branchId, 'nonfood', {
      date: this._date, artikel: '', menge: '', ve: '', farbe: '', hinweis: ''
    });
    this.render();
    document.getElementById('nonfood-date').value = this._date;
  },

  updateField(id, field, value) {
    const branchId = Auth.getBranchId();
    const orders = Store.getOrders(branchId, 'nonfood');
    const order = orders.find(o => o.id === id);
    if (order) { order[field] = value; Store.saveOrders(branchId, 'nonfood', orders); }
  },

  deleteRow(id) {
    const branchId = Auth.getBranchId();
    Store.deleteOrder(branchId, 'nonfood', id);
    this.render();
    document.getElementById('nonfood-date').value = this._date;
  },

  submit() {
    const branchId = Auth.getBranchId();
    const orders = Store.getOrders(branchId, 'nonfood');
    const dateOrders = orders.filter(o => o.date === this._date && !o.submitted);
    if (dateOrders.length === 0) {
      Utils.toast('Keine Einträge zum Absenden.', 'warning'); return;
    }
    const now = new Date().toISOString();
    dateOrders.forEach(o => { o.submitted = true; o.submittedAt = now; });
    Store.saveOrders(branchId, 'nonfood', orders);
    Utils.toast('Non-Food Bestellung abgesendet!', 'success');
    this.render();
    document.getElementById('nonfood-date').value = this._date;
  }
};

window.NonFoodView = NonFoodView;
