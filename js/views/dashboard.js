// ============================================================================
// PROFIFLORA – Ansicht: Admin Dashboard
// ============================================================================

const DashboardView = {

  _activeTab: 'overview',

  render() {
    document.getElementById('topbar-title').textContent = 'Dashboard';
    const settings = Store.getSettings();

    const html = `
      <div class="tabs">
        <button class="tab ${this._activeTab==='overview'?'active':''}"   onclick="DashboardView.setTab('overview')">Übersicht</button>
        <button class="tab ${this._activeTab==='schnitt'?'active':''}"    onclick="DashboardView.setTab('schnitt')">Schnitt Gesamt</button>
        <button class="tab ${this._activeTab==='writeoffs'?'active':''}"  onclick="DashboardView.setTab('writeoffs')">Abschreibungen</button>
        <button class="tab ${this._activeTab==='inventory'?'active':''}"  onclick="DashboardView.setTab('inventory')">Inventur</button>
      </div>
      <div id="dashboard-content">
        ${this._renderTab(settings)}
      </div>
    `;
    document.getElementById('page-content').innerHTML = html;
  },

  setTab(tab) { this._activeTab = tab; this.render(); },

  _renderTab(settings) {
    switch (this._activeTab) {
      case 'overview':  return this._renderOverview(settings);
      case 'schnitt':   return this._renderSchnittGesamt(settings);
      case 'writeoffs': return this._renderWriteoffs(settings);
      case 'inventory': return this._renderInventory(settings);
      default: return '';
    }
  },

  // ── Übersicht ────────────────────────────────────────────────────────────
  _renderOverview(settings) {
    const schnittAll = Store.getAllOrders('schnitt');
    const landgardAll = Store.getAllOrders('landgard');
    const woAll = Store.getAllWriteoffs();
    const invAll = Store.getAllInventory();
    const ekPreise = Store.getEkPreise();
    const catalog = Store.getCatalog();

    let totalOrdersVk = 0, totalOrdersEk = 0, totalWo = 0;

    // Schnitt + Landgard Bestellwerte
    ['schnitt','landgard'].forEach(type => {
      const allOrders = Store.getAllOrders(type);
      Object.values(allOrders).forEach(orders => {
        orders.forEach(o => {
          let item = null;
          catalog[type]?.categories.forEach(cat => {
            const found = cat.items.find(i => i.id === o.productId);
            if (found) item = found;
          });
          if (item) {
            totalOrdersVk += o.menge * item.vk;
            totalOrdersEk += o.menge * (ekPreise[o.productId] || 0);
          }
        });
      });
    });

    // Abschreibungen
    Object.values(woAll).forEach(entries =>
      entries.forEach(e => { totalWo += Utils.parseNum(e.stueckzahl) * Utils.parseNum(e.vkPreis); })
    );

    // Filialen mit Aktivität
    const activeBranches = new Set([
      ...Object.keys(schnittAll), ...Object.keys(landgardAll)
    ]).size;

    const statsHtml = `
      <div class="stats-grid">
        <div class="stat-card yellow">
          <div class="stat-label">Aktive Filialen</div>
          <div class="stat-value">${activeBranches} / 10</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Bestellwert gesamt (VK)</div>
          <div class="stat-value">${Utils.fmtEuro(totalOrdersVk)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Einkaufswert gesamt (EK)</div>
          <div class="stat-value">${Utils.fmtEuro(totalOrdersEk)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Abschreibungen gesamt</div>
          <div class="stat-value" style="color:var(--danger)">${Utils.fmtEuro(totalWo)}</div>
        </div>
      </div>
    `;

    // Pro-Filiale-Tabelle
    const rowsHtml = Array.from({length: 10}, (_, i) => i + 1).map(branchId => {
      const bName = settings.branchNames[branchId] || `Filiale ${branchId}`;
      let vkSum = 0, ekSum = 0;
      ['schnitt','landgard'].forEach(type => {
        const orders = Store.getOrders(branchId, type);
        orders.forEach(o => {
          let item = null;
          catalog[type]?.categories.forEach(cat => {
            const found = cat.items.find(i => i.id === o.productId);
            if (found) item = found;
          });
          if (item) {
            vkSum += o.menge * item.vk;
            ekSum += o.menge * (ekPreise[o.productId] || 0);
          }
        });
      });
      const woSum = (Store.getWriteoffs(branchId) || [])
        .reduce((s, e) => s + Utils.parseNum(e.stueckzahl) * Utils.parseNum(e.vkPreis), 0);
      const invCount = (Store.getInventory(branchId) || []).length;
      return `
        <tr>
          <td style="font-weight:600">${Utils.escHtml(bName)}</td>
          <td class="text-right">${Utils.fmtEuro(vkSum)}</td>
          <td class="text-right" style="color:var(--gray-600)">${Utils.fmtEuro(ekSum)}</td>
          <td class="text-right" style="color:var(--danger)">${Utils.fmtEuro(woSum)}</td>
          <td class="text-center">${invCount > 0 ? `<span class="badge badge-success">${invCount} Pos.</span>` : '—'}</td>
        </tr>
      `;
    }).join('');

    return statsHtml + `
      <div class="card">
        <div class="card-header"><h3>Filialübersicht</h3></div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Filiale</th>
                <th class="text-right">Bestellwert (VK)</th>
                <th class="text-right">Einkaufswert (EK)</th>
                <th class="text-right">Abschreibungen</th>
                <th class="text-center">Inventur</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ── Bestellungen (Schnitt / Landgard) ────────────────────────────────────
  _renderOrders(type, settings) {
    const allOrders = Store.getAllOrders(type);
    const ekPreise  = Store.getEkPreise();
    const catalog   = Store.getCatalog();

    if (Object.keys(allOrders).length === 0) {
      return '<div class="empty-state"><div class="empty-icon">📋</div><p>Noch keine Bestellungen eingegangen.</p></div>';
    }

    return Array.from({length: 10}, (_, i) => i + 1).map(branchId => {
      const orders = allOrders[branchId];
      if (!orders || orders.length === 0) return '';
      const bName = settings.branchNames[branchId] || `Filiale ${branchId}`;

      // Gruppe nach Datum
      const byDate = {};
      orders.forEach(o => { if (!byDate[o.date]) byDate[o.date] = []; byDate[o.date].push(o); });

      const datesHtml = Object.keys(byDate).sort((a,b) => b.localeCompare(a)).map(date => {
        const dayOrders = byDate[date];
        let vkTotal = 0, ekTotal = 0;
        const rowsHtml = dayOrders.map(o => {
          let item = null;
          catalog[type]?.categories.forEach(cat => {
            const found = cat.items.find(i => i.id === o.productId);
            if (found) item = found;
          });
          if (!item) return '';
          const vk = item.vk;
          const ek = ekPreise[o.productId] || 0;
          const vkGesamt = o.menge * vk;
          const ekGesamt = o.menge * ek;
          vkTotal += vkGesamt;
          ekTotal += ekGesamt;
          return `
            <tr>
              <td>${Utils.escHtml(item.name)}</td>
              <td>${Utils.escHtml(item.ve)}</td>
              <td class="text-right">${o.menge}</td>
              <td class="text-right">${Utils.fmtEuro(vk)}</td>
              <td class="text-right" style="color:var(--gray-600)">${ek > 0 ? Utils.fmtEuro(ek) : '—'}</td>
              <td class="text-right text-bold">${Utils.fmtEuro(vkGesamt)}</td>
              <td class="text-right" style="color:var(--gray-600)">${ekGesamt > 0 ? Utils.fmtEuro(ekGesamt) : '—'}</td>
              <td>${o.submitted ? '<span class="badge badge-success">✓</span>' : '<span class="badge badge-info">Offen</span>'}</td>
            </tr>
          `;
        }).join('');

        return `
          <div style="margin-bottom:12px">
            <div style="font-size:0.85rem;font-weight:600;color:var(--gray-500);padding:8px 0;border-bottom:1px solid var(--gray-100)">
              ${Utils.fmtDate(date)}
            </div>
            <table style="margin-top:0">
              <thead><tr>
                <th>Artikel</th><th>VE</th>
                <th class="text-right">Menge</th>
                <th class="text-right">VK</th>
                <th class="text-right">EK</th>
                <th class="text-right">Gesamt VK</th>
                <th class="text-right">Gesamt EK</th>
                <th>Status</th>
              </tr></thead>
              <tbody>${rowsHtml}</tbody>
              <tfoot><tr>
                <td colspan="5" class="text-right">Summe:</td>
                <td class="text-right text-bold">${Utils.fmtEuro(vkTotal)}</td>
                <td class="text-right" style="color:var(--gray-600)">${Utils.fmtEuro(ekTotal)}</td>
                <td></td>
              </tr></tfoot>
            </table>
          </div>
        `;
      }).join('');

      return `
        <div class="card">
          <div class="card-header"><h3>${Utils.escHtml(bName)}</h3></div>
          <div class="card-body">${datesHtml}</div>
        </div>
      `;
    }).join('');
  },

  // ── Schnitt Gesamt (aggregierte Mengen aller Filialen pro Sortiment) ─────
  _renderSchnittGesamt(settings) {
    const catalog  = Store.getCatalog();
    const ekPreise = Store.getEkPreise();
    const allOrders = Store.getAllOrders('schnitt');

    // Alle Bestellungen aller Filialen sammeln
    // Aggregieren: productId → { menge, filialenMengen: {branchId: menge} }
    const aggregated = {}; // productId → { totalMenge, byBranch: {branchId: menge} }
    Object.entries(allOrders).forEach(([branchId, orders]) => {
      orders.forEach(o => {
        if (!aggregated[o.productId]) {
          aggregated[o.productId] = { totalMenge: 0, byBranch: {} };
        }
        aggregated[o.productId].totalMenge += o.menge;
        aggregated[o.productId].byBranch[branchId] =
          (aggregated[o.productId].byBranch[branchId] || 0) + o.menge;
      });
    });

    if (Object.keys(aggregated).length === 0) {
      return '<div class="empty-state"><div class="empty-icon">✂️</div><p>Noch keine Schnittbestellungen eingegangen.</p></div>';
    }

    // Filialnamen für Tooltips
    const branchNames = settings.branchNames;

    // Gesamtwerte
    let gesamtVk = 0, gesamtEk = 0;

    // Pro Kategorie rendern
    const catHtml = catalog.schnitt.categories.map(cat => {
      const itemRows = cat.items
        .filter(item => aggregated[item.id])
        .map(item => {
          const agg = aggregated[item.id];
          const ek  = ekPreise[item.id] || 0;
          const vkGes = agg.totalMenge * item.vk;
          const ekGes = agg.totalMenge * ek;
          gesamtVk += vkGes;
          gesamtEk += ekGes;

          // Aufschlüsselung pro Filiale als kleiner Text
          const byBranchText = Object.entries(agg.byBranch)
            .map(([bid, m]) => `${branchNames[bid] || 'F'+bid}: ${m}`)
            .join(' · ');

          return `
            <tr>
              <td>
                <div style="font-weight:500">${Utils.escHtml(item.name)}</div>
                <div style="font-size:0.78rem;color:var(--gray-400);margin-top:2px">${byBranchText}</div>
              </td>
              <td><span class="badge badge-yellow">${Utils.escHtml(item.ve)}</span></td>
              <td class="text-right text-bold" style="font-size:1.05rem">${agg.totalMenge}</td>
              <td class="text-right">${Utils.fmtEuro(item.vk)}</td>
              <td class="text-right" style="color:var(--gray-500)">${ek > 0 ? Utils.fmtEuro(ek) : '—'}</td>
              <td class="text-right text-bold">${Utils.fmtEuro(vkGes)}</td>
              <td class="text-right" style="color:var(--gray-600)">${ekGes > 0 ? Utils.fmtEuro(ekGes) : '—'}</td>
            </tr>
          `;
        }).join('');

      if (!itemRows) return '';
      return `
        <div class="card" style="margin-bottom:16px">
          <div class="card-header" style="background:var(--gray-50)">
            <h3>${Utils.escHtml(cat.name)}</h3>
          </div>
          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th style="width:32%">Sortiment</th>
                <th style="width:8%">VE</th>
                <th class="text-right" style="width:12%">Gesamt-Menge</th>
                <th class="text-right" style="width:12%">VK/Stk</th>
                <th class="text-right" style="width:12%">EK/Stk</th>
                <th class="text-right" style="width:12%">VK gesamt</th>
                <th class="text-right" style="width:12%">EK gesamt</th>
              </tr></thead>
              <tbody>${itemRows}</tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="summary-bar" style="margin-bottom:20px">
        <div class="summary-item">
          <span class="summary-label">Sortimente bestellt</span>
          <span class="summary-value">${Object.keys(aggregated).length}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Beteiligte Filialen</span>
          <span class="summary-value">${Object.keys(allOrders).length}</span>
        </div>
        <div class="summary-item summary-total">
          <span class="summary-label">Gesamtbestellwert (VK)</span>
          <span class="summary-value">${Utils.fmtEuro(gesamtVk)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Gesamteinkaufswert (EK)</span>
          <span class="summary-value" style="color:var(--gray-600)">${Utils.fmtEuro(gesamtEk)}</span>
        </div>
      </div>
      ${catHtml}
    `;
  },

  // ── Non-Food ─────────────────────────────────────────────────────────────
  _renderNonFood(settings) {
    let anyData = false;
    const html = Array.from({length: 10}, (_, i) => i + 1).map(branchId => {
      const orders = Store.getOrders(branchId, 'nonfood');
      if (orders.length === 0) return '';
      anyData = true;
      const bName = settings.branchNames[branchId] || `Filiale ${branchId}`;
      const rows = orders.map(o => `
        <tr>
          <td>${Utils.escHtml(o.artikel || '—')}</td>
          <td class="text-right">${o.menge || 0}</td>
          <td>${Utils.escHtml(o.ve || '')}</td>
          <td>${Utils.escHtml(o.farbe || '—')}</td>
          <td>${Utils.escHtml(o.hinweis || '')}</td>
          <td>${Utils.fmtDate(o.date)}</td>
          <td>${o.submitted ? '<span class="badge badge-success">✓</span>' : '<span class="badge badge-info">Offen</span>'}</td>
        </tr>
      `).join('');
      return `
        <div class="card">
          <div class="card-header"><h3>${Utils.escHtml(bName)}</h3></div>
          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Artikel</th><th class="text-right">Menge</th><th>VE</th>
                <th>Farbe</th><th>Hinweis</th><th>Datum</th><th>Status</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');
    if (!anyData) return '<div class="empty-state"><div class="empty-icon">📦</div><p>Noch keine Non-Food Bestellungen.</p></div>';
    return html;
  },

  // ── Abschreibungen (alle Filialen) ────────────────────────────────────────
  _renderWriteoffs(settings) {
    const woAll = Store.getAllWriteoffs();
    if (Object.keys(woAll).length === 0) {
      return '<div class="empty-state"><div class="empty-icon">📉</div><p>Noch keine Abschreibungen.</p></div>';
    }
    return Object.entries(woAll).map(([branchId, entries]) => {
      const bName = settings.branchNames[branchId] || `Filiale ${branchId}`;
      const total = entries.reduce((s, e) => s + Utils.parseNum(e.stueckzahl) * Utils.parseNum(e.vkPreis), 0);
      const rows = entries.sort((a,b)=>b.date.localeCompare(a.date)).map(e => `
        <tr>
          <td>${Utils.fmtDate(e.date)}</td>
          <td>${Utils.escHtml(e.sorte || '—')}</td>
          <td><span class="badge badge-yellow">${e.typ||'schnitt'}</span></td>
          <td class="text-right">${e.stueckzahl || 0}</td>
          <td class="text-right">${Utils.fmtEuro(e.vkPreis || 0)}</td>
          <td class="text-right text-bold" style="color:var(--danger)">
            ${Utils.fmtEuro(Utils.parseNum(e.stueckzahl)*Utils.parseNum(e.vkPreis))}
          </td>
        </tr>
      `).join('');
      return `
        <div class="card">
          <div class="card-header">
            <h3>${Utils.escHtml(bName)}</h3>
            <span style="font-weight:700;color:var(--danger)">${Utils.fmtEuro(total)}</span>
          </div>
          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Datum</th><th>Sorte</th><th>Typ</th>
                <th class="text-right">Stück</th>
                <th class="text-right">VK-Preis</th>
                <th class="text-right">Gesamt</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');
  },

  // ── Inventur (alle Filialen) ──────────────────────────────────────────────
  _renderInventory(settings) {
    const invAll = Store.getAllInventory();
    if (Object.keys(invAll).length === 0) {
      return '<div class="empty-state"><div class="empty-icon">📊</div><p>Noch keine Inventuren erfasst.</p></div>';
    }
    return Object.entries(invAll).map(([branchId, entries]) => {
      const bName = settings.branchNames[branchId] || `Filiale ${branchId}`;
      const total = entries.reduce((s, e) => s + Utils.parseNum(e.stueckzahl) * Utils.parseNum(e.vkPreis), 0);
      const rows = entries.sort((a,b)=>b.date.localeCompare(a.date)).map(e => `
        <tr>
          <td>${Utils.fmtDate(e.date)}</td>
          <td>${Utils.escHtml(e.sorte || '—')}</td>
          <td class="text-right">${e.stueckzahl || 0}</td>
          <td class="text-right">${Utils.fmtEuro(e.vkPreis || 0)}</td>
          <td class="text-right text-bold">
            ${Utils.fmtEuro(Utils.parseNum(e.stueckzahl)*Utils.parseNum(e.vkPreis))}
          </td>
        </tr>
      `).join('');
      return `
        <div class="card">
          <div class="card-header">
            <h3>${Utils.escHtml(bName)}</h3>
            <span style="font-weight:700">${Utils.fmtEuro(total)}</span>
          </div>
          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Datum</th><th>Sorte</th>
                <th class="text-right">Stück</th>
                <th class="text-right">VK-Preis</th>
                <th class="text-right">Gesamtwert</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');
  }
};

window.DashboardView = DashboardView;
