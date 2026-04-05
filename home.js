/* ===== HOME ===== */

function renderHome() {
  updateClock();
  renderOverdueAlert();
  renderToday();
  renderFocus();
  renderHabits();
  renderHomeReminders();
  renderUpcoming();
}

function updateClock() {
  const now = new Date();
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const h = now.getHours(), m = now.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  set('hero-time', `${h12}:${pad(m)} ${ampm}`);
  set('hero-date', `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`);
}

function renderOverdueAlert() {
  const overdue = DB.tasks.filter(t => !t.done && t.date && isPast(t.date)).length
    + DB.reminders.filter(r => !r.done && r.date && (!r.recur || r.recur === 'none') && isPast(r.date)).length;
  const el = document.getElementById('overdue-alert');
  if (!el) return;
  if (overdue > 0) {
    el.classList.remove('hidden');
    set('overdue-text', `${overdue} overdue item${overdue > 1 ? 's' : ''} need attention`);
  } else {
    el.classList.add('hidden');
  }
}

function renderToday() {
  const today = todayStr();
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Gather events + tasks-with-time for today
  let items = getEventsForDate(today).map(e => ({ ...e, _k: 'event' }));
  // Add today's tasks as time-less items
  DB.tasks.filter(t => !t.done && t.date === today).forEach(t => items.push({ ...t, _k: 'task', time: '' }));
  items.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const el = document.getElementById('home-today');
  if (!items.length) {
    el.innerHTML = '<p class="empty">Nothing scheduled. Add an event or task.</p>';
    return;
  }

  const areaBar = a => ({we:'var(--we)',cn:'var(--cn)',consult:'var(--cn)',pe:'var(--pe)',personal:'var(--pe)',co:'var(--co)',content:'var(--co)',fi:'var(--fi)',finance:'var(--fi)'}[a] || 'var(--border2)');

  el.innerHTML = items.map(item => {
    let isNow = false;
    if (item.time) {
      const [hh, mm] = item.time.split(':').map(Number);
      const start = hh * 60 + mm;
      const end = item.endTime ? (() => { const [eh,em]=item.endTime.split(':').map(Number); return eh*60+em; })() : start + 60;
      isNow = nowMin >= start && nowMin < end;
    }
    return `<div class="today-item">
      <div class="ti-time">${item.time || ''}</div>
      <div class="ti-bar" style="background:${item._k==='task'?'var(--border2)':areaBar(item.area)}"></div>
      <div class="ti-body">
        <div class="ti-title">${esc(item.title)}${isNow ? '<span class="now-badge">now</span>' : ''}</div>
        ${item.location ? `<div class="ti-sub">${esc(item.location)}</div>` : ''}
        ${item.recur && item.recur !== 'none' ? `<div class="ti-sub">↻ ${item.recur}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function renderFocus() {
  const el = document.getElementById('home-focus');
  const top = DB.tasks.filter(t => t.top3 && !t.done).sort((a,b) => Number(a.top3) - Number(b.top3)).slice(0, 3);
  if (!top.length) {
    el.innerHTML = '<p class="empty">No focus tasks set. Add a task and mark it as Top 1–3.</p>';
    return;
  }
  el.innerHTML = top.map(t => {
    const bg = areaBg(t.area), fg = areaFg(t.area);
    return `<div class="focus-item">
      <div class="fi-check ${t.done?'done':''}" onclick="toggleTask('${t.id}')"></div>
      <span class="fi-title ${t.done?'done':''}">${esc(t.title)}</span>
      ${t.area ? `<span class="fi-area" style="background:${bg};color:${fg}">${areaLabel(t.area)}</span>` : ''}
    </div>`;
  }).join('');
}

function renderHabits() {
  const el = document.getElementById('home-habits');
  const today = todayStr();
  const log = DB.habitLog[today] || {};
  const todayHabits = DB.habits.filter(h => matchesRecurrence(h, today));
  if (!todayHabits.length) {
    el.innerHTML = '<p class="empty">No habits for today. Add one above.</p>';
    return;
  }
  el.innerHTML = todayHabits.map(h => `
    <div class="habit-item">
      <div class="hb-check ${log[h.id]?'done':''}" onclick="toggleHabit('${h.id}')"></div>
      <span class="hb-name ${log[h.id]?'done':''}">${h.icon ? h.icon + ' ' : ''}${esc(h.name)}</span>
      <span class="hb-freq">${h.recur || 'daily'}</span>
    </div>`).join('');
}

function renderHomeReminders() {
  const el = document.getElementById('home-reminders');
  const today = todayStr();
  const log = DB.habitLog[today] || {};
  const active = DB.reminders.filter(r => {
    if (r.recur && r.recur !== 'none') return matchesRecurrence(r, today);
    if (r.done) return false;
    return !r.date || r.date <= today;
  }).slice(0, 6);

  if (!active.length) {
    el.innerHTML = '<p class="empty">No reminders active today.</p>';
    return;
  }
  el.innerHTML = active.map(r => {
    const isRecur = r.recur && r.recur !== 'none';
    const isDone = isRecur ? !!log['rem_' + r.id] : r.done;
    const overdue = !isRecur && r.date && isPast(r.date) && !r.done;
    return `<div class="rem-item">
      <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleReminder('${r.id}')">
      <div class="rem-body">
        <div class="rem-text ${isDone?'done':''}">${esc(r.text)}</div>
        ${r.date && !isRecur ? `<div class="rem-due ${overdue?'late':''}">${overdue?'Overdue · ':''}${formatDate(r.date)}</div>` : ''}
        ${isRecur ? `<div class="rem-recur">↻ ${r.recur}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function renderUpcoming() {
  const el = document.getElementById('home-upcoming');
  const today = todayStr();
  const items = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const ds = d.toISOString().split('T')[0];
    getEventsForDate(ds).forEach(e => items.push({ ...e, _date: ds }));
    DB.meetings.filter(m => m.date === ds).forEach(m => items.push({ ...m, _date: ds }));
  }
  items.sort((a, b) => a._date.localeCompare(b._date) || (a.time || '').localeCompare(b.time || ''));
  if (!items.length) {
    el.innerHTML = '<p class="empty">Nothing in the next 7 days.</p>';
    return;
  }
  const areaColor = a => ({we:'var(--we)',consult:'var(--cn)',cn:'var(--cn)',personal:'var(--pe)',pe:'var(--pe)',content:'var(--co)',co:'var(--co)',finance:'var(--fi)',fi:'var(--fi)'}[a] || 'var(--border2)');
  el.innerHTML = items.slice(0, 5).map(e => `
    <div class="up-item">
      <div class="up-dot" style="background:${areaColor(e.area)}"></div>
      <div class="up-body">
        <div class="up-title">${esc(e.title)}</div>
        <div class="up-when">${formatDateShort(e._date)}${e.time ? ' · ' + e.time : ''}</div>
      </div>
    </div>`).join('');
}
