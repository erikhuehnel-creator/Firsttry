// ============================================================================
// PROFIFLORA – Ansicht: Sortiment-Verwaltung (nur Admin)
// ============================================================================

const CatalogAdminView = {

  _activeType: 'schnitt',

  render() {
    document.getElementById('topbar-title').textContent = 'Sortiment-Verwaltung';
    const catalog  = Store.getCatalog();
    const ekPreise = Store.getEkPreise();
    const expected = Store.getExpectedSales();

    const html = `
      <div class="card" style="margin-bottom:16px;background:var(--yellow-light);border:1px solid var(--yellow)">
        <div class="card-body" style="padding:14px 20px;font-size:0.88rem;color:var(--gray-700)">
          <strong>Hinweis:</strong> Änderungen hier werden sofort für <strong>alle Filialen</strong> sichtbar.
          Neue Artikel, VK-Preise und EK-Preise werden in Echtzeit übernommen.
        </div>
      </div>

      <div class="tabs">
        <button class="tab ${this._activeType==='schnitt'?'active':''}"
          onclick="CatalogAdminView.setType('schnitt')">Schnitt</button>
        <button class="tab ${this._activeType==='landgard'?'active':''}"
          onclick="CatalogAdminView.setType('landgard')">Landgard</button>
        <button class="tab ${this._activeType==='ek'?'active':''}"
          onclick="CatalogAdminView.setType('ek')">EK-Preise</button>
        <button class="tab ${this._activeType==='expected'?'active':''}"
          onclick="CatalogAdminView.setType('expected')">Erwartete Mengen</button>
      </div>

      <div id="catalog-content">
        ${this._renderContent(catalog, ekPreise, expected)}
      </div>
    `;
    document.getElementById('page-content').innerHTML = html;
  },

  setType(type) { this._activeType = type; this.render(); },

  _renderContent(catalog, ekPreise, expected) {
    if (this._activeType === 'ek')       return this._renderEk(catalog, ekPreise);
    if (this._activeType === 'expected') return this._renderExpected(catalog, expected);
    const type = this._activeType;
    const catData = catalog[type];
    if (!catData) return '';

    return catData.categories.map((cat, catIdx) => `
      <div class="card">
        <div class="card-header">
          <h3>${Utils.escHtml(cat.name)}</h3>
          <button class="btn btn-secondary btn-sm"
            onclick="CatalogAdminView.addItem('${type}',${catIdx})">+ Artikel hinzufügen</button>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style="width:35%">Artikelname</th>
                <th style="width:12%">VE</th>
                <th style="width:16%" class="text-right">VK-Preis (€)</th>
                ${type === 'landgard' ? '<th style="width:10%">Topf</th>' : ''}
                <th style="width:44px"></th>
              </tr>
            </thead>
            <tbody>
              ${cat.items.map((item, itemIdx) => this._renderItemRow(type, catIdx, itemIdx, item)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `).join('') + `
      <div class="card">
        <div class="card-header"><h3>Neue Kategorie hinzufügen</h3></div>
        <div class="card-body">
          <div style="display:flex;gap:12px;align-items:center">
            <input type="text" class="input" id="new-cat-name-${type}" placeholder="Kategoriename" style="max-width:300px" />
            <button class="btn btn-secondary" onclick="CatalogAdminView.addCategory('${type}')">Kategorie anlegen</button>
          </div>
        </div>
      </div>
    `;
  },

  _renderItemRow(type, catIdx, itemIdx, item) {
    const topfCol = type === 'landgard'
      ? `<td><input type="text" class="input input-sm" style="width:60px"
           value="${Utils.escHtml(item.topf || '')}" placeholder="12"
           onchange="CatalogAdminView.updateItem('${type}',${catIdx},${itemIdx},'topf',this.value)" /></td>`
      : '';
    return `
      <tr>
        <td>
          <input type="text" class="input input-sm" value="${Utils.escHtml(item.name)}"
            placeholder="Artikelname"
            onchange="CatalogAdminView.updateItem('${type}',${catIdx},${itemIdx},'name',this.value)" />
        </td>
        <td>
          <input type="text" class="input input-sm" style="width:70px" value="${Utils.escHtml(item.ve)}"
            placeholder="Stk"
            onchange="CatalogAdminView.updateItem('${type}',${catIdx},${itemIdx},'ve',this.value)" />
        </td>
        <td class="text-right">
          <input type="number" min="0" step="0.01" class="input input-sm text-right" style="width:90px"
            value="${item.vk}"
            oninput="CatalogAdminView.updateItem('${type}',${catIdx},${itemIdx},'vk',this.value)" />
        </td>
        ${topfCol}
        <td>
          <button class="btn-delete-row"
            onclick="CatalogAdminView.deleteItem('${type}',${catIdx},${itemIdx})">✕</button>
        </td>
      </tr>
    `;
  },

  _renderEk(catalog, ekPreise) {
    const allItems = [];
    ['schnitt','landgard'].forEach(type => {
      catalog[type]?.categories.forEach(cat => {
        cat.items.forEach(item => allItems.push({ ...item, _type: type }));
      });
    });
    return `
      <div class="card">
        <div class="card-header">
          <h3>EK-Preise festlegen</h3>
          <span class="badge badge-danger" style="font-size:0.78rem">Nur im Dashboard sichtbar</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>Artikel</th><th>Typ</th>
              <th class="text-right">VK-Preis</th>
              <th class="text-right">EK-Preis (€)</th>
              <th class="text-right">Marge</th>
            </tr></thead>
            <tbody>
              ${allItems.map(item => {
                const ek = ekPreise[item.id] || 0;
                const marge = item.vk > 0 ? ((item.vk - ek) / item.vk * 100).toFixed(1) : 0;
                return `
                  <tr>
                    <td>${Utils.escHtml(item.name)}</td>
                    <td><span class="badge badge-yellow">${item._type}</span></td>
                    <td class="text-right">${Utils.fmtEuro(item.vk)}</td>
                    <td class="text-right">
                      <input type="number" min="0" step="0.01" class="input input-sm text-right" style="width:90px"
                        value="${ek > 0 ? ek : ''}" placeholder="0,00"
                        oninput="CatalogAdminView.setEk('${item.id}',this.value)" />
                    </td>
                    <td class="text-right text-muted">${ek > 0 ? marge+'%' : '—'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _renderExpected(catalog, expected) {
    const allItems = [];
    ['schnitt','landgard'].forEach(type => {
      catalog[type]?.categories.forEach(cat => {
        cat.items.forEach(item => allItems.push({ ...item, _type: type }));
      });
    });
    return `
      <div class="card">
        <div class="card-header">
          <h3>Erwartete Verkaufsmengen</h3>
          <span style="font-size:0.82rem;color:var(--gray-500)">
            Wird neben den Bestellmengen in den Filialen angezeigt
          </span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>Artikel</th><th>Typ</th><th>VE</th>
              <th class="text-right">Erwartete Menge / Woche</th>
            </tr></thead>
            <tbody>
              ${allItems.map(item => `
                <tr>
                  <td>${Utils.escHtml(item.name)}</td>
                  <td><span class="badge badge-yellow">${item._type}</span></td>
                  <td>${Utils.escHtml(item.ve)}</td>
                  <td class="text-right">
                    <input type="number" min="0" step="1" class="input input-sm text-right" style="width:90px"
                      value="${expected[item.id] > 0 ? expected[item.id] : ''}" placeholder="0"
                      oninput="CatalogAdminView.setExpected('${item.id}',this.value)" />
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  updateItem(type, catIdx, itemIdx, field, value) {
    const catalog = Store.getCatalog();
    const item = catalog[type].categories[catIdx].items[itemIdx];
    if (!item) return;
    item[field] = field === 'vk' ? Utils.parseNum(value) : value;
    Store.saveCatalog(catalog);
  },

  addItem(type, catIdx) {
    const catalog = Store.getCatalog();
    const newId = type.charAt(0).toUpperCase() + Date.now();
    catalog[type].categories[catIdx].items.push({
      id: newId, name: 'Neuer Artikel', ve: 'Stk', vk: 0,
      ...(type === 'landgard' ? { topf: '' } : {})
    });
    Store.saveCatalog(catalog);
    this.render();
  },

  deleteItem(type, catIdx, itemIdx) {
    Utils.confirm('Artikel wirklich löschen?', () => {
      const catalog = Store.getCatalog();
      catalog[type].categories[catIdx].items.splice(itemIdx, 1);
      Store.saveCatalog(catalog);
      this.render();
    });
  },

  addCategory(type) {
    const nameInput = document.getElementById(`new-cat-name-${type}`);
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) { Utils.toast('Bitte Kategorienamen eingeben.', 'warning'); return; }
    const catalog = Store.getCatalog();
    catalog[type].categories.push({ name, items: [] });
    Store.saveCatalog(catalog);
    Utils.toast(`Kategorie "${name}" angelegt.`, 'success');
    this.render();
  },

  setEk(productId, value) {
    Store.setEkPreis(productId, Utils.parseNum(value));
  },

  setExpected(productId, value) {
    Store.setExpectedSale(productId, Utils.parseNum(value));
  }
};

window.CatalogAdminView = CatalogAdminView;
