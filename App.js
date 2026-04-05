/* ===== APP ===== */
let _view = 'home';
const VIEW_LABELS = { home:'Home', calendar:'Calendar', people:'People', meetings:'Meetings', tasks:'Tasks', notes:'Notes', pitch:'Pitch Page' };

function nav(name, el) {
  _view = name;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name)?.classList.add('active');
  // Sidebar
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.nav-btn[data-view="${name}"]`)?.classList.add('active');
  // Bottom nav
  document.querySelectorAll('.bot-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.bot-btn[data-view="${name}"]`)?.classList.add('active');
  // Mobile title
  const mt = document.getElementById('mob-title');
  if (mt) mt.textContent = VIEW_LABELS[name] || name;
  // Scroll to top on mobile
  window.scrollTo(0, 0);
  renderCurrentView();
  // el may be null (called programmatically)
}

function renderCurrentView() {
  if (_view === 'home') renderHome();
  else if (_view === 'calendar') renderCalendar();
  else if (_view === 'people') renderPeopleView();
  else if (_view === 'meetings') renderMeetingsView();
  else if (_view === 'tasks') renderTasksView();
  else if (_view === 'notes') renderNotesView();
  else if (_view === 'pitch') renderPortfolio();
}

/* ===== ADD MENU ===== */
function openAddMenu() {
  document.getElementById('add-bg').classList.remove('hidden');
  document.getElementById('add-menu').classList.remove('hidden');
}
function closeAddMenu() {
  document.getElementById('add-bg').classList.add('hidden');
  document.getElementById('add-menu').classList.add('hidden');
}

/* ===== KEYBOARD ===== */
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); openPanel('person'); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'm') { e.preventDefault(); openPanel('meeting'); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); openPanel('note'); }
  if ((e.metaKey || e.ctrlKey) && e.key === 't') { e.preventDefault(); openPanel('task'); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'e') { e.preventDefault(); openPanel('event'); }
  if (e.key === 'Escape') { closePanel(); closeModal(); closeAddMenu(); }
  if (!e.metaKey && !e.ctrlKey) {
    if (e.key === '1') nav('home', null);
    if (e.key === '2') nav('calendar', null);
    if (e.key === '3') nav('people', null);
    if (e.key === '4') nav('tasks', null);
  }
});

/* ===== CLOCK ===== */
function startClock() {
  updateClock();
  setInterval(() => {
    if (_view === 'home') { updateClock(); renderToday(); }
  }, 30000);
}

/* ===== BOOT ===== */
document.addEventListener('DOMContentLoaded', () => {
  load();
  renderHome();
  renderPortfolio(); // pre-render stats
  startClock();
});
