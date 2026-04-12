// ============================================================================
// PROFIFLORA – Ansicht: Inventur
// ============================================================================

const InventoryView = {

  _date: '',

  render() {
    this._date = Utils.todayISO();
    const branchId = Auth.getBranchId();
    const entries = Store.getInventory(branchId);

    const html = `
      <div class="card" style="background:var(--yellow-light);border:1px solid var(--yellow);margin-bottom:20px">
        <div class="card-body" style="padding:14px 20px">
          <strong style="font-size:0.92rem">Anweisung Inventur:</strong>
          <ul style="margin-top:8px;margin-left:18px;font-size:0.85rem;color:var(--gray-700);line-height:1.8">
            <li>Alle Schnittblumen zählen, die noch verkauft werden können</li>
            <li>Ungeöffnete Kartons als Menge eintragen (z.B. 8 oder 5)</li>
            <li>Nicht zählen: Tische, Zinnen, Kasse, Absätze, Werkzeug</li>
            <li>CI-Container und Bottiche werden gezählt</li>
            <li>Immer genaue Beschreibung und Stückzahl angeben (keine Kartons)</li>
          </ul>
        </div>
      </div>

      <div class="date-bar">
        <label>Inventurdatum:</label>
        <input type="date" id="inv-date" value="${this._date}"
          onchange="InventoryView.setDate(this.value)" />
        <span style="font-size:0.85rem;color:var(--gray-500)">
          Filiale: <strong>${Utils.escHtml(Auth.getBranchName())}</strong>
        </span>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Inventur eintragen</h3>
          <button class="btn btn-secondary btn-sm" onclick="InventoryView.addRow()">+ Zeile hinzufügen</button>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th style="width:40%">Sorte / Bezeichnung</th>
                  <th style="width:16%" class="text-right">Stückzahl</th>
                  <th style="width:16%" class="text-right">VK-Preis (€)</th>
                  <th style="width:16%" class="text-right">Gesamtwert</th>
                  <th style="width:44px"></th>
                </tr>
              </thead>
              <tbody id="inv-tbody">
                ${this._renderRows(entries.filter(e => e.date === this._date))}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="text-right">Gesamtbestand (VK):</td>
                  <td class="text-right text-bold" id="inv-total">
                    ${this._calcTotal(entries)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div class="card-footer" style="display:flex;justify-content:space-between;align-items:center">
          <button class="btn btn-secondary btn-sm" onclick="InventoryView.addRow()">+ Zeile hinzufügen</button>
          <span style="font-size:0.85rem;color:var(--gray-500)">
            ${entries.filter(e => e.date === this._date).length} Positionen
          </span>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Frühere Inventuren</h3></div>
        <div class="card-body" style="padding:0">
          ${this._renderHistory(entries)}
        </div>
      </div>
    `;

    document.getElementById('page-content').innerHTML = html;
    document.getElementById('topbar-title').textContent = 'Inventur';
  },

  _renderRows(entries) {
    if (entries.length === 0) {
      return `<tr><td colspan="6" class="text-center text-muted" style="padding:24px">
        Noch keine Einträge. Klicke auf "+ Zeile hinzufügen".
      </td></tr>`;
    }
    return entries.map((entry, idx) => {
      const total = Utils.parseNum(entry.stueckzahl) * Utils.parseNum(entry.vkPreis);
      return `
        <tr id="inv-row-${entry.id}">
          <td class="text-muted">${idx + 1}</td>
          <td>
            <input type="text" class="input input-sm" value="${Utils.escHtml(entry.sorte || '')}"
              placeholder="Sorte / Bezeichnung"
              onchange="InventoryView.update('${entry.id}','sorte',this.value)" />
          </td>
          <td class="text-right">
            <input type="number" min="0" class="input input-sm text-right" style="width:90px"
              value="${entry.stueckzahl || ''}" placeholder="0"
              oninput="InventoryView.update('${entry.id}','stueckzahl',this.value)" />
          </td>
          <td class="text-right">
            <input type="number" min="0" step="0.01" class="input input-sm text-right" style="width:90px"
              value="${entry.vkPreis || ''}" placeholder="0,00"
              oninput="InventoryView.update('${entry.id}','vkPreis',this.value)" />
          </td>
          <td class="text-right text-bold" id="inv-total-${entry.id}">
            ${total > 0 ? Utils.fmtEuro(total) : '—'}
          </td>
          <td>
            <button class="btn-delete-row" onclick="InventoryView.deleteEntry('${entry.id}')">✕</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  _calcTotal(entries) {
    const t = entries
      .filter(e => e.date === this._date)
      .reduce((s, e) => s + Utils.parseNum(e.stueckzahl) * Utils.parseNum(e.vkPreis), 0);
    return Utils.fmtEuro(t);
  },

  _renderHistory(allEntries) {
    const byDate = {};
    allEntries.forEach(e => {
      if (e.date === this._date) return; // aktuelle bereits oben
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    });
    const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
    if (dates.length === 0) {
      return '<div class="empty-state"><p>Keine früheren Inventuren.</p></div>';
    }
    return dates.map(date => {
      const dayEntries = byDate[date];
      const total = dayEntries.reduce((s, e) => s + Utils.parseNum(e.stueckzahl) * Utils.parseNum(e.vkPreis), 0);
      return `
        <div style="padding:12px 22px;border-bottom:1px solid var(--gray-100)">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-weight:600;font-size:0.9rem">${Utils.fmtDate(date)}</span>
            <span style="font-weight:700">${Utils.fmtEuro(total)}</span>
          </div>
          <div style="font-size:0.85rem;color:var(--gray-500)">
            ${dayEntries.length} Positionen ·
            ${dayEntries.slice(0, 3).map(e => Utils.escHtml(e.sorte || '—')).join(', ')}
            ${dayEntries.length > 3 ? ` … +${dayEntries.length - 3} weitere` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  setDate(date) { this._date = date; this.render(); document.getElementById('inv-date').value = date; },

  addRow() {
    const branchId = Auth.getBranchId();
    Store.addInventoryItem(branchId, { date: this._date, sorte: '', stueckzahl: 0, vkPreis: 0 });
    this.render();
    document.getElementById('inv-date').value = this._date;
  },

  update(id, field, value) {
    const branchId = Auth.getBranchId();
    const inventory = Store.getInventory(branchId);
    const entry = inventory.find(e => e.id === id);
    if (!entry) return;
    entry[field] = (field === 'stueckzahl' || field === 'vkPreis') ? Utils.parseNum(value) : value;
    Store.saveInventory(branchId, inventory);

    const total = Utils.parseNum(entry.stueckzahl) * Utils.parseNum(entry.vkPreis);
    const cell = document.getElementById(`inv-total-${id}`);
    if (cell) cell.textContent = total > 0 ? Utils.fmtEuro(total) : '—';
    const totEl = document.getElementById('inv-total');
    if (totEl) totEl.textContent = this._calcTotal(inventory);
  },

  deleteEntry(id) {
    Utils.confirm('Eintrag wirklich löschen?', () => {
      Store.deleteInventoryItem(Auth.getBranchId(), id);
      this.render();
      document.getElementById('inv-date').value = this._date;
    });
  }
};

window.InventoryView = InventoryView;
