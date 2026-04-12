// ============================================================================
// PROFIFLORA – Ansicht: Abschreibungen
// ============================================================================

const WriteoffsView = {

  _date: '',
  _filter: 'all',

  render() {
    this._date = Utils.todayISO();
    const branchId = Auth.getBranchId();
    const entries = Store.getWriteoffs(branchId);

    const html = `
      <div class="date-bar">
        <label>Datum:</label>
        <input type="date" id="wo-date" value="${this._date}"
          onchange="WriteoffsView.setDate(this.value)" />
        <span style="font-size:0.85rem;color:var(--gray-500)">
          Filiale: <strong>${Utils.escHtml(Auth.getBranchName())}</strong>
        </span>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Abschreibung eintragen</h3>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th style="width:30%">Sorte / Bezeichnung</th>
                  <th style="width:14%">Kategorie</th>
                  <th style="width:14%" class="text-right">Stückzahl</th>
                  <th style="width:14%" class="text-right">VK-Preis (€)</th>
                  <th style="width:14%" class="text-right">Gesamt</th>
                  <th style="width:44px"></th>
                </tr>
              </thead>
              <tbody id="wo-tbody">
                ${this._renderTodayRows(entries)}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5" class="text-right">Gesamt heute:</td>
                  <td class="text-right text-bold" id="wo-total">${this._calcTotal(entries)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn btn-secondary btn-sm" onclick="WriteoffsView.addRow()">+ Zeile hinzufügen</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Alle Abschreibungen</h3>
          <div style="display:flex;gap:8px">
            <select class="input input-sm" onchange="WriteoffsView.setFilter(this.value)" style="width:160px">
              <option value="all">Alle Kategorien</option>
              <option value="schnitt">Schnitt</option>
              <option value="pflanzen">Pflanzen</option>
              <option value="sonstiges">Sonstiges</option>
            </select>
          </div>
        </div>
        <div class="card-body" style="padding:0">
          ${this._renderHistory(entries)}
        </div>
      </div>
    `;

    document.getElementById('page-content').innerHTML = html;
    document.getElementById('topbar-title').textContent = 'Abschreibungen';
  },

  _renderTodayRows(entries) {
    const todayEntries = entries.filter(e => e.date === this._date);
    if (todayEntries.length === 0) {
      return `<tr><td colspan="7" class="text-center text-muted" style="padding:24px">
        Noch keine Einträge für heute. Klicke auf "+ Zeile hinzufügen".
      </td></tr>`;
    }
    return todayEntries.map((entry, idx) => this._renderRow(entry, idx)).join('');
  },

  _renderRow(entry, idx) {
    const total = (Utils.parseNum(entry.stueckzahl) * Utils.parseNum(entry.vkPreis));
    return `
      <tr id="wo-row-${entry.id}">
        <td class="text-muted">${idx + 1}</td>
        <td>
          <input type="text" class="input input-sm" value="${Utils.escHtml(entry.sorte || '')}"
            placeholder="Sorte / Bezeichnung"
            onchange="WriteoffsView.update('${entry.id}','sorte',this.value)" />
        </td>
        <td>
          <select class="input input-sm" onchange="WriteoffsView.update('${entry.id}','typ',this.value)">
            <option value="schnitt"   ${entry.typ === 'schnitt'   ? 'selected' : ''}>Schnitt</option>
            <option value="pflanzen"  ${entry.typ === 'pflanzen'  ? 'selected' : ''}>Pflanzen</option>
            <option value="sonstiges" ${entry.typ === 'sonstiges' ? 'selected' : ''}>Sonstiges</option>
          </select>
        </td>
        <td class="text-right">
          <input type="number" min="0" class="input input-sm text-right" style="width:80px"
            value="${entry.stueckzahl || ''}" placeholder="0"
            oninput="WriteoffsView.update('${entry.id}','stueckzahl',this.value)" />
        </td>
        <td class="text-right">
          <input type="number" min="0" step="0.01" class="input input-sm text-right" style="width:80px"
            value="${entry.vkPreis || ''}" placeholder="0,00"
            oninput="WriteoffsView.update('${entry.id}','vkPreis',this.value)" />
        </td>
        <td class="text-right text-bold" id="wo-total-${entry.id}">
          ${total > 0 ? Utils.fmtEuro(total) : '—'}
        </td>
        <td>
          <button class="btn-delete-row"
            onclick="WriteoffsView.deleteEntry('${entry.id}')">✕</button>
        </td>
      </tr>
    `;
  },

  _calcTotal(entries) {
    const total = entries
      .filter(e => e.date === this._date)
      .reduce((sum, e) => sum + Utils.parseNum(e.stueckzahl) * Utils.parseNum(e.vkPreis), 0);
    return Utils.fmtEuro(total);
  },

  _renderHistory(entries) {
    let filtered = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    if (this._filter !== 'all') filtered = filtered.filter(e => e.typ === this._filter);
    if (filtered.length === 0) {
      return '<div class="empty-state"><p>Keine Abschreibungen vorhanden.</p></div>';
    }

    // Gruppieren nach Datum
    const byDate = {};
    filtered.forEach(e => {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    });

    return Object.keys(byDate).sort((a, b) => b.localeCompare(a)).map(date => {
      const dayEntries = byDate[date];
      const dayTotal = dayEntries.reduce((s, e) => s + Utils.parseNum(e.stueckzahl) * Utils.parseNum(e.vkPreis), 0);
      return `
        <div style="padding:12px 22px;border-bottom:1px solid var(--gray-100)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-weight:600;font-size:0.9rem">${Utils.fmtDate(date)}</span>
            <span style="font-weight:700;color:var(--danger)">${Utils.fmtEuro(dayTotal)}</span>
          </div>
          <div style="font-size:0.85rem;color:var(--gray-500)">
            ${dayEntries.map(e =>
              `${Utils.escHtml(e.sorte || '—')} · ${e.stueckzahl || 0} Stk · ${Utils.fmtEuro(e.vkPreis || 0)}
               <span class="badge badge-yellow" style="margin-left:4px">${e.typ || 'schnitt'}</span>`
            ).join('<br>')}
          </div>
        </div>
      `;
    }).join('');
  },

  setDate(date) { this._date = date; this.render(); document.getElementById('wo-date').value = date; },
  setFilter(f) { this._filter = f; this.render(); },

  addRow() {
    const branchId = Auth.getBranchId();
    Store.addWriteoff(branchId, { date: this._date, sorte: '', typ: 'schnitt', stueckzahl: 0, vkPreis: 0 });
    this.render();
    document.getElementById('wo-date').value = this._date;
  },

  update(id, field, value) {
    const branchId = Auth.getBranchId();
    const entries  = Store.getWriteoffs(branchId);
    const entry    = entries.find(e => e.id === id);
    if (!entry) return;
    entry[field] = field === 'stueckzahl' || field === 'vkPreis' ? Utils.parseNum(value) : value;
    Store.saveWriteoffs(branchId, entries);

    const total = Utils.parseNum(entry.stueckzahl) * Utils.parseNum(entry.vkPreis);
    const cell  = document.getElementById(`wo-total-${id}`);
    if (cell) cell.textContent = total > 0 ? Utils.fmtEuro(total) : '—';

    const totEl = document.getElementById('wo-total');
    if (totEl) totEl.textContent = this._calcTotal(entries);
  },

  deleteEntry(id) {
    Utils.confirm('Eintrag wirklich löschen?', () => {
      const branchId = Auth.getBranchId();
      Store.deleteWriteoff(branchId, id);
      this.render();
      document.getElementById('wo-date').value = this._date;
    });
  }
};

window.WriteoffsView = WriteoffsView;
