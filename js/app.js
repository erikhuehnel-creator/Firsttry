// ============================================================================
// PROFIFLORA – Haupt-App-Controller
// Routing, Navigation, Login, Init
// ============================================================================

const App = {

  _currentRoute: null,

  // ── Initialisierung ──────────────────────────────────────────────────────
  init() {
    // Modal schließen
    document.getElementById('modal-close').addEventListener('click', () => Utils.closeModal());
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) Utils.closeModal();
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
      Utils.confirm('Wirklich abmelden?', () => {
        Auth.logout();
        this.showLogin();
      });
    });

    // Mobile Menu
    document.getElementById('menu-toggle').addEventListener('click', () => this.toggleMobileSidebar());
    document.getElementById('sidebar-overlay').addEventListener('click', () => this.closeMobileSidebar());

    // Login Button
    document.getElementById('login-btn').addEventListener('click', () => this.doLogin());
    document.getElementById('login-pass').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.doLogin();
    });

    // Hash-basiertes Routing
    window.addEventListener('hashchange', () => this.route());

    // Aktuellen Zustand prüfen
    if (Auth.isLoggedIn()) {
      this.showApp();
    } else {
      this.showLogin();
    }
  },

  // ── Login ────────────────────────────────────────────────────────────────
  doLogin() {
    const username = document.getElementById('login-user').value;
    const password = document.getElementById('login-pass').value;
    const errorEl  = document.getElementById('login-error');

    if (!username) {
      errorEl.textContent = 'Bitte einen Benutzer auswählen.';
      errorEl.classList.add('show');
      return;
    }

    const result = Auth.login(username, password);
    if (result.success) {
      errorEl.classList.remove('show');
      this.showApp();
    } else {
      errorEl.textContent = result.error;
      errorEl.classList.add('show');
      document.getElementById('login-pass').value = '';
    }
  },

  // ── Screens wechseln ─────────────────────────────────────────────────────
  showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').classList.remove('active');
    document.getElementById('login-pass').value = '';
    document.getElementById('login-error').classList.remove('show');
  },

  showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').classList.add('active');

    const user = Auth.getCurrentUser();
    document.getElementById('sidebar-user').textContent = Auth.getBranchName();

    this.renderNav();

    // Zur ersten Route navigieren
    const defaultRoute = Auth.isAdmin() ? '#dashboard' : '#schnitt';
    if (!location.hash || location.hash === '#') {
      location.hash = defaultRoute;
    } else {
      this.route();
    }
  },

  // ── Navigation rendern ────────────────────────────────────────────────────
  renderNav() {
    const isAdmin = Auth.isAdmin();
    const settings = Store.getSettings();

    const branchItems = `
      <div class="nav-section">
        <div class="nav-section-title">Bestellungen</div>
        <button class="nav-item" data-route="schnitt" onclick="App.navigate('schnitt')">
          <span class="nav-icon">✂️</span> Schnittbestellung
        </button>
        <button class="nav-item" data-route="landgard" onclick="App.navigate('landgard')">
          <span class="nav-icon">🌿</span> Landgard Bestellung
        </button>
        <button class="nav-item" data-route="nonfood" onclick="App.navigate('nonfood')">
          <span class="nav-icon">📦</span> Non-Food Bestellung
        </button>
      </div>
      <div class="nav-section">
        <div class="nav-section-title">Lagerverwaltung</div>
        <button class="nav-item" data-route="inventory" onclick="App.navigate('inventory')">
          <span class="nav-icon">📊</span> Inventur
        </button>
        <button class="nav-item" data-route="writeoffs" onclick="App.navigate('writeoffs')">
          <span class="nav-icon">📉</span> Abschreibungen
        </button>
      </div>
      <div class="nav-section">
        <div class="nav-section-title">Konto</div>
        <button class="nav-item" data-route="settings" onclick="App.navigate('settings')">
          <span class="nav-icon">⚙️</span> Einstellungen
        </button>
      </div>
    `;

    const adminItems = `
      <div class="nav-section">
        <div class="nav-section-title">Admin</div>
        <button class="nav-item" data-route="dashboard" onclick="App.navigate('dashboard')">
          <span class="nav-icon">🏠</span> Dashboard
        </button>
        <button class="nav-item" data-route="catalog" onclick="App.navigate('catalog')">
          <span class="nav-icon">🗂️</span> Sortiment-Verwaltung
        </button>
      </div>
      <div class="nav-section">
        <div class="nav-section-title">Alle Bestellungen</div>
        <button class="nav-item" data-route="schnitt" onclick="App.navigate('schnitt')">
          <span class="nav-icon">✂️</span> Schnittbestellung
        </button>
        <button class="nav-item" data-route="landgard" onclick="App.navigate('landgard')">
          <span class="nav-icon">🌿</span> Landgard Bestellung
        </button>
        <button class="nav-item" data-route="nonfood" onclick="App.navigate('nonfood')">
          <span class="nav-icon">📦</span> Non-Food
        </button>
      </div>
      <div class="nav-section">
        <div class="nav-section-title">Lagerverwaltung</div>
        <button class="nav-item" data-route="inventory" onclick="App.navigate('inventory')">
          <span class="nav-icon">📊</span> Inventur
        </button>
        <button class="nav-item" data-route="writeoffs" onclick="App.navigate('writeoffs')">
          <span class="nav-icon">📉</span> Abschreibungen
        </button>
      </div>
      <div class="nav-section">
        <div class="nav-section-title">System</div>
        <button class="nav-item" data-route="settings" onclick="App.navigate('settings')">
          <span class="nav-icon">⚙️</span> Einstellungen
        </button>
      </div>
    `;

    document.getElementById('sidebar-nav').innerHTML = isAdmin ? adminItems : branchItems;

    // Aktiven Nav-Item markieren
    this._highlightNav(this._currentRoute);
  },

  // ── Routing ───────────────────────────────────────────────────────────────
  navigate(route) {
    location.hash = route;
    this.closeMobileSidebar();
  },

  route() {
    const hash  = location.hash.replace('#', '') || 'schnitt';
    const isAdmin = Auth.isAdmin();

    this._currentRoute = hash;
    this._highlightNav(hash);

    // Admin-Guard: Nur Admin darf Dashboard und Catalog sehen
    if (!isAdmin && (hash === 'dashboard' || hash === 'catalog')) {
      location.hash = 'schnitt';
      return;
    }

    // Views rendern
    switch (hash) {
      case 'dashboard':  DashboardView.render();    break;
      case 'schnitt':    SchnittView.render();       break;
      case 'landgard':   LandgardView.render();      break;
      case 'nonfood':    NonFoodView.render();        break;
      case 'inventory':  InventoryView.render();     break;
      case 'writeoffs':  WriteoffsView.render();     break;
      case 'catalog':    CatalogAdminView.render();  break;
      case 'settings':   SettingsView.render();      break;
      default:
        location.hash = isAdmin ? 'dashboard' : 'schnitt';
    }
  },

  _highlightNav(route) {
    document.querySelectorAll('.nav-item[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });
  },

  // ── Mobile Sidebar ────────────────────────────────────────────────────────
  toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('show');
  },

  closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('mobile-open');
    document.getElementById('sidebar-overlay').classList.remove('show');
  }
};

// ── Starten ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
