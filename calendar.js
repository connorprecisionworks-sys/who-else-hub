/* ===== CALENDAR ===== */
let _calDate = new Date();
let _calView = 'month';

function renderCalendar() {
  document.getElementById('cal-title').textContent = calTitle();
  _calView === 'month' ? renderMonth() : renderWeek();
}

function calTitle() {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  if (_calView === 'month') return `${months[_calDate.getMonth()]} ${_calDate.getFullYear()}`;
  // Week: show range
  const startOfWeek = new Date(_calDate);
  startOfWeek.setDate(_calDate.getDate() - _calDate.getDay());
  const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate()+6);
  const fmt = d => d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  return `${fmt(startOfWeek)} – ${fmt(endOfWeek)}, ${startOfWeek.getFullYear()}`;
}

function calNav(dir) {
  if (_calView==='month') _calDate.setMonth(_calDate.getMonth()+dir);
  else _calDate.setDate(_calDate.getDate()+(dir*7));
  renderCalendar();
}
function calToday() { _calDate = new Date(); renderCalendar(); }
function calJumpTo(dateStr) {
  _calDate = new Date(dateStr+'T12:00:00');
  setCalView('month');
}
function setCalView(v, btn) {
  _calView = v;
  document.querySelectorAll('.view-tab').forEach(el=>el.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else {
    const tabEl = document.getElementById('tab-'+v);
    if (tabEl) tabEl.classList.add('active');
  }
  renderCalendar();
}

function renderMonth() {
  const year = _calDate.getFullYear(), month = _calDate.getMonth();
  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const today = todayStr();
  const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  let html = `<div class="month-grid">
    <div class="month-dow-row">${dows.map(d=>`<div class="month-dow">${d}</div>`).join('')}</div>
    <div class="month-days">`;

  // Prev month fill
  const prevDays = new Date(year,month,0).getDate();
  for (let i=firstDay-1;i>=0;i--) {
    html+=`<div class="month-day other-month"><div class="day-num" style="opacity:0.35">${prevDays-i}</div></div>`;
  }

  for (let day=1;day<=daysInMonth;day++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const isT = ds===today;
    const evs = getEventsForDate(ds);
    const meetings = DB.meetings.filter(m=>m.date===ds);
    const allItems = [...evs, ...meetings.map(m=>({...m,area:m.area||'we'}))];
    allItems.sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    const MAX_SHOW = 3;
    html+=`<div class="month-day ${isT?'today':''}" onclick="calDayClick('${ds}')">
      <div class="day-num">${day}</div>
      <div class="day-events">
        ${allItems.slice(0,MAX_SHOW).map(e=>`<div class="day-event area-${e.area||'consult'}" onclick="event.stopPropagation();showEventDetail('${e.id}')">${e.time?e.time.slice(0,5)+' ':''}${esc(e.title)}</div>`).join('')}
        ${allItems.length>MAX_SHOW?`<div class="day-more">+${allItems.length-MAX_SHOW} more</div>`:''}
      </div>
    </div>`;
  }

  // Next month fill
  const total = firstDay + daysInMonth;
  const nextDays = total % 7 === 0 ? 0 : 7-(total%7);
  for (let i=1;i<=nextDays;i++) {
    html+=`<div class="month-day other-month"><div class="day-num" style="opacity:0.35">${i}</div></div>`;
  }

  html+='</div></div>';
  document.getElementById('cal-body').innerHTML=html;
}

function renderWeek() {
  const startOfWeek = new Date(_calDate);
  startOfWeek.setDate(_calDate.getDate()-_calDate.getDay());
  const today = todayStr();
  const now = new Date();
  const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Header
  let headerCells = '<div class="week-header-cell" style="border-right:1px solid var(--border)"></div>';
  const weekDays = [];
  for (let i=0;i<7;i++) {
    const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate()+i);
    const ds = d.toISOString().split('T')[0];
    weekDays.push({d,ds});
    const isT = ds===today;
    headerCells+=`<div class="week-header-cell">
      <div class="week-dow">${dows[d.getDay()]}</div>
      <div class="week-day-num ${isT?'today-num':''}">${d.getDate()}</div>
    </div>`;
  }

  // Body — 16 hours (6am–10pm)
  const START_H = 6, HOURS = 17;
  const PX_PER_H = 48;

  let timeCol = '';
  for (let h=START_H;h<START_H+HOURS;h++) {
    const label = h===0?'12am':h<12?h+'am':h===12?'12pm':(h-12)+'pm';
    timeCol+=`<div class="week-hour-label">${label}</div>`;
  }

  let dayCols = '';
  weekDays.forEach(({d,ds})=>{
    const isT = ds===today;
    const evs = getEventsForDate(ds);
    const meetings = DB.meetings.filter(m=>m.date===ds);
    const allItems = [...evs,...meetings.map(m=>({...m,area:m.area||'we'}))].filter(e=>e.time);

    let lines = '';
    for (let h=0;h<HOURS;h++) {
      lines+=`<div class="week-hour-line" onclick="quickEventOnDay('${ds}','${String(START_H+h).padStart(2,'0')}:00')"></div>`;
    }

    let events = '';
    allItems.forEach(e=>{
      if (!e.time) return;
      const [hh,mm] = e.time.split(':').map(Number);
      const startMin = (hh-START_H)*PX_PER_H + (mm/60)*PX_PER_H;
      if (startMin < 0) return;
      let durationMin = 60;
      if (e.endTime) {
        const [eh,em] = e.endTime.split(':').map(Number);
        durationMin = (eh-hh)*60+(em-mm);
        if (durationMin<=0) durationMin=30;
      }
      const height = Math.max(20, (durationMin/60)*PX_PER_H);
      events+=`<div class="week-event area-${e.area||'consult'}" style="top:${startMin}px;height:${height}px" onclick="event.stopPropagation();showEventDetail('${e.id}')">
        <div style="font-weight:500">${e.time.slice(0,5)}</div>
        <div>${esc(e.title)}</div>
      </div>`;
    });

    // Now line
    let nowLine = '';
    if (isT) {
      const nowMin = (now.getHours()-START_H)*PX_PER_H + (now.getMinutes()/60)*PX_PER_H;
      if (nowMin>=0) nowLine=`<div class="week-now-line" style="top:${nowMin}px"></div>`;
    }

    dayCols+=`<div class="week-day-col">${lines}${events}${nowLine}</div>`;
  });

  document.getElementById('cal-body').innerHTML=`<div class="week-grid">
    <div class="week-header">${headerCells}</div>
    <div class="week-body">
      <div class="week-time-col">${timeCol}</div>
      ${dayCols}
    </div>
  </div>`;
}

