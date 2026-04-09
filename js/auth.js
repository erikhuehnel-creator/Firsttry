// ============================================================================
// PROFIFLORA – Authentication
// Login / Logout / Session management
// ============================================================================

const Auth = {

  SESSION_KEY: 'profiflora_session',

  getCurrentUser() {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  login(username, password) {
    const users = Store.getUsers();
    const user = users[username];
    if (!user) return { success: false, error: 'Benutzer nicht gefunden.' };
    if (user.password !== password) return { success: false, error: 'Falsches Passwort.' };

    const session = {
      username,
      role: user.role,
      name: user.name,
      branch: user.branch,
      loginAt: new Date().toISOString()
    };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return { success: true, user: session };
  },

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
  },

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  },

  isBranch() {
    const user = this.getCurrentUser();
    return user && user.role === 'branch';
  },

  getBranchId() {
    const user = this.getCurrentUser();
    return user ? user.branch : null;
  },

  getBranchName() {
    const user = this.getCurrentUser();
    if (!user) return '';
    const settings = Store.getSettings();
    if (user.role === 'admin') return 'Admin Dashboard';
    return settings.branchNames[user.branch] || user.name;
  },

  changePassword(username, oldPassword, newPassword) {
    const users = Store.getUsers();
    if (!users[username]) return { success: false, error: 'Benutzer nicht gefunden.' };
    if (users[username].password !== oldPassword) return { success: false, error: 'Altes Passwort falsch.' };
    users[username].password = newPassword;
    Store.saveUsers(users);
    return { success: true };
  },

  // Admin can reset a branch password
  resetPassword(username, newPassword) {
    const users = Store.getUsers();
    if (!users[username]) return { success: false, error: 'Benutzer nicht gefunden.' };
    users[username].password = newPassword;
    Store.saveUsers(users);
    return { success: true };
  }
};

if (typeof window !== 'undefined') {
  window.Auth = Auth;
}
