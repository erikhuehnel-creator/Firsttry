// ============================================================================
// PROFIFLORA – Dringende Bestellung (eingebettet in Schnitt / Landgard / NonFood)
// ============================================================================

const UrgentOrderView = {

  // Wird von den jeweiligen Ansichten mit dem Typ aufgerufen
  render(source) {
    const branchId = Auth.getBranchId();
    const today    = Utils.todayISO();
    const entries  = Store.getUrgentOrders(branchId).filter(o => o.source === source && o.date === today);

    return `
      <div class="category-section" style="margin-top:8px">
        <div class="category-header" style="background:linear-gradient(90deg,#fff3b0,#fff9e0);border-color:var(--yellow)"
          onclick="Utils.toggleCategory(this)">
          <span style="color:#b8860b;font-size:1.1rem">⚡</span>
          <span style="color:#7a5c00;font-weight:700">Dringende Bestellung</span>
          <span class="chevron" style="color:#b8860b">▼</span>
        </div>
        <div class="category-body" id="urgent-body-${source}">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th style="width:30%">Artikelname</th>
                  <th style="width:14%">Größe</th>
                  <th style="width:12%" class="text-right">Menge</th>
                  <th style="width:14%" class="text-right">VK-Preis (€)</th>
                  <th style="width:14%" class="text-right">Gesamt</th>
                  <th style="width:44px"></th>
                </tr>
              </thead>
              <tbody id="urgent-tbody-${source}">
                ${this._renderRows(entries, source)}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5" class="text-right">Gesamt dringend:</td>
                  <td class="text-right text-bold" id="urgent-total-${source}">
                    ${this._calcTotal(entries)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style="padding:12px 16px;display:flex;gap:10px;justify-content:space-between;align-items:center">
            <button class="btn btn-secondary btn-sm"
              onclick="UrgentOrderView.addRow('${source}')">+ Zeile hinzufügen</button>
            <button class="btn btn-sm" style="background:var(--yellow);color:#000;font-weight:600"
              onclick="UrgentOrderView.submit('${source}')">⚡ Dringende Bestellung absenden</button>
          </div>
        </div>
      </div>
    `;
  },

  _renderRows(entries, source) {
    if (entries.length === 0) {
      return `<tr><td colspan="7" class="text-center text-muted" style="padding:20px">
        Keine dringenden Bestellungen. "+ Zeile hinzufügen" um zu starten.
      </td></tr>`;
    }
    return entries.map((e, idx) => {
      const total = Utils.parseNum(e.menge) * Utils.parseNum(e.vkPreis);
      return `
        <tr id="urgent-row-${e.id}">
          <td class="text-muted">${idx + 1}</td>
          <td>
            <input type="text" class="input input-sm" value="${Utils.escHtml(e.artikel || '')}"
              placeholder="Artikelname"
              onchange="UrgentOrderView.update('${source}','${e.id}','artikel',this.value)" />
          </td>
          <td>
            <input type="text" class="input input-sm" value="${Utils.escHtml(e.groesse || '')}"
              placeholder="z.B. 50cm"
              onchange="UrgentOrderView.update('${source}','${e.id}','groesse',this.value)" />
          </td>
          <td class="text-right">
            <input type="number" min="0" class="input input-sm text-right" style="width:75px"
              value="${e.menge || ''}" placeholder="0"
              oninput="UrgentOrderView.update('${source}','${e.id}','menge',this.value)" />
          </td>
          <td class="text-right">
            <input type="number" min="0" step="0.01" class="input input-sm text-right" style="width:80px"
              value="${e.vkPreis || ''}" placeholder="0,00"
              oninput="UrgentOrderView.update('${source}','${e.id}','vkPreis',this.value)" />
          </td>
          <td class="text-right text-bold" id="urgent-cell-${e.id}">
            ${total > 0 ? Utils.fmtEuro(total) : '—'}
          </td>
          <td>
            <button class="btn-delete-row"
              onclick="UrgentOrderView.deleteRow('${source}','${e.id}')">✕</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  _calcTotal(entries) {
    const t = entries.reduce((s, e) =>
      s + Utils.parseNum(e.menge) * Utils.parseNum(e.vkPreis), 0);
    return t > 0 ? Utils.fmtEuro(t) : '—';
  },

  _refresh(source) {
    const branchId = Auth.getBranchId();
    const today = Utils.todayISO();
    const entries = Store.getUrgentOrders(branchId).filter(o => o.source === source && o.date === today);
    const tbody = document.getElementById(`urgent-tbody-${source}`);
    const totalEl = document.getElementById(`urgent-total-${source}`);
    if (tbody) tbody.innerHTML = this._renderRows(entries, source);
    if (totalEl) totalEl.textContent = this._calcTotal(entries);
  },

  addRow(source) {
    const branchId = Auth.getBranchId();
    Store.addUrgentOrder(branchId, {
      date: Utils.todayISO(), source,
      artikel: '', groesse: '', menge: 0, vkPreis: 0
    });
    this._refresh(source);
    // Sektion aufklappen falls zu
    const body = document.getElementById(`urgent-body-${source}`);
    const header = body ? body.previousElementSibling : null;
    if (body && !body.classList.contains('open')) {
      body.classList.add('open');
      if (header) header.classList.add('active');
    }
  },

  update(source, id, field, value) {
    const branchId = Auth.getBranchId();
    const orders   = Store.getUrgentOrders(branchId);
    const entry    = orders.find(o => o.id === id);
    if (!entry) return;
    entry[field] = (field === 'menge' || field === 'vkPreis') ? Utils.parseNum(value) : value;
    Store.saveUrgentOrders(branchId, orders);

    const total = Utils.parseNum(entry.menge) * Utils.parseNum(entry.vkPreis);
    const cell  = document.getElementById(`urgent-cell-${id}`);
    if (cell) cell.textContent = total > 0 ? Utils.fmtEuro(total) : '—';

    const today = Utils.todayISO();
    const todayEntries = orders.filter(o => o.source === source && o.date === today);
    const totEl = document.getElementById(`urgent-total-${source}`);
    if (totEl) totEl.textContent = this._calcTotal(todayEntries);
  },

  deleteRow(source, id) {
    const branchId = Auth.getBranchId();
    Store.deleteUrgentOrder(branchId, id);
    this._refresh(source);
  },

  submit(source) {
    const branchId = Auth.getBranchId();
    const orders   = Store.getUrgentOrders(branchId);
    const today    = Utils.todayISO();
    const pending  = orders.filter(o => o.source === source && o.date === today && !o.submitted);

    if (pending.length === 0) {
      Utils.toast('Keine dringenden Einträge zum Absenden.', 'warning');
      return;
    }
    const now = new Date().toISOString();
    pending.forEach(o => { o.submitted = true; o.submittedAt = now; });
    Store.saveUrgentOrders(branchId, orders);
    Utils.toast('Dringende Bestellung abgesendet!', 'success');
  }
};

window.UrgentOrderView = UrgentOrderView;