function calDayClick(ds) {
  // Show day events in a small modal
  const evs = getEventsForDate(ds);
  const meetings = DB.meetings.filter(m=>m.date===ds);
  const allItems = [...evs,...meetings.map(m=>({...m,area:m.area||'we'}))].sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const areaColor = a=>({we:'var(--we-mid)',consult:'var(--consult-mid)',personal:'var(--personal-mid)',content:'var(--content-mid)',finance:'var(--finance-mid)'}[a]||'var(--border2)');

  openModal(formatDate(ds), `
    ${allItems.length ? allItems.map(e=>`<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:3px;background:${areaColor(e.area)};border-radius:2px;min-height:16px;margin-top:3px;flex-shrink:0"></div>
      <div>
        <div style="font-size:14px;font-weight:500">${esc(e.title)}</div>
        ${e.time?`<div style="font-size:12px;color:var(--text3);font-family:'DM Mono',monospace">${e.time}${e.endTime?' – '+e.endTime:''}</div>`:''}
        ${e.location?`<div style="font-size:12px;color:var(--text3)">${esc(e.location)}</div>`:''}
      </div>
      <button class="btn-icon-sm" style="margin-left:auto;flex-shrink:0" onclick="closeModal();openPanel('event','${e.id}')">✎</button>
    </div>`).join('') : '<p style="font-size:13px;color:var(--text3);padding:10px 0">Nothing scheduled this day.</p>'}
    <button class="btn-primary-full" style="margin-top:12px" onclick="closeModal();_pendingDate='${ds}';openPanel('event')">+ Add Event</button>
  `);
}

let _pendingDate = null;

function quickEventOnDay(ds, time) {
  _pendingDate = ds;
  openPanel('event');
  setTimeout(()=>{
    const dateEl = document.getElementById('f-date');
    const timeEl = document.getElementById('f-time');
    if (dateEl) dateEl.value = ds;
    if (timeEl) timeEl.value = time;
  }, 100);
}

function showEventDetail(id) {
  const e = DB.events.find(x=>x.id===id) || DB.meetings.find(x=>x.id===id);
  if (!e) return;
  const people = e.peopleIds ? DB.people.filter(p=>e.peopleIds.includes(p.id)) : [];
  const areaColor = {we:'var(--we-mid)',consult:'var(--consult-mid)',personal:'var(--personal-mid)',content:'var(--content-mid)',finance:'var(--finance-mid)'}[e.area]||'var(--border2)';
  openModal(e.title, `
    <div class="detail-section"><div class="detail-label">Area</div><div class="detail-value" style="color:${areaColor}">${areaLabel(e.area)}</div></div>
    ${e.date?`<div class="detail-section"><div class="detail-label">Date & Time</div><div class="detail-value">${formatDate(e.date)}${e.time?' · '+e.time:''}${e.endTime?' – '+e.endTime:''}</div></div>`:''}
    ${e.location?`<div class="detail-section"><div class="detail-label">Location</div><div class="detail-value">${esc(e.location)}</div></div>`:''}
    ${e.recur&&e.recur!=='none'?`<div class="detail-section"><div class="detail-label">Recurring</div><div class="detail-value">↻ ${e.recur}</div></div>`:''}
    ${people.length?`<div class="detail-section"><div class="detail-label">Attendees</div><div class="tag-row">${people.map(p=>`<span class="tag">${esc(p.name)}</span>`).join('')}</div></div>`:''}
    ${e.agenda?`<div class="detail-section"><div class="detail-label">Agenda</div><div class="detail-value">${esc(e.agenda)}</div></div>`:''}
    ${e.notes?`<div class="detail-section"><div class="detail-label">Notes</div><div class="detail-value">${esc(e.notes)}</div></div>`:''}
    <div class="detail-actions">
      <button class="btn-outline-sm" onclick="closeModal();openPanel('event','${e.id}')">Edit</button>
      <button class="btn-danger-sm" onclick="deleteEvent('${e.id}')">Delete</button>
    </div>
  `);
}
