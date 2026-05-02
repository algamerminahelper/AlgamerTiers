// ===== CONSTANTS =====
const ADMIN_EMAIL = 'admin@5dma-tier.com';
const ADMIN_PASS  = '5DMA@PvP2026!xStrong';

// ===== JSONBIN CONFIG =====
const JSONBIN_KEY = '$2a$10$s6YBegtQ1oXPA2MSI3at1uMXe8NUhLhtaGEjVlWpE6e3Fp8oBzUji';
const JSONBIN_URL = 'https://api.jsonbin.io/v3/b';
const BIN_ID      = '69f3dc20aaba882197593ea0'; // ✅ Fixed BIN ID - shared across all devices

// ===== GAMEMODES =====
const GAMEMODES = [
  { id: 'vanilla', name: 'Vanilla', icon: 'images/vanilla.png', color: '#00d4ff' },
  { id: 'uhc',     name: 'UHC',     icon: 'images/uhc.png',     color: '#ff3355' },
  { id: 'pot',     name: 'Pot',     icon: 'images/pot.png',     color: '#a855f7' },
  { id: 'nethop',  name: 'NethOP',  icon: 'images/nethop.png',  color: '#ff6b00' },
  { id: 'smp',     name: 'SMP',     icon: 'images/smp.png',     color: '#00ff88' },
  { id: 'sword',   name: 'Sword',   icon: 'images/sword.png',   color: '#ffd700' },
  { id: 'axe',     name: 'Axe',     icon: 'images/axe.png',     color: '#ff9933' },
  { id: 'mace',    name: 'Mace',    icon: 'images/mace.png',    color: '#c084fc' },
];

const TIER_ORDER = ['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'];

const TIER_META = {
  HT1: { label:'High Tier 1', color:'#ff0055' },
  LT1: { label:'Low Tier 1',  color:'#ff4488' },
  HT2: { label:'High Tier 2', color:'#ff6b00' },
  LT2: { label:'Low Tier 2',  color:'#ff9933' },
  HT3: { label:'High Tier 3', color:'#ffd700' },
  LT3: { label:'Low Tier 3',  color:'#ffe066' },
  HT4: { label:'High Tier 4', color:'#00d4ff' },
  LT4: { label:'Low Tier 4',  color:'#66e5ff' },
  HT5: { label:'High Tier 5', color:'#a855f7' },
  LT5: { label:'Low Tier 5',  color:'#c084fc' },
};

// ===== STATE =====
let currentGamemode = null;
let currentPage     = 'home';
let cachedPlayers   = [];

// ===== LOADING BAR =====
function showLoading() {
  let el = document.getElementById('loadingBar');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loadingBar';
    el.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:9999',
      'background:linear-gradient(90deg,#00d4ff,#a855f7,#ff3355)',
      'background-size:200% 100%',
      'height:3px',
      'animation:lbar 1.2s linear infinite',
    ].join(';');
    const s = document.createElement('style');
    s.textContent = '@keyframes lbar{0%{background-position:0% 0}100%{background-position:200% 0}}';
    document.head.appendChild(s);
    document.body.appendChild(el);
  }
  el.style.display = 'block';
}
function hideLoading() {
  const el = document.getElementById('loadingBar');
  if (el) el.style.display = 'none';
}

// ===== JSONBIN API =====
async function initBin() {
  // BIN_ID is now hardcoded — shared across all devices
  console.log('Using shared BIN_ID:', BIN_ID);
}

