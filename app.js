// ════════════════════════════════════════════════════════════════
// FATE OF CHRONICLES - LOGIN & GAME SYSTEM
// ════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// STATE MANAGEMENT
// ─────────────────────────────────────────────────────────────────

const AppState = {
  users: JSON.parse(localStorage.getItem('foc_users')) || {},
  currentUser: JSON.parse(localStorage.getItem('foc_currentUser')) || null,

  registerUser(username, email, password) {
    if (this.users[username]) return { success: false, message: 'Usuário já existe!' };
    
    this.users[username] = {
      email,
      password: btoa(password), // basic encoding
      foc: 300,
      blons: 100,
      pity: { guaranteed: false, count: 0 },
      tower: { currentFloor: 0, maxFloor: 1 },
      characters: [],
      currentTeam: [null, null, null, null],
      lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('foc_users', JSON.stringify(this.users));
    return { success: true, message: 'Conta criada com sucesso!' };
  },

  loginUser(username, password) {
    const user = this.users[username];
    if (!user) return { success: false, message: 'Usuário não encontrado!' };
    if (user.password !== btoa(password)) return { success: false, message: 'Senha incorreta!' };
    
    this.currentUser = { username, ...user };
    localStorage.setItem('foc_currentUser', JSON.stringify(this.currentUser));
    return { success: true, message: 'Login realizado!' };
  },

  logoutUser() {
    this.currentUser = null;
    localStorage.removeItem('foc_currentUser');
  },

  saveUserData() {
    if (this.currentUser) {
      this.users[this.currentUser.username] = { ...this.currentUser };
      delete this.users[this.currentUser.username].username;
      localStorage.setItem('foc_users', JSON.stringify(this.users));
      localStorage.setItem('foc_currentUser', JSON.stringify(this.currentUser));
    }
  }
};

// ─────────────────────────────────────────────────────────────────
// UI CONTROLLER
// ─────────────────────────────────────────────────────────────────

const UI = {
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('act'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('act');
  },

  showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
    document.querySelectorAll('.nt').forEach(t => t.classList.remove('on'));
    
    const tab = document.querySelector(`[data-tab="${tabName}"]`);
    const navTab = document.querySelector(`.nt[data-tab="${tabName}"]`);
    
    if (tab) tab.classList.add('on');
    if (navTab) navTab.classList.add('on');
  },

  updateResources() {
    const user = AppState.currentUser;
    if (!user) return;
    
    const focDisp = document.querySelector('.foc-disp');
    const blonsDisp = document.querySelector('.blons-disp');
    
    if (focDisp) focDisp.textContent = `💎 ${user.foc}`;
    if (blonsDisp) blonsDisp.textContent = `✧ ${user.blons}`;
  },

  updateUserName() {
    const usrName = document.querySelector('.usr-name');
    if (usrName && AppState.currentUser) {
      usrName.textContent = AppState.currentUser.username;
    }
  },

  showToast(message, type = 'ok') {
    const toast = document.getElementById('toast');
    const item = document.createElement('div');
    item.className = `toast-item msg ${type}`;
    item.textContent = message;
    toast.appendChild(item);
    
    setTimeout(() => item.remove(), 3000);
  },

  showMessage(elementId, message, isError = false) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    const existing = container.querySelector('.msg');
    if (existing) existing.remove();
    
    const msg = document.createElement('div');
    msg.className = `msg ${isError ? 'err' : 'ok'}`;
    msg.textContent = message;
    container.appendChild(msg);
  }
};

// ─────────────────────────────────────────────────────────────────
// LOGIN HANDLERS
// ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      tabBtns.forEach(b => b.classList.remove('on'));
      this.classList.add('on');
      
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      
      if (this.dataset.tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
      } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
      }
    });
  });

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = document.getElementById('login-user').value.trim();
      const password = document.getElementById('login-pass').value;
      
      if (!username || !password) {
        UI.showMessage('login-msg', 'Preencha todos os campos!', true);
        return;
      }
      
      const result = AppState.loginUser(username, password);
      
      if (result.success) {
        UI.showMessage('login-msg', result.message, false);
        setTimeout(() => {
          UI.showScreen('S_app');
          UI.showTab('banner');
          UI.updateResources();
          UI.updateUserName();
          loginForm.reset();
        }, 500);
      } else {
        UI.showMessage('login-msg', result.message, true);
      }
    });
  }

  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = document.getElementById('reg-user').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-pass').value;
      const confirmPass = document.getElementById('reg-confirm').value;
      
      if (!username || !email || !password || !confirmPass) {
        UI.showMessage('register-msg', 'Preencha todos os campos!', true);
        return;
      }
      
      if (!email.includes('@')) {
        UI.showMessage('register-msg', 'Email inválido!', true);
        return;
      }
      
      if (password.length < 6) {
        UI.showMessage('register-msg', 'Senha deve ter 6+ caracteres!', true);
        return;
      }
      
      if (password !== confirmPass) {
        UI.showMessage('register-msg', 'Senhas não conferem!', true);
        return;
      }
      
      const result = AppState.registerUser(username, email, password);
      
      if (result.success) {
        UI.showMessage('register-msg', result.message, false);
        setTimeout(() => {
          document.querySelector('.tab-btn[data-tab="login"]').click();
          registerForm.reset();
        }, 500);
      } else {
        UI.showMessage('register-msg', result.message, true);
      }
    });
  }

  // Logout button
  const logoutBtn = document.querySelector('.logout-x');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Deseja fazer logout?')) {
        AppState.logoutUser();
        UI.showScreen('S_login');
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
      }
    });
  }

  // Navigation tabs
  const navTabs = document.querySelectorAll('.nt');
  navTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.dataset.tab;
      UI.showTab(tabName);
    });
  });

  // Check if user is logged in
  if (AppState.currentUser) {
    UI.showScreen('S_app');
    UI.showTab('banner');
    UI.updateResources();
    UI.updateUserName();
  } else {
    UI.showScreen('S_login');
  }
});

// ─────────────────────────────────────────────────────────────────
// PARTICLE SYSTEM
// ─────────────────────────────────────────────────────────────────

function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  
  for (let i = 0; i < 20; i++) {
    const pt = document.createElement('div');
    pt.className = 'pt';
    
    const size = Math.random() * 3 + 1;
    const left = Math.random() * 100;
    const duration = Math.random() * 20 + 15;
    const delay = Math.random() * 5;
    
    pt.style.width = size + 'px';
    pt.style.height = size + 'px';
    pt.style.left = left + '%';
    pt.style.bottom = '-30px';
    pt.style.backgroundColor = Math.random() > 0.5 ? 'rgba(212,168,67,0.3)' : 'rgba(26,92,184,0.2)';
    pt.style.animationDuration = duration + 's';
    pt.style.animationDelay = delay + 's';
    
    container.appendChild(pt);
  }
}

// Init particles on page load
document.addEventListener('DOMContentLoaded', createParticles;);