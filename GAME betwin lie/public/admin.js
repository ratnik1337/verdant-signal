(function () {
  const loginView = document.getElementById('admin-login-view');
  const dashboard = document.getElementById('admin-dashboard');
  const loginForm = document.getElementById('admin-login-form');
  const loginMessage = document.getElementById('admin-login-message');
  const dashboardMessage = document.getElementById('admin-dashboard-message');
  const tableBody = document.getElementById('player-table-body');
  const dialog = document.getElementById('player-dialog');
  const dialogContent = document.getElementById('player-dialog-content');
  const state = { countries: [], currencies: [] };

  async function api(url, options = {}) {
    const response = await fetch(url, { ...options, credentials: 'same-origin', headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }, body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error?.message || 'Request failed');
    return body;
  }

  function showMessage(message, success = false) {
    dashboardMessage.textContent = message || '';
    dashboardMessage.className = `form-message${success ? ' success' : ''}`;
  }

  function fillCatalogs(catalogs) {
    state.countries = catalogs.countries || [];
    state.currencies = catalogs.currencies || [];
    const country = document.getElementById('filter-country');
    const currency = document.getElementById('filter-currency');
    state.countries.forEach((item) => { const option = document.createElement('option'); option.value = item.code; option.textContent = item.name; country.appendChild(option); });
    state.currencies.forEach((item) => { const option = document.createElement('option'); option.value = item.code; option.textContent = `${item.code} · ${item.name}`; currency.appendChild(option); });
  }

  function money(row, amount) {
    const fraction = Number(row.currencyFractionDigits || 2);
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: row.currencyCode || 'USD', minimumFractionDigits: fraction, maximumFractionDigits: fraction }).format(Number(amount || 0) / (10 ** fraction)); } catch { return `${row.currencyCode || 'USD'} ${amount || 0}`; }
  }

  function cell(value, strong = false) {
    const node = document.createElement('td');
    if (strong) { const text = document.createElement('strong'); text.textContent = value ?? '—'; node.appendChild(text); } else node.textContent = value ?? '—';
    return node;
  }

  function renderRows(players) {
    tableBody.replaceChildren();
    players.forEach((player) => {
      const row = document.createElement('tr');
      row.append(cell(player.playerId, true)); row.append(cell(player.nickname || 'Incomplete')); row.append(cell(player.countryCode || '—')); row.append(cell(player.currencyCode || '—')); row.append(cell(player.level)); row.append(cell(player.activeDays)); row.append(cell(money(player, player.balanceMinor + player.bonusBalanceMinor)));
      row.append(cell(player.online ? 'Online' : 'Offline'));
      const action = document.createElement('td'); const button = document.createElement('button'); button.className = 'button button-subtle'; button.type = 'button'; button.textContent = 'Details'; button.addEventListener('click', () => openDetails(player.id)); action.appendChild(button); row.append(action);
      tableBody.appendChild(row);
    });
    if (!players.length) { const row = document.createElement('tr'); const empty = document.createElement('td'); empty.colSpan = 9; empty.className = 'empty-state'; empty.textContent = 'No players match these filters.'; row.appendChild(empty); tableBody.appendChild(row); }
  }

  async function loadPlayers() {
    const params = new URLSearchParams();
    const mappings = [['filter-country', 'country'], ['filter-currency', 'currency'], ['filter-level', 'level'], ['filter-online', 'online'], ['filter-profile', 'profileCompleted'], ['filter-withdrawal', 'withdrawalEligible']];
    mappings.forEach(([id, key]) => { const value = document.getElementById(id).value; if (value) params.set(key, value); });
    const days = document.getElementById('filter-days').value; if (days) params.set('activeDays', days);
    showMessage('Loading…');
    try { const result = await api(`/api/admin/players?${params}`); renderRows(result.players || []); showMessage(`${result.players.length} player record${result.players.length === 1 ? '' : 's'}.`, true); } catch (error) { showMessage(error.message); }
  }

  function detailRow(label, value) {
    const item = document.createElement('div'); const labelNode = document.createElement('dt'); labelNode.textContent = label; const valueNode = document.createElement('dd'); valueNode.textContent = value ?? '—'; item.append(labelNode, valueNode); return item;
  }

  async function openDetails(id) {
    try {
      const detail = await api(`/api/admin/players/${id}`);
      const player = detail.player;
      dialogContent.replaceChildren();
      const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = 'PLAYER DETAIL';
      const title = document.createElement('h2'); title.textContent = player.nickname || 'Incomplete profile';
      const intro = document.createElement('p'); intro.className = 'lede'; intro.textContent = `${player.playerId} · ${player.countryName || 'No country'} · ${player.currencyCode || 'No currency'}`;
      const stats = document.createElement('div'); stats.className = 'admin-stat-grid'; [['Level', player.level], ['Active days', player.activeDays], ['Balance', money(player, player.balanceMinor + player.bonusBalanceMinor)]].forEach(([label, value]) => { const item = document.createElement('div'); item.className = 'admin-stat'; const key = document.createElement('span'); key.textContent = label; const val = document.createElement('strong'); val.textContent = value; item.append(key, val); stats.appendChild(item); });
      const profile = document.createElement('dl'); profile.className = 'data-list'; profile.append(detailRow('Last seen', player.lastSeenAt || 'Not available'), detailRow('Withdrawal', player.withdrawalEligible ? 'Eligible' : 'Locked'), detailRow('Profile', player.profileCompleted ? 'Complete' : 'Incomplete'));
      const activity = document.createElement('section'); activity.className = 'detail-section'; const activityTitle = document.createElement('h3'); activityTitle.textContent = `Activity (${detail.activity.length})`; const activityCopy = document.createElement('p'); activityCopy.className = 'helper'; activityCopy.textContent = detail.activity.slice(0, 10).map((item) => `${item.activityDate} / ${item.signalCount} signals`).join(' · ') || 'No activity records.'; activity.append(activityTitle, activityCopy);
      const events = document.createElement('section'); events.className = 'detail-section'; const eventsTitle = document.createElement('h3'); eventsTitle.textContent = `Game events (${detail.events.length})`; const eventsCopy = document.createElement('p'); eventsCopy.className = 'helper'; eventsCopy.textContent = detail.events.slice(0, 10).map((item) => `${item.game} / ${item.eventType}`).join(' · ') || 'No game events.'; events.append(eventsTitle, eventsCopy);
      const bonuses = document.createElement('section'); bonuses.className = 'detail-section'; const bonusesTitle = document.createElement('h3'); bonusesTitle.textContent = `Bonuses (${detail.bonuses.length})`; const bonusesCopy = document.createElement('p'); bonusesCopy.className = 'helper'; bonusesCopy.textContent = detail.bonuses.map((item) => `Level ${item.level} / ${money(player, item.amountMinor)}`).join(' · ') || 'No bonus records.'; bonuses.append(bonusesTitle, bonusesCopy);
      const requests = document.createElement('section'); requests.className = 'detail-section'; const requestsTitle = document.createElement('h3'); requestsTitle.textContent = `Analysis requests (${detail.analysisHistory.length})`; const requestsCopy = document.createElement('p'); requestsCopy.className = 'helper'; requestsCopy.textContent = detail.analysisHistory.slice(0, 10).map((item) => `${item.game} / ${item.createdAt}`).join(' · ') || 'No analysis requests.'; requests.append(requestsTitle, requestsCopy);
      dialogContent.append(eyebrow, title, intro, stats, profile, activity, events, bonuses, requests); dialog.showModal();
    } catch (error) { showMessage(error.message); }
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); loginMessage.textContent = 'Signing in…';
    try { await api('/api/admin/login', { method: 'POST', body: { password: new FormData(loginForm).get('password') } }); loginView.hidden = true; dashboard.hidden = false; const catalogs = await api('/api/catalogs'); fillCatalogs(catalogs); await loadPlayers(); } catch (error) { loginMessage.textContent = error.message; }
  });
  document.getElementById('admin-filters').addEventListener('submit', (event) => { event.preventDefault(); loadPlayers(); });
  document.getElementById('admin-logout').addEventListener('click', async () => { await api('/api/admin/logout', { method: 'POST' }).catch(() => {}); window.location.reload(); });
  document.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
}());
