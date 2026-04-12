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
        <button class="tab ${this._activeTab==='landgard'?'active':''}"   onclick="DashboardView.setTab('landgard')">Landgard Gesamt</button>
        <button class="tab ${this._activeTab==='nonfood'?'active':''}"    onclick="DashboardView.setTab('nonfood')">Non-Food Gesamt</button>
        <button class="tab ${this._activeTab==='history'?'active':''}"    onclick="DashboardView.setTab('history')">Bestellhistorie</button>
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
      case 'schnitt':   return this._renderBestellungGesamt('schnitt', settings);
      case 'landgard':  return this._renderBestellungGesamt('landgard', settings);
      case 'nonfood':   return this._renderNonFoodGesamt(settings);
      case 'history':   return this._renderBestellhistorie(settings);
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

  // ── Schnitt / Landgard Gesamt (universell für beide Typen) ───────────────
  _renderBestellungGesamt(type, settings) {
    const catalog    = Store.getCatalog();
    const ekPreise   = Store.getEkPreise();
    const allOrders  = Store.getAllOrders(type);
    const branchNames = settings.branchNames;
    const icons      = { schnitt: '✂️', landgard: '🌿' };
    const labels     = { schnitt: 'Schnittbestellungen', landgard: 'Landgard-Bestellungen' };

    const aggregated = {};
    Object.entries(allOrders).forEach(([branchId, orders]) => {
      orders.forEach(o => {
        if (!aggregated[o.productId]) aggregated[o.productId] = { totalMenge: 0, byBranch: {} };
        aggregated[o.productId].totalMenge += o.menge;
        aggregated[o.productId].byBranch[branchId] =
          (aggregated[o.productId].byBranch[branchId] || 0) + o.menge;
      });
    });

    if (Object.keys(aggregated).length === 0) {
      return `<div class="empty-state"><div class="empty-icon">${icons[type]}</div>
        <p>Noch keine ${labels[type]} eingegangen.</p></div>`;
    }

    let gesamtVk = 0, gesamtEk = 0;

    const catHtml = (catalog[type]?.categories || []).map(cat => {
      const itemRows = cat.items.filter(item => aggregated[item.id]).map(item => {
        const agg   = aggregated[item.id];
        const ek    = ekPreise[item.id] || 0;
        const vkGes = agg.totalMenge * item.vk;
        const ekGes = agg.totalMenge * ek;
        gesamtVk += vkGes;
        gesamtEk += ekGes;
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
          </tr>`;
      }).join('');
      if (!itemRows) return '';
      return `
        <div class="card" style="margin-bottom:16px">
          <div class="card-header" style="background:var(--gray-50)"><h3>${Utils.escHtml(cat.name)}</h3></div>
          <div class="table-wrapper"><table>
            <thead><tr>
              <th style="width:32%">Sortiment</th><th style="width:8%">VE</th>
              <th class="text-right" style="width:12%">Gesamt-Menge</th>
              <th class="text-right" style="width:12%">VK/Stk</th>
              <th class="text-right" style="width:12%">EK/Stk</th>
              <th class="text-right" style="width:12%">VK gesamt</th>
              <th class="text-right" style="width:12%">EK gesamt</th>
            </tr></thead>
            <tbody>${itemRows}</tbody>
          </table></div>
        </div>`;
    }).join('');

    return `
      <div class="summary-bar" style="margin-bottom:20px">
        <div class="summary-item">
          <span class="summary-label">Sortimente</span>
          <span class="summary-value">${Object.keys(aggregated).length}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Filialen</span>
          <span class="summary-value">${Object.keys(allOrders).length}</span>
        </div>
        <div class="summary-item summary-total">
          <span class="summary-label">Gesamtbestellwert (VK)</span>
          <span class="summary-value">${Utils.fmtEuro(gesamtVk)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Einkaufswert (EK)</span>
          <span class="summary-value" style="color:var(--gray-600)">${Utils.fmtEuro(gesamtEk)}</span>
        </div>
      </div>
      ${catHtml}`;
  },

  // ── Non-Food Gesamt ───────────────────────────────────────────────────────
  _renderNonFoodGesamt(settings) {
    const branchNames = settings.branchNames;
    // Alle NonFood-Bestellungen aller Filialen aggregieren (nach Artikelname)
    const byArtikel = {}; // artikelname(lower) → { name, totalMenge, entries[] }
    for (let i = 1; i <= 10; i++) {
      const orders = Store.getOrders(i, 'nonfood');
      orders.forEach(o => {
        if (!o.artikel) return;
        const key = o.artikel.toLowerCase().trim();
        if (!byArtikel[key]) byArtikel[key] = { name: o.artikel, totalMenge: 0, entries: [] };
        byArtikel[key].totalMenge += Utils.parseNum(o.menge);
        byArtikel[key].entries.push({ ...o, branchId: i, branchName: branchNames[i] || 'F'+i });
      });
    }

    const urgent = Store.getAllUrgentOrders();
    // Dringende nonfood-Bestellungen gesondert sammeln
    const urgentRows = Object.entries(urgent).flatMap(([branchId, orders]) =>
      orders.filter(o => o.source === 'nonfood').map(o => ({ ...o, branchName: branchNames[branchId] || 'F'+branchId }))
    );

    if (Object.keys(byArtikel).length === 0 && urgentRows.length === 0) {
      return '<div class="empty-state"><div class="empty-icon">📦</div><p>Noch keine Non-Food Bestellungen.</p></div>';
    }

    const artikelRows = Object.values(byArtikel)
      .sort((a, b) => b.totalMenge - a.totalMenge)
      .map(a => {
        const byBranch = a.entries
          .map(e => `${e.branchName}: ${e.menge || 0} ${e.ve||''}`)
          .join(' · ');
        return `
          <tr>
            <td>
              <div style="font-weight:500">${Utils.escHtml(a.name)}</div>
              <div style="font-size:0.78rem;color:var(--gray-400);margin-top:2px">${byBranch}</div>
            </td>
            <td class="text-right text-bold">${a.totalMenge}</td>
            <td>${Utils.escHtml(a.entries[0]?.ve || '')}</td>
            <td>${Utils.fmtDate(a.entries[0]?.date)}</td>
          </tr>`;
      }).join('');

    const urgentHtml = urgentRows.length > 0 ? `
      <div class="card" style="margin-bottom:16px;border:2px solid var(--yellow)">
        <div class="card-header" style="background:var(--yellow-light)">
          <h3>⚡ Dringende Non-Food Bestellungen</h3>
        </div>
        <div class="table-wrapper"><table>
          <thead><tr>
            <th>Filiale</th><th>Datum</th><th>Artikel</th><th>Größe</th>
            <th class="text-right">Menge</th><th class="text-right">VK-Preis</th>
          </tr></thead>
          <tbody>
            ${urgentRows.map(o => `
              <tr>
                <td>${Utils.escHtml(o.branchName)}</td>
                <td>${Utils.fmtDate(o.date)}</td>
                <td>${Utils.escHtml(o.artikel||'—')}</td>
                <td>${Utils.escHtml(o.groesse||'—')}</td>
                <td class="text-right">${o.menge||0}</td>
                <td class="text-right">${o.vkPreis > 0 ? Utils.fmtEuro(o.vkPreis) : '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table></div>
      </div>` : '';

    return urgentHtml + `
      <div class="card">
        <div class="card-header"><h3>Alle Non-Food Artikel (aggregiert)</h3></div>
        <div class="table-wrapper"><table>
          <thead><tr>
            <th style="width:45%">Artikel</th>
            <th class="text-right" style="width:15%">Gesamt-Menge</th>
            <th style="width:10%">VE</th>
            <th style="width:15%">Zuletzt</th>
          </tr></thead>
          <tbody>${artikelRows || '<tr><td colspan="4" class="text-center text-muted" style="padding:24px">Keine Einträge.</td></tr>'}</tbody>
        </table></div>
      </div>`;
  },

  // ── Bestellhistorie (alle Typen, alle Filialen, mit Datum) ────────────────
  _renderBestellhistorie(settings) {
    const branchNames = settings.branchNames;
    const catalog     = Store.getCatalog();
    const ekPreise    = Store.getEkPreise();

    // Alle Einträge sammeln: {date, branchId, branchName, type, artikel, menge, vk, ek, urgent}
    const allEntries = [];

    // Schnitt + Landgard
    ['schnitt','landgard'].forEach(type => {
      for (let i = 1; i <= 10; i++) {
        Store.getOrders(i, type).forEach(o => {
          let item = null;
          catalog[type]?.categories.forEach(cat => {
            const f = cat.items.find(ci => ci.id === o.productId);
            if (f) item = f;
          });
          if (!item) return;
          allEntries.push({
            date: o.date, branchId: i,
            branchName: branchNames[i] || 'F'+i,
            type, artikel: item.name,
            menge: o.menge, vk: item.vk,
            ek: ekPreise[o.productId] || 0,
            urgent: false,
            submittedAt: o.submittedAt
          });
        });
      }
    });

    // NonFood
    for (let i = 1; i <= 10; i++) {
      Store.getOrders(i, 'nonfood').forEach(o => {
        allEntries.push({
          date: o.date, branchId: i,
          branchName: branchNames[i] || 'F'+i,
          type: 'nonfood', artikel: o.artikel || '—',
          menge: o.menge, vk: 0, ek: 0, urgent: false,
          submittedAt: o.submittedAt
        });
      });
    }

    // Dringende Bestellungen
    Object.entries(Store.getAllUrgentOrders()).forEach(([branchId, orders]) => {
      orders.forEach(o => {
        allEntries.push({
          date: o.date, branchId: parseInt(branchId),
          branchName: branchNames[branchId] || 'F'+branchId,
          type: `dringend (${o.source})`,
          artikel: o.artikel || '—',
          groesse: o.groesse || '',
          menge: o.menge, vk: o.vkPreis || 0, ek: 0,
          urgent: true, submittedAt: o.submittedAt
        });
      });
    });

    if (allEntries.length === 0) {
      return '<div class="empty-state"><div class="empty-icon">📋</div><p>Noch keine Bestellungen vorhanden.</p></div>';
    }

    // Nach Datum sortieren (neueste zuerst)
    allEntries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Gruppieren nach Datum
    const byDate = {};
    allEntries.forEach(e => {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    });

    const typeLabels = { schnitt: '✂️ Schnitt', landgard: '🌿 Landgard', nonfood: '📦 Non-Food' };

    const html = Object.keys(byDate).sort((a,b)=>b.localeCompare(a)).map(date => {
      const entries = byDate[date];
      const dayVk = entries.reduce((s, e) => s + Utils.parseNum(e.menge) * Utils.parseNum(e.vk), 0);
      const rows = entries.map(e => `
        <tr style="${e.urgent ? 'background:var(--yellow-light)' : ''}">
          <td><span class="badge badge-yellow">${Utils.escHtml(branchNames[e.branchId] || 'F'+e.branchId)}</span></td>
          <td><span class="text-muted" style="font-size:0.8rem">${e.urgent ? '⚡ '+Utils.escHtml(e.type) : (typeLabels[e.type]||e.type)}</span></td>
          <td>
            ${Utils.escHtml(e.artikel)}
            ${e.groesse ? `<span class="text-muted" style="font-size:0.8rem"> · ${Utils.escHtml(e.groesse)}</span>` : ''}
          </td>
          <td class="text-right">${e.menge || 0}</td>
          <td class="text-right">${e.vk > 0 ? Utils.fmtEuro(e.vk) : '—'}</td>
          <td class="text-right text-bold">${e.vk > 0 ? Utils.fmtEuro(Utils.parseNum(e.menge)*e.vk) : '—'}</td>
          <td class="text-center">${e.submittedAt ? '<span class="badge badge-success">✓</span>' : '<span class="badge badge-info">Offen</span>'}</td>
        </tr>`).join('');

      return `
        <div class="card" style="margin-bottom:16px">
          <div class="card-header" style="background:var(--gray-50)">
            <h3 style="font-size:1rem">${Utils.fmtDate(date)}</h3>
            <div style="display:flex;gap:12px;align-items:center">
              <span class="text-muted" style="font-size:0.85rem">${entries.length} Einträge</span>
              <span style="font-weight:700">${Utils.fmtEuro(dayVk)}</span>
            </div>
          </div>
          <div class="table-wrapper"><table>
            <thead><tr>
              <th>Filiale</th><th>Typ</th><th>Artikel</th>
              <th class="text-right">Menge</th>
              <th class="text-right">VK/Stk</th>
              <th class="text-right">Gesamt VK</th>
              <th class="text-center">Status</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table></div>
        </div>`;
    }).join('');

    return `
      <div class="summary-bar" style="margin-bottom:20px">
        <div class="summary-item">
          <span class="summary-label">Einträge gesamt</span>
          <span class="summary-value">${allEntries.length}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Tage mit Bestellungen</span>
          <span class="summary-value">${Object.keys(byDate).length}</span>
        </div>
      </div>
      ${html}`;
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