async function fetchPlayers() {
  if (!BIN_ID) {
    cachedPlayers = JSON.parse(localStorage.getItem('5dma_players') || '[]');
    return cachedPlayers;
  }
  showLoading();
  try {
    const res  = await fetch(`${JSONBIN_URL}/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY },
    });
    const data = await res.json();
    const players = Array.isArray(data.record?.players) ? data.record.players : [];
    cachedPlayers = players;
    localStorage.setItem('5dma_players', JSON.stringify(players));
    return players;
  } catch (e) {
    console.error('fetchPlayers failed:', e);
    showToast('Cloud unreachable. Showing cached data.', 'error');
    cachedPlayers = JSON.parse(localStorage.getItem('5dma_players') || '[]');
    return cachedPlayers;
  } finally {
    hideLoading();
  }
}

async function pushPlayers(players) {
  cachedPlayers = players;
  localStorage.setItem('5dma_players', JSON.stringify(players));
  if (!BIN_ID) return;
  showLoading();
  try {
    await fetch(`${JSONBIN_URL}/${BIN_ID}`, {
      method:  'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY,
      },
      body: JSON.stringify({ players }),
    });
  } catch (e) {
    console.error('pushPlayers failed:', e);
    showToast('Sync failed. Changes saved locally only.', 'error');
  } finally {
    hideLoading();
  }
}

async function getPlayers()   { return await fetchPlayers(); }
async function savePlayers(p) { await pushPlayers(p); }

// ===== LOCAL ONLY =====
function getUsers()     { return JSON.parse(localStorage.getItem('5dma_users')   || '[]'); }
function saveUsers(u)   { localStorage.setItem('5dma_users', JSON.stringify(u)); }
function getSession()   { return JSON.parse(localStorage.getItem('5dma_session') || 'null'); }
function saveSession(s) { localStorage.setItem('5dma_session', JSON.stringify(s)); }
function clearSession() { localStorage.removeItem('5dma_session'); }
function isAdmin()      { const s = getSession(); return s && s.isAdmin === true; }

// ===== AUTH =====
function openAuth() {
  document.getElementById('authOverlay').classList.remove('hidden');
  switchTab('login');
}
function closeAuth() {
  document.getElementById('authOverlay').classList.add('hidden');
  clearAuthErrors();
}
function switchTab(tab) {
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  document.querySelectorAll('.auth-tab').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  clearAuthErrors();
}
function clearAuthErrors() {
  ['loginError','registerError'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.add('hidden'); el.textContent = '';
  });
}
function showAuthError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.classList.remove('hidden');
}

function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return showAuthError('loginError', 'Please fill in all fields.');
  if (email === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASS) {
    saveSession({ email: ADMIN_EMAIL, username: 'Admin', isAdmin: true, isLoggedIn: true });
    closeAuth(); updateNavUI();
    showToast('Welcome back, Admin! 🛡️', 'success');
    return;
  }
  const users = getUsers();
  const user  = users.find(u => u.email.toLowerCase() === email && u.password === password);
  if (!user) return showAuthError('loginError', 'Invalid email or password.');
  saveSession({ email: user.email, username: user.username, isAdmin: false, isLoggedIn: true });
  closeAuth(); updateNavUI();
  showToast(`Welcome back, ${user.username}! ⚔️`, 'success');
}

function handleRegister() {
  const username = document.getElementById('regUsername').value.trim();
  const email    = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;
  if (!username || !email || !password) return showAuthError('registerError', 'Please fill in all fields.');
  if (email === ADMIN_EMAIL.toLowerCase())    return showAuthError('registerError', 'This email cannot be used.');
  if (password.length < 8)                   return showAuthError('registerError', 'Password must be at least 8 characters.');
  if (!/[A-Z]/.test(password))              return showAuthError('registerError', 'Password must contain an uppercase letter.');
  if (!/[0-9]/.test(password))              return showAuthError('registerError', 'Password must contain a number.');
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email)) return showAuthError('registerError', 'Email already registered.');
  users.push({ username, email, password });
  saveUsers(users);
  showToast('Account created! You can now log in.', 'success');
  switchTab('login');
  document.getElementById('loginEmail').value = email;
}

function handleLogout() {
  clearSession(); updateNavUI();
  showToast('Logged out successfully.', 'info');
  if (currentPage === 'admin') showPage('home');
}

// ===== NAV UI =====
function updateNavUI() {
  const session = getSession();
  document.getElementById('guestButtons').classList.toggle('hidden', !!session);
  document.getElementById('userButtons').classList.toggle('hidden', !session);
  document.getElementById('adminNavBtn').classList.toggle('hidden', !isAdmin());
  if (session) document.getElementById('navUsername').textContent = session.username;
  const addBtn = document.getElementById('addPlayerBtn');
  if (addBtn) addBtn.classList.toggle('hidden', !isAdmin());
}

// ===== PAGE NAVIGATION =====
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const pageMap = { home: 'homePage', gamemode: 'gamemodePage', overall: 'overallPage', admin: 'adminPage' };
  const el = document.getElementById(pageMap[page]);
  if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
  currentPage = page;
  if (page === 'overall') renderOverall();
  if (page === 'admin') {
    if (!isAdmin()) { showToast('Access denied. Admins only.', 'error'); showPage('home'); return; }
    renderAdminSelects(); renderAdminList();
  }
  if (page === 'home') renderGamemodeCards();
  const navMap = { home: 0, overall: 1 };
  if (navMap[page] !== undefined) {
    const links = document.querySelectorAll('.nav-link');
    if (links[navMap[page]]) links[navMap[page]].classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function openGamemode(gmId) {
  currentGamemode = gmId;
  const gm = GAMEMODES.find(g => g.id === gmId);
  document.getElementById('gamemodeTitle').innerHTML = gm
    ? `<img src="${gm.icon}" alt="${gm.name}" style="width:28px;height:28px;object-fit:contain;vertical-align:middle;margin-right:8px;filter:drop-shadow(0 0 6px ${gm.color})">${gm.name}`
    : gmId;
  document.getElementById('playerSearch').value = '';
  document.getElementById('addPlayerBtn').classList.toggle('hidden', !isAdmin());
  showPage('gamemode');
  await renderTiers(gmId);
}

// ===== GAMEMODE CARDS =====
async function renderGamemodeCards() {
  const players = await getPlayers();
  const grid = document.getElementById('gamemodesGrid');
  grid.innerHTML = '';
  GAMEMODES.forEach(gm => {
    const count = players.filter(p => p.gamemode === gm.id).length;
    const card  = document.createElement('div');
    card.className = 'gm-card';
    card.style.setProperty('--gm-color', gm.color);
    card.innerHTML = `
      <img class="gm-icon" src="${gm.icon}" alt="${gm.name}"/>
      <div class="gm-name" style="color:${gm.color}">${gm.name}</div>
      <div class="gm-count">${count} player${count !== 1 ? 's' : ''}</div>
    `;
    card.onclick = () => openGamemode(gm.id);
    grid.appendChild(card);
  });
  document.getElementById('statPlayers').textContent = players.length;
}

// ===== TIERS RENDER =====
async function renderTiers(gmId, filterText = '') {
  const players   = await getPlayers();
  const gmPlayers = players.filter(p => p.gamemode === gmId);
  const container = document.getElementById('tiersContainer');
  container.innerHTML = '';

  TIER_ORDER.forEach(tier => {
    const meta     = TIER_META[tier];
    let   tPlayers = gmPlayers.filter(p => p.tier === tier);
    if (filterText) tPlayers = tPlayers.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()));

    const section    = document.createElement('div');
    section.className = 'tier-section';

    const header = document.createElement('div');
    header.className = 'tier-header';
    header.style.setProperty('--tier-color', meta.color);
    header.innerHTML = `
      <span class="tier-badge" style="color:${meta.color}">${tier}</span>
      <span class="tier-label">${meta.label}</span>
      <span class="tier-count">${tPlayers.length}</span>
    `;
    section.appendChild(header);

    const playersDiv = document.createElement('div');
    playersDiv.className = 'tier-players';
    playersDiv.style.setProperty('--tier-color', meta.color);

    if (tPlayers.length === 0) {
      playersDiv.innerHTML = `<div class="empty-tier"><i class="fa fa-ghost"></i>&nbsp; No players yet</div>`;
    } else {
      tPlayers.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.style.setProperty('--tier-color', meta.color);
        card.innerHTML = `
          <div class="player-avatar" style="background:linear-gradient(135deg,${meta.color},rgba(0,0,0,0.5))">${player.name.substring(0,2).toUpperCase()}</div>
          <span class="player-name">${player.name}</span>
          ${isAdmin() ? `
            <div class="player-actions">
              <button class="player-edit-btn" onclick="openEditPlayer('${player.id}')"><i class="fa fa-pen"></i></button>
              <button class="player-del-btn" onclick="deletePlayer('${player.id}')"><i class="fa fa-trash"></i></button>
            </div>` : ''}
        `;
        playersDiv.appendChild(card);
      });
    }
    section.appendChild(playersDiv);
    container.appendChild(section);
  });
}

async function filterPlayers() {
  const q = document.getElementById('playerSearch').value;
  await renderTiers(currentGamemode, q);
}

// ===== ADD PLAYER =====
function openAddPlayer() {
  if (!isAdmin()) return showToast('Access denied.', 'error');
  document.getElementById('modalPlayerName').value = '';
  document.getElementById('modalTier').value = 'HT1';
  document.getElementById('addPlayerModal').classList.remove('hidden');
}

async function confirmAddPlayer() {
  const name = document.getElementById('modalPlayerName').value.trim();
  const tier = document.getElementById('modalTier').value;
  if (!name) return showToast('Please enter a player name.', 'error');
  const players = await getPlayers();
  if (players.find(p => p.gamemode === currentGamemode && p.name.toLowerCase() === name.toLowerCase()))
    return showToast('Player already exists in this gamemode.', 'error');
  players.push({ id: genId(), name, gamemode: currentGamemode, tier });
  await savePlayers(players);
  closeModal('addPlayerModal');
  await renderTiers(currentGamemode);
  await renderGamemodeCards();
  showToast(`${name} added to ${tier}!`, 'success');
}

// ===== EDIT PLAYER =====
async function openEditPlayer(id) {
  if (!isAdmin()) return;
  const players = await getPlayers();
  const player  = players.find(p => p.id === id);
  if (!player) return;
  document.getElementById('editPlayerId').value   = id;
  document.getElementById('editPlayerName').value = player.name;
  document.getElementById('editTier').value       = player.tier;
  document.getElementById('editGamemode').innerHTML = GAMEMODES.map(g =>
    `<option value="${g.id}" ${g.id === player.gamemode ? 'selected' : ''}>${g.name}</option>`
  ).join('');
  document.getElementById('editPlayerModal').classList.remove('hidden');
}

async function confirmEditPlayer() {
  const id   = document.getElementById('editPlayerId').value;
  const name = document.getElementById('editPlayerName').value.trim();
  const tier = document.getElementById('editTier').value;
  const gm   = document.getElementById('editGamemode').value;
  if (!name) return showToast('Player name cannot be empty.', 'error');
  const players = await getPlayers();
  const idx     = players.findIndex(p => p.id === id);
  if (idx === -1) return;
  players[idx] = { ...players[idx], name, tier, gamemode: gm };
  await savePlayers(players);
  closeModal('editPlayerModal');
  if (currentPage === 'gamemode') await renderTiers(currentGamemode);
  await renderAdminList();
  showToast('Player updated!', 'success');
}

// ===== DELETE PLAYER =====
async function deletePlayer(id) {
  if (!isAdmin()) return;
  if (!confirm('Delete this player?')) return;
  const players = (await getPlayers()).filter(p => p.id !== id);
  await savePlayers(players);
  if (currentPage === 'gamemode') await renderTiers(currentGamemode);
  await renderGamemodeCards();
  await renderAdminList();
  showToast('Player deleted.', 'info');
}

// ===== OVERALL =====
async function renderOverall() {
  const players = await getPlayers();
  const content = document.getElementById('overallContent');
  if (players.length === 0) {
    content.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:3rem">No players ranked yet.</p>';
    return;
  }
  const tierRank = {};
  TIER_ORDER.forEach((t, i) => tierRank[t] = i);
  const sorted = [...players].sort((a, b) => tierRank[a.tier] - tierRank[b.tier]);
  content.innerHTML = `
    <div class="overall-table-wrap">
      <table class="overall-table">
        <thead><tr><th>#</th><th>Player</th><th>Gamemode</th><th>Tier</th></tr></thead>
        <tbody>${sorted.map((p, i) => {
          const meta = TIER_META[p.tier];
          const gm   = GAMEMODES.find(g => g.id === p.gamemode);
          return `<tr>
            <td style="color:var(--text-muted);font-size:.8rem">${i+1}</td>
            <td style="font-weight:600">${p.name}</td>
            <td>${gm ? `<img src="${gm.icon}" alt="${gm.name}" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;margin-right:6px">${gm.name}` : p.gamemode}</td>
            <td><span class="rank-badge" style="background:${meta.color}22;color:${meta.color};border:1px solid ${meta.color}55">${p.tier}</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
}

// ===== ADMIN PANEL =====
function renderAdminSelects() {
  const opts = GAMEMODES.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
  document.getElementById('adminGamemode').innerHTML  = opts;
  document.getElementById('adminFilterGm').innerHTML = `<option value="all">All Gamemodes</option>` + opts;
  document.getElementById('editGamemode').innerHTML  = opts;
}

async function renderAdminList() {
  const filter  = document.getElementById('adminFilterGm')?.value || 'all';
  const players = (await getPlayers()).filter(p => filter === 'all' || p.gamemode === filter);
  const list    = document.getElementById('adminPlayerList');
  if (!list) return;
  if (players.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem">No players found.</p>';
    return;
  }
  list.innerHTML = players.map(p => {
    const meta = TIER_META[p.tier];
    const gm   = GAMEMODES.find(g => g.id === p.gamemode);
    return `
      <div class="admin-player-item">
        <div style="background:linear-gradient(135deg,${meta.color},rgba(0,0,0,.5));width:30px;height:30px;border-radius:6px;font-size:.75rem;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          ${p.name.substring(0,2).toUpperCase()}
        </div>
        <span class="player-name">${p.name}</span>
        <span class="player-gm">${gm ? `<img src="${gm.icon}" alt="${gm.name}" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:4px">${gm.name}` : p.gamemode}</span>
        <span class="rank-badge" style="background:${meta.color}22;color:${meta.color};font-size:.7rem;padding:.15rem .5rem;border-radius:5px">${p.tier}</span>
        <button class="player-edit-btn" onclick="openEditPlayer('${p.id}')"><i class="fa fa-pen"></i></button>
        <button class="player-del-btn"  onclick="deletePlayer('${p.id}')"><i class="fa fa-trash"></i></button>
      </div>`;
  }).join('');
}

async function adminAddPlayer() {
  const name = document.getElementById('adminPlayerName').value.trim();
  const gm   = document.getElementById('adminGamemode').value;
  const tier = document.getElementById('adminTier').value;
  if (!name) return showToast('Enter a player name.', 'error');
  const players = await getPlayers();
  if (players.find(p => p.gamemode === gm && p.name.toLowerCase() === name.toLowerCase()))
    return showToast('Player already exists in this gamemode.', 'error');
  players.push({ id: genId(), name, gamemode: gm, tier });
  await savePlayers(players);
  document.getElementById('adminPlayerName').value = '';
  await renderAdminList();
  await renderGamemodeCards();
  showToast(`${name} added!`, 'success');
}

// ===== EXPORT / IMPORT =====
async function exportData() {
  const players = await getPlayers();
  const blob    = new Blob([JSON.stringify({ players, exportedAt: new Date().toISOString(), binId: BIN_ID }, null, 2)], { type:'application/json' });
  const a       = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: '5dma-tiers-export.json' });
  a.click(); URL.revokeObjectURL(a.href);
  showToast('Data exported!', 'success');
}

async function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data.players)) throw new Error();
      await savePlayers(data.players);
      await renderAdminList();
      await renderGamemodeCards();
      showToast(`Imported ${data.players.length} players!`, 'success');
    } catch { showToast('Invalid JSON file.', 'error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

async function clearAllData() {
  if (!confirm('Clear ALL player data? This cannot be undone!')) return;
  await savePlayers([]);
  await renderAdminList();
  await renderGamemodeCards();
  showToast('All data cleared.', 'info');
}

// ===== MODAL / TOAST / NAV =====
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 3500);
}

function toggleMobileMenu() {
  const links   = document.querySelector('.nav-links');
  const visible = links.style.display === 'flex';
  Object.assign(links.style, {
    display: visible ? 'none' : 'flex', flexDirection: 'column',
    position: 'absolute', top: '64px', left: '0', right: '0',
    background: 'rgba(8,11,20,0.98)', padding: '1rem',
    borderBottom: '1px solid rgba(0,212,255,0.15)', zIndex: '99',
  });
}

function genId() { return Math.random().toString(36).substring(2,10) + Date.now().toString(36); }

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  await initBin();
  await fetchPlayers();
  updateNavUI();
  await renderGamemodeCards();
  showPage('home');

  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); });
  });
  document.getElementById('authOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('authOverlay')) closeAuth();
  });
});
