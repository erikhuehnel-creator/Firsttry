// ============================================================================
// PROFIFLORA – Ansicht: Einstellungen
// ============================================================================

const SettingsView = {

  render() {
    document.getElementById('topbar-title').textContent = 'Einstellungen';
    const isAdmin = Auth.isAdmin();
    const settings = Store.getSettings();
    const user = Auth.getCurrentUser();

    const html = `
      <div class="card">
        <div class="card-header"><h3>Konto</h3></div>
        <div class="card-body">
          <div class="settings-section">
            <div class="settings-row">
              <div class="settings-label">
                Angemeldet als
                <small>${user.role === 'admin' ? 'Administrator' : 'Filiale'}</small>
              </div>
              <div class="settings-value">
                <strong>${Utils.escHtml(user.name)}</strong>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>Passwort ändern</h3>
            <div class="settings-row">
              <div class="settings-label">Altes Passwort</div>
              <div class="settings-value">
                <input type="password" class="input" id="pw-old" placeholder="Aktuelles Passwort" />
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-label">Neues Passwort</div>
              <div class="settings-value">
                <input type="password" class="input" id="pw-new" placeholder="Neues Passwort" />
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-label">Neues Passwort bestätigen</div>
              <div class="settings-value">
                <input type="password" class="input" id="pw-confirm" placeholder="Wiederholen" />
              </div>
            </div>
            <div style="margin-top:16px">
              <button class="btn btn-secondary" onclick="SettingsView.changePassword()">Passwort ändern</button>
            </div>
          </div>
        </div>
      </div>

      ${isAdmin ? this._renderAdminSettings(settings) : ''}

      <div class="card">
        <div class="card-header"><h3>Über die App</h3></div>
        <div class="card-body">
          <div class="settings-row">
            <div class="settings-label">Version</div>
            <div><span class="badge badge-yellow">1.0.0</span></div>
          </div>
          <div class="settings-row">
            <div class="settings-label">Entwickelt für</div>
            <div><strong>Profiflora</strong></div>
          </div>
          <div class="settings-row">
            <div class="settings-label">Datenspeicherung</div>
            <div style="font-size:0.88rem;color:var(--gray-500)">Lokal im Browser (localStorage)</div>
          </div>
          ${isAdmin ? `
            <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" onclick="SettingsView.exportData()">
                ↓ Daten exportieren
              </button>
              <button class="btn btn-secondary btn-sm" onclick="SettingsView.importData()">
                ↑ Daten importieren
              </button>
            </div>
            <input type="file" id="import-file" accept=".json" style="display:none"
              onchange="SettingsView.handleImport(this)" />
          ` : ''}
        </div>
      </div>
    `;

    document.getElementById('page-content').innerHTML = html;
  },

  _renderAdminSettings(settings) {
    const users = Store.getUsers();

    const branchRows = Array.from({length: 10}, (_, i) => i + 1).map(i => `
      <div class="settings-row">
        <div class="settings-label">
          Filiale ${i}
          <small>Benutzer: filiale${i}</small>
        </div>
        <div class="settings-value" style="display:flex;gap:8px">
          <input type="text" class="input input-sm" style="flex:1"
            value="${Utils.escHtml(settings.branchNames[i] || `Filiale ${i}`)}"
            onchange="SettingsView.updateBranchName(${i}, this.value)"
            placeholder="Filialname" />
          <button class="btn btn-secondary btn-sm"
            onclick="SettingsView.resetBranchPassword(${i})">PW reset</button>
        </div>
      </div>
    `).join('');

    return `
      <div class="card">
        <div class="card-header"><h3>Filialen verwalten</h3></div>
        <div class="card-body">
          <div class="settings-section">
            ${branchRows}
            <div style="margin-top:16px">
              <button class="btn btn-secondary" onclick="SettingsView.saveBranchNames()">
                Filialnamen speichern
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Katalog zurücksetzen</h3></div>
        <div class="card-body">
          <p style="font-size:0.88rem;color:var(--gray-600);margin-bottom:16px">
            Setzt den Produktkatalog auf die Standard-Sortimente zurück.
            Eigene Änderungen gehen verloren.
          </p>
          <button class="btn btn-danger btn-sm" onclick="SettingsView.resetCatalog()">
            Katalog zurücksetzen
          </button>
        </div>
      </div>
    `;
  },

  changePassword() {
    const old     = document.getElementById('pw-old').value;
    const newPw   = document.getElementById('pw-new').value;
    const confirm = document.getElementById('pw-confirm').value;

    if (!old || !newPw) { Utils.toast('Bitte alle Felder ausfüllen.', 'warning'); return; }
    if (newPw !== confirm) { Utils.toast('Passwörter stimmen nicht überein.', 'error'); return; }
    if (newPw.length < 4) { Utils.toast('Passwort muss mindestens 4 Zeichen haben.', 'warning'); return; }

    const user = Auth.getCurrentUser();
    const result = Auth.changePassword(user.username, old, newPw);
    if (result.success) {
      Utils.toast('Passwort erfolgreich geändert!', 'success');
      document.getElementById('pw-old').value = '';
      document.getElementById('pw-new').value = '';
      document.getElementById('pw-confirm').value = '';
    } else {
      Utils.toast(result.error, 'error');
    }
  },

  _pendingBranchNames: {},

  updateBranchName(branchId, value) {
    this._pendingBranchNames[branchId] = value;
  },

  saveBranchNames() {
    const settings = Store.getSettings();
    Object.entries(this._pendingBranchNames).forEach(([id, name]) => {
      settings.branchNames[id] = name;
    });
    Store.saveSettings(settings);
    this._pendingBranchNames = {};
    Utils.toast('Filialnamen gespeichert!', 'success');
    // Sidebar aktualisieren
    if (typeof App !== 'undefined') App.renderNav();
  },

  resetBranchPassword(branchId) {
    const defaultPw = `filiale${branchId}`;
    Utils.confirm(
      `Passwort von Filiale ${branchId} auf "${defaultPw}" zurücksetzen?`,
      () => {
        Auth.resetPassword(`filiale${branchId}`, defaultPw);
        Utils.toast(`Passwort zurückgesetzt auf: ${defaultPw}`, 'success');
      }
    );
  },

  resetCatalog() {
    Utils.confirm(
      'Katalog wirklich zurücksetzen? Alle eigenen Änderungen gehen verloren.',
      () => {
        Store.resetCatalog();
        Utils.toast('Katalog wurde zurückgesetzt.', 'success');
      }
    );
  },

  exportData() {
    const data = Store.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profiflora-backup-${Utils.todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Utils.toast('Daten exportiert!', 'success');
  },

  importData() {
    document.getElementById('import-file').click();
  },

  handleImport(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      Utils.confirm(
        'Alle vorhandenen Daten werden überschrieben. Wirklich importieren?',
        () => {
          try {
            Store.importAllData(e.target.result);
            Utils.toast('Daten importiert! Seite wird neu geladen...', 'success');
            setTimeout(() => location.reload(), 1500);
          } catch {
            Utils.toast('Fehler beim Importieren. Ungültige Datei?', 'error');
          }
        }
      );
    };
    reader.readAsText(file);
  }
};

window.SettingsView = SettingsView;
