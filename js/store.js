// ============================================================================
// PROFIFLORA – Data Store (localStorage)
// Verwaltet alle Daten: Katalog, Bestellungen, Inventur, Abschreibungen
// ============================================================================

const Store = {

  PREFIX: 'profiflora_',

  // ── Generic helpers ──────────────────────────────────────────────────────
  _get(key) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  _set(key, value) {
    localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
  },

  _remove(key) {
    localStorage.removeItem(this.PREFIX + key);
  },

  // ── Catalog (shared across all users, editable by admin) ────────────────
  getCatalog() {
    let catalog = this._get('catalog');
    if (!catalog) {
      catalog = JSON.parse(JSON.stringify(DEFAULT_CATALOG));
      this._set('catalog', catalog);
    }
    return catalog;
  },

  saveCatalog(catalog) {
    this._set('catalog', catalog);
  },

  resetCatalog() {
    const catalog = JSON.parse(JSON.stringify(DEFAULT_CATALOG));
    this._set('catalog', catalog);
    return catalog;
  },

  // ── Users ───────────────────────────────────────────────────────────────
  getUsers() {
    let users = this._get('users');
    if (!users) {
      users = this._initUsers();
    }
    return users;
  },

  // Feste Filial-Konfiguration (Kürzel + Passwort)
  BRANCH_CONFIG: [
    { id: 1,  kuerzel: 'MAL',  name: 'MAL'  },
    { id: 2,  kuerzel: 'GÜM',  name: 'GÜM'  },
    { id: 3,  kuerzel: 'BÜZ',  name: 'BÜZ'  },
    { id: 4,  kuerzel: 'STA1', name: 'STA1' },
    { id: 5,  kuerzel: 'HGW1', name: 'HGW1' },
    { id: 6,  kuerzel: 'STA3', name: 'STA3' },
    { id: 7,  kuerzel: 'GRI',  name: 'GRI'  },
    { id: 8,  kuerzel: 'HRO',  name: 'HRO'  },
    { id: 9,  kuerzel: 'WIS',  name: 'WIS'  },
    { id: 10, kuerzel: 'HGW2', name: 'HGW2' },
  ],

  _initUsers() {
    return this._buildUsers();
  },

  // Immer aktuelle Nutzerdaten erzwingen (bei App-Update)
  forceUpdateUsers() {
    const updated = this._buildUsers();
    this._set('users', updated);
    return updated;
  },

  _buildUsers() {
    const users = {
      admin: {
        password: 'admin2026',
        role: 'admin',
        name: 'Profiflora Admin',
        branch: null
      }
    };
    this.BRANCH_CONFIG.forEach(b => {
      users[`filiale${b.id}`] = {
        password: `${b.kuerzel}#`,
        role: 'branch',
        name: b.name,
        branch: b.id
      };
    });
    this._set('users', users);
    return users;
  },

  saveUsers(users) {
    this._set('users', users);
  },

  // ── Orders (per branch, per type) ──────────────────────────────────────
  // type: 'schnitt' | 'landgard' | 'nonfood'
  getOrders(branchId, type) {
    return this._get(`orders_${branchId}_${type}`) || [];
  },

  saveOrders(branchId, type, orders) {
    this._set(`orders_${branchId}_${type}`, orders);
  },

  // Get all orders for a type across all branches (for dashboard)
  getAllOrders(type) {
    const allOrders = {};
    for (let i = 1; i <= 10; i++) {
      const orders = this.getOrders(i, type);
      if (orders.length > 0) {
        allOrders[i] = orders;
      }
    }
    return allOrders;
  },

  // ── Order Entry Structure ──────────────────────────────────────────────
  // For schnitt/landgard orders:
  // {
  //   id: unique,
  //   date: '2026-04-09',
  //   productId: 'S001',
  //   menge: 10,
  //   expectedMenge: 8,   // expected sales (admin-set or prediction)
  //   submitted: false,
  //   submittedAt: null
  // }
  //
  // For nonfood orders:
  // {
  //   id: unique,
  //   date: '2026-04-09',
  //   artikel: 'Vase weiß',
  //   menge: 5,
  //   ve: 'Stk',
  //   farbe: 'weiß',
  //   beschreibung: '',
  //   submitted: false,
  //   submittedAt: null
  // }

  createOrder(branchId, type, orderData) {
    const orders = this.getOrders(branchId, type);
    const order = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      createdAt: new Date().toISOString(),
      submitted: false,
      submittedAt: null,
      ...orderData
    };
    orders.push(order);
    this.saveOrders(branchId, type, orders);
    return order;
  },

  submitOrder(branchId, type, orderId) {
    const orders = this.getOrders(branchId, type);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.submitted = true;
      order.submittedAt = new Date().toISOString();
      this.saveOrders(branchId, type, orders);
    }
    return order;
  },

  deleteOrder(branchId, type, orderId) {
    let orders = this.getOrders(branchId, type);
    orders = orders.filter(o => o.id !== orderId);
    this.saveOrders(branchId, type, orders);
  },

  // ── Batch Orders (for schnitt/landgard – save a whole date's order) ────
  saveBatchOrder(branchId, type, date, items) {
    // items = [{ productId, menge }]
    let orders = this.getOrders(branchId, type);
    // Remove existing entries for this date
    orders = orders.filter(o => o.date !== date);
    // Add new entries
    items.forEach(item => {
      if (item.menge > 0) {
        orders.push({
          id: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          date,
          productId: item.productId,
          menge: item.menge,
          createdAt: new Date().toISOString(),
          submitted: false,
          submittedAt: null
        });
      }
    });
    this.saveOrders(branchId, type, orders);
    return orders;
  },

  submitBatchOrder(branchId, type, date) {
    const orders = this.getOrders(branchId, type);
    const now = new Date().toISOString();
    orders.forEach(o => {
      if (o.date === date && !o.submitted) {
        o.submitted = true;
        o.submittedAt = now;
      }
    });
    this.saveOrders(branchId, type, orders);
  },

  // ── Write-offs (Abschreibungen) ────────────────────────────────────────
  // {
  //   id, date, sorte, stueckzahl, vkPreis, type: 'schnitt'|'pflanzen'|'sonstiges'
  // }
  getWriteoffs(branchId) {
    return this._get(`writeoffs_${branchId}`) || [];
  },

  saveWriteoffs(branchId, writeoffs) {
    this._set(`writeoffs_${branchId}`, writeoffs);
  },

  addWriteoff(branchId, data) {
    const writeoffs = this.getWriteoffs(branchId);
    const entry = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      createdAt: new Date().toISOString(),
      ...data
    };
    writeoffs.push(entry);
    this.saveWriteoffs(branchId, writeoffs);
    return entry;
  },

  deleteWriteoff(branchId, entryId) {
    let writeoffs = this.getWriteoffs(branchId);
    writeoffs = writeoffs.filter(w => w.id !== entryId);
    this.saveWriteoffs(branchId, writeoffs);
  },

  getAllWriteoffs() {
    const all = {};
    for (let i = 1; i <= 10; i++) {
      const w = this.getWriteoffs(i);
      if (w.length > 0) all[i] = w;
    }
    return all;
  },

  // ── Inventory (Inventur) ───────────────────────────────────────────────
  // {
  //   id, date, sorte, stueckzahl, vkPreis
  // }
  getInventory(branchId) {
    return this._get(`inventory_${branchId}`) || [];
  },

  saveInventory(branchId, inventory) {
    this._set(`inventory_${branchId}`, inventory);
  },

  addInventoryItem(branchId, data) {
    const inventory = this.getInventory(branchId);
    const entry = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      createdAt: new Date().toISOString(),
      ...data
    };
    inventory.push(entry);
    this.saveInventory(branchId, inventory);
    return entry;
  },

  deleteInventoryItem(branchId, entryId) {
    let inventory = this.getInventory(branchId);
    inventory = inventory.filter(inv => inv.id !== entryId);
    this.saveInventory(branchId, inventory);
  },

  getAllInventory() {
    const all = {};
    for (let i = 1; i <= 10; i++) {
      const inv = this.getInventory(i);
      if (inv.length > 0) all[i] = inv;
    }
    return all;
  },

  // ── EK-Preise (nur Dashboard sichtbar) ─────────────────────────────────
  getEkPreise() {
    return this._get('ek_preise') || {};
  },

  setEkPreis(productId, preis) {
    const ek = this.getEkPreise();
    ek[productId] = preis;
    this._set('ek_preise', ek);
  },

  saveEkPreise(ekPreise) {
    this._set('ek_preise', ekPreise);
  },

  // ── Expected Sales (Erwartete Verkaufsmengen) ──────────────────────────
  getExpectedSales() {
    return this._get('expected_sales') || {};
  },

  setExpectedSale(productId, menge) {
    const exp = this.getExpectedSales();
    exp[productId] = menge;
    this._set('expected_sales', exp);
  },

  saveExpectedSales(expected) {
    this._set('expected_sales', expected);
  },

  // ── Settings ───────────────────────────────────────────────────────────
  getSettings() {
    return this._get('settings') || {
      companyName: 'Profiflora',
      branchNames: {
        1: 'MAL', 2: 'GÜM', 3: 'BÜZ',
        4: 'STA1', 5: 'HGW1', 6: 'STA3',
        7: 'GRI', 8: 'HRO', 9: 'WIS', 10: 'HGW2'
      },
      currency: '€',
      dateFormat: 'de-DE'
    };
  },

  saveSettings(settings) {
    this._set('settings', settings);
  },

  // ── Full data export / import ──────────────────────────────────────────
  exportAllData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.PREFIX)) {
        data[key] = localStorage.getItem(key);
      }
    }
    return JSON.stringify(data, null, 2);
  },

  importAllData(jsonString) {
    const data = JSON.parse(jsonString);
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.setItem(key, value);
      }
    });
  },

  clearAllData() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};

if (typeof window !== 'undefined') {
  window.Store = Store;
}
