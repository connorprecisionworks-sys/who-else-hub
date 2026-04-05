/* ===== STATE ===== */
const DB = {
  people: [], events: [], meetings: [], tasks: [], reminders: [], habits: [],
  habitLog: {}, notes: [],
  portfolio: {
    name:'Who Else', tagline:'The student innovation collective at the intersection of faith, technology, and the next generation.',
    powered:'Powered by Genesis Studios @ Austin Christian University',
    question:'"Who else should be trusted to pioneer the future of technology?"',
    questionSub:'This isn\'t rhetorical. It\'s a selection mechanism. Who Else identifies the young founders who answer that question with their work — not their words.',
    mission:'A high-agency cohort of high school builders who don\'t wait for permission to ship. We\'re the talent pipeline, competition engine, and community hub for faith-driven founders.',
    infra:'Genesis Studios at ACU provides the capital, mentorship, network, and institutional credibility. They\'re the investor, anchor, and home base behind Who Else.',
    offers:['AI-judged pitch competition with prizes','1-on-1 mentorship from Genesis Studios','Weekly Mission Drops — build challenges','Team formation with other student founders'],
    who:['High school builders with a real idea','Faith-driven problem solvers','Students who ship, not just talk','Future founders who want to be found early'],
    teachersMsg:'We partner with schools and churches to bring the Who Else experience to your students. At no cost to them.',
    email:'whoelse@genesistudios.com'
  }
};

/* ===== PERSIST ===== */
function save() { try { localStorage.setItem('we_v3', JSON.stringify(DB)); } catch(e) {} }
function load() {
  try {
    const r = localStorage.getItem('we_v3');
    if (r) { const p = JSON.parse(r); if (p.portfolio) p.portfolio = Object.assign({}, DB.portfolio, p.portfolio); Object.assign(DB, p); }
  } catch(e) {}
}

/* ===== HELPERS ===== */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,5); }
function todayStr() { return new Date().toISOString().split('T')[0]; }
function pad(n) { return String(n).padStart(2,'0'); }
function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function set(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function formatDate(d) { if (!d) return ''; return new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
function formatDateShort(d) { if (!d) return ''; return new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function isPast(d) { return d && new Date(d+'T00:00:00') < new Date(new Date().toDateString()); }
function isUpcoming(d) { return d && new Date(d+'T00:00:00') >= new Date(new Date().toDateString()); }

function areaLabel(a) { return {we:'Who Else',consult:'Consulting',cn:'Consulting',personal:'Personal',pe:'Personal',content:'Content',co:'Content',finance:'Finance',fi:'Finance'}[a]||a||''; }
function areaBg(a) { return {we:'var(--we-s)',consult:'var(--cn-s)',cn:'var(--cn-s)',personal:'var(--pe-s)',pe:'var(--pe-s)',content:'var(--co-s)',co:'var(--co-s)',finance:'var(--fi-s)',fi:'var(--fi-s)'}[a]||'var(--accent-soft)'; }
function areaFg(a) { return {we:'var(--we-d)',consult:'var(--cn-d)',cn:'var(--cn-d)',personal:'var(--pe-d)',pe:'var(--pe-d)',content:'var(--co-d)',co:'var(--co-d)',finance:'var(--fi-d)',fi:'var(--fi-d)'}[a]||'var(--t2)'; }
function areaMid(a) { return {we:'var(--we)',consult:'var(--cn)',cn:'var(--cn)',personal:'var(--pe)',pe:'var(--pe)',content:'var(--co)',co:'var(--co)',finance:'var(--fi)',fi:'var(--fi)'}[a]||'var(--border2)'; }

/* ===== RECURRENCE ===== */
function matchesRecurrence(item, d) {
  if (!item.recur || item.recur === 'none') return item.date === d;
  if (item.date && d < item.date) return false;
  const dt = new Date(d+'T12:00:00'), dow = dt.getDay(), dom = dt.getDate();
  if (item.recur==='daily') return true;
  if (item.recur==='weekday') return dow>=1&&dow<=5;
  if (item.recur==='weekly') { if (!item.date) return false; return new Date(item.date+'T12:00:00').getDay()===dow; }
  if (item.recur==='biweekly') { if (!item.date) return false; const s=new Date(item.date+'T12:00:00'); if(s.getDay()!==dow)return false; return Math.round((dt-s)/604800000)%2===0; }
  if (item.recur==='monthly') { if (!item.date) return false; return new Date(item.date+'T12:00:00').getDate()===dom; }
  const dayMap = {mon:1,tue:2,wed:3,thu:4,fri:5,sat:6,sun:0};
  if (dayMap[item.recur] !== undefined) return dayMap[item.recur]===dow;
  return false;
}
function getEventsForDate(d) { return DB.events.filter(e => matchesRecurrence(e, d)); }

/* ===== TOAST ===== */
let _tt;
function showToast(msg) { const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(_tt); _tt=setTimeout(()=>t.classList.remove('show'),2300); }

/* ===== PANEL ===== */
let _pt=null, _eid=null;
function openPanel(type, id) {
  _pt=type; _eid=id||null;
  const labels={person:'Add Person',meeting:'Schedule Meeting',event:'Add Event',task:'Add Task',reminder:'Set Reminder',habit:'Add Habit',note:'New Note'};
  document.getElementById('panel-title').textContent = _eid ? 'Edit' : (labels[type]||type);
  document.getElementById('panel-body').innerHTML = buildForm(type, id);
  document.getElementById('side-panel').classList.add('open');
  document.getElementById('panel-overlay').classList.add('show');
  setTimeout(() => { const f=document.querySelector('#panel-body input:not([type=checkbox]):not([type=date]):not([type=time]),#panel-body textarea'); if(f)f.focus(); }, 240);
}
function closePanel() { document.getElementById('side-panel').classList.remove('open'); document.getElementById('panel-overlay').classList.remove('show'); _pt=null; _eid=null; }

/* ===== MODAL ===== */
function openModal(title, html) {
  set('modal-title', title);
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-bg').classList.add('show');
  const m = document.getElementById('modal');
  m.style.display='flex';
  requestAnimationFrame(()=>requestAnimationFrame(()=>m.classList.add('open')));
}
function closeModal() {
  const m=document.getElementById('modal'); m.classList.remove('open');
  document.getElementById('modal-bg').classList.remove('show');
  setTimeout(()=>{ m.style.display='none'; }, 200);
}

/* ===== AREA PICKER ===== */
function areaPicker(sel) {
  const areas=[{k:'we',l:'Who Else'},{k:'consult',l:'Consulting'},{k:'personal',l:'Personal'},{k:'content',l:'Content'},{k:'finance',l:'Finance'}];
  return `<div class="area-pick" id="apk">${areas.map(a=>`<span class="apick ap-${a.k} ${sel===a.k?'on':''}" onclick="pickArea('${a.k}')">${a.l}</span>`).join('')}</div>`;
}
function pickArea(k) { document.querySelectorAll('#apk .apick').forEach(e=>e.classList.remove('on')); document.querySelector(`#apk .ap-${k}`)?.classList.add('on'); }
function getArea() { const e=document.querySelector('#apk .apick.on'); if(!e)return'consult'; const m=e.className.match(/ap-(\w+)/); return m?m[1]:'consult'; }

/* ===== RECUR PICKER ===== */
function recurPicker(sel) {
  const opts=[{k:'none',l:'Once'},{k:'daily',l:'Daily'},{k:'weekday',l:'Weekdays'},{k:'weekly',l:'Weekly'},{k:'biweekly',l:'Biweekly'},{k:'monthly',l:'Monthly'},{k:'mon',l:'Mon'},{k:'tue',l:'Tue'},{k:'wed',l:'Wed'},{k:'thu',l:'Thu'},{k:'fri',l:'Fri'}];
  return `<div class="recur-pick" id="rpk">${opts.map(o=>`<span class="rpick ${(sel||'none')===o.k?'on':''}" onclick="pickRecur('${o.k}')">${o.l}</span>`).join('')}</div>`;
}
function pickRecur(k) { document.querySelectorAll('#rpk .rpick').forEach(e=>e.classList.remove('on')); document.querySelector(`#rpk [onclick="pickRecur('${k}')"]`)?.classList.add('on'); }
function getRecur() { const e=document.querySelector('#rpk .rpick.on'); if(!e)return'none'; const m=e.getAttribute('onclick').match(/pickRecur\('(\w+)'\)/); return m?m[1]:'none'; }

/* ===== PEOPLE PICKER ===== */
function peoplePicker(selIds) {
  selIds=selIds||[];
  if(!DB.people.length) return '<p style="font-size:13px;color:var(--t3);padding:4px 0">No people added yet.</p>';
  return `<div class="ppl-pick" id="ppk">${DB.people.map(p=>`<div class="ppl-item ${selIds.includes(p.id)?'on':''}" data-id="${p.id}" onclick="this.classList.toggle('on')">${esc(p.name)} <span style="font-size:11px;opacity:0.5;margin-left:auto">${p.role}</span></div>`).join('')}</div>`;
}
function getPeople() { return [...document.querySelectorAll('#ppk .ppl-item.on')].map(e=>e.dataset.id); }

/* ===== FORMS ===== */
function buildForm(type, id) {
  if (type==='person') return fPerson(id);
  if (type==='event') return fEvent(id);
  if (type==='meeting') return fMeeting(id);
  if (type==='task') return fTask(id);
  if (type==='reminder') return fReminder(id);
  if (type==='habit') return fHabit(id);
  if (type==='note') return fNote(id);
  return '';
}

function fPerson(id) {
  const p=id?DB.people.find(x=>x.id===id):null;
  return `
    <div class="form-group"><label class="form-label">Name *</label><input class="form-input" id="f-name" value="${esc(p?.name||'')}" placeholder="Full name"></div>
    <div class="form-group"><label class="form-label">Role</label><select class="form-select" id="f-role"><option value="student" ${p?.role==='student'?'selected':''}>Student</option><option value="teacher" ${p?.role==='teacher'?'selected':''}>Teacher / Advisor</option><option value="waitlist" ${p?.role==='waitlist'?'selected':''}>Waitlist</option></select></div>
    <div class="f2">
      <div class="form-group"><label class="form-label">School / Org</label><input class="form-input" id="f-school" value="${esc(p?.school||'')}"></div>
      <div class="form-group"><label class="form-label">Grade / Title</label><input class="form-input" id="f-grade" value="${esc(p?.grade||'')}" placeholder="11th grade"></div>
    </div>
    <div class="form-group"><label class="form-label">Contact</label><input class="form-input" id="f-contact" value="${esc(p?.contact||'')}" placeholder="email or @handle"></div>
    <div class="form-group"><label class="form-label">What they're building</label><input class="form-input" id="f-idea" value="${esc(p?.idea||'')}"></div>
    <div class="form-group"><label class="form-label">Last talked about</label><textarea class="form-textarea" id="f-last" style="min-height:60px">${esc(p?.lastTopic||'')}</textarea></div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="f-notes">${esc(p?.notes||'')}</textarea></div>
    <button class="full-btn" onclick="savePerson()">Save</button>
    ${id?`<button class="del-btn" onclick="delPerson('${id}')">Delete</button>`:''}`;
}

function fEvent(id) {
  const e=id?DB.events.find(x=>x.id===id):null;
  return `
    <div class="form-group"><label class="form-label">Title *</label><input class="form-input" id="f-title" value="${esc(e?.title||'')}"></div>
    <div class="form-group"><label class="form-label">Area</label>${areaPicker(e?.area||'consult')}</div>
    <div class="f2">
      <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date" value="${e?.date||todayStr()}"></div>
      <div class="form-group"><label class="form-label">Time</label><input class="form-input" id="f-time" type="time" value="${e?.time||''}"></div>
    </div>
    <div class="f2">
      <div class="form-group"><label class="form-label">End Time</label><input class="form-input" id="f-endtime" type="time" value="${e?.endTime||''}"></div>
      <div class="form-group"><label class="form-label">Location</label><input class="form-input" id="f-location" value="${esc(e?.location||'')}"></div>
    </div>
    <div class="form-group"><label class="form-label">Recurring</label>${recurPicker(e?.recur||'none')}</div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="f-notes" style="min-height:60px">${esc(e?.notes||'')}</textarea></div>
    <button class="full-btn" onclick="saveEvent()">Save Event</button>
    ${id?`<button class="del-btn" onclick="delEvent('${id}')">Delete</button>`:''}`;
}

function fMeeting(id) {
  const m=id?DB.meetings.find(x=>x.id===id):null;
  return `
    <div class="form-group"><label class="form-label">Title *</label><input class="form-input" id="f-title" value="${esc(m?.title||'')}" placeholder="e.g. Intro with Marcus"></div>
    <div class="form-group"><label class="form-label">Area</label>${areaPicker(m?.area||'we')}</div>
    <div class="f2">
      <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="f-date" type="date" value="${m?.date||todayStr()}"></div>
      <div class="form-group"><label class="form-label">Time</label><input class="form-input" id="f-time" type="time" value="${m?.time||''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Location / Link</label><input class="form-input" id="f-location" value="${esc(m?.location||'')}"></div>
    <div class="form-group"><label class="form-label">Who</label>${peoplePicker(m?.peopleIds||[])}</div>
    <div class="form-group"><label class="form-label">Agenda — what I want to get out of this</label><textarea class="form-textarea" id="f-agenda">${esc(m?.agenda||'')}</textarea></div>
    <div class="form-group"><label class="form-label">Notes / Follow-up</label><textarea class="form-textarea" id="f-notes">${esc(m?.notes||'')}</textarea></div>
    <button class="full-btn" onclick="saveMeeting()">Save Meeting</button>
    ${id?`<button class="del-btn" onclick="delMeeting('${id}')">Delete</button>`:''}`;
}

function fTask(id) {
  const t=id?DB.tasks.find(x=>x.id===id):null;
  return `
    <div class="form-group"><label class="form-label">Task *</label><input class="form-input" id="f-title" value="${esc(t?.title||'')}" placeholder="What needs to get done?"></div>
    <div class="form-group"><label class="form-label">Area</label>${areaPicker(t?.area||'consult')}</div>
    <div class="f2">
      <div class="form-group"><label class="form-label">Due Date</label><input class="form-input" id="f-date" type="date" value="${t?.date||''}"></div>
      <div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="f-pri"><option value="normal" ${!t?.priority||t?.priority==='normal'?'selected':''}>Normal</option><option value="high" ${t?.priority==='high'?'selected':''}>High</option></select></div>
    </div>
    <div class="form-group"><label class="form-label">Show on Home as Focus (Top 1–3)</label>
      <select class="form-select" id="f-top3"><option value="">Not a focus task</option><option value="1" ${t?.top3==1?'selected':''}>Priority 1 (most important)</option><option value="2" ${t?.top3==2?'selected':''}>Priority 2</option><option value="3" ${t?.top3==3?'selected':''}>Priority 3</option></select></div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="f-notes" style="min-height:60px">${esc(t?.notes||'')}</textarea></div>
    <button class="full-btn" onclick="saveTask()">Save Task</button>
    ${id?`<button class="del-btn" onclick="delTask('${id}')">Delete</button>`:''}`;
}

function fReminder(id) {
  const r=id?DB.reminders.find(x=>x.id===id):null;
  return `
    <div class="form-group"><label class="form-label">Reminder *</label><input class="form-input" id="f-text" value="${esc(r?.text||'')}" placeholder="What do you need to remember?"></div>
    <div class="form-group"><label class="form-label">Area</label>${areaPicker(r?.area||'consult')}</div>
    <div class="f2">
      <div class="form-group"><label class="form-label">Start / Due Date</label><input class="form-input" id="f-date" type="date" value="${r?.date||''}"></div>
      <div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="f-pri"><option value="normal" ${!r?.priority||r?.priority==='normal'?'selected':''}>Normal</option><option value="high" ${r?.priority==='high'?'selected':''}>High</option></select></div>
    </div>
    <div class="form-group"><label class="form-label">Recurring — fires every:</label>${recurPicker(r?.recur||'none')}</div>
    <div class="form-group"><label class="form-label">Link to person</label><select class="form-select" id="f-person"><option value="">— no one —</option>${DB.people.map(p=>`<option value="${p.id}" ${r?.personId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
    <button class="full-btn" onclick="saveReminder()">Save Reminder</button>
    ${id?`<button class="del-btn" onclick="delReminder('${id}')">Delete</button>`:''}`;
}

function fHabit(id) {
  const h=id?DB.habits.find(x=>x.id===id):null;
  return `
    <div class="form-group"><label class="form-label">Habit *</label><input class="form-input" id="f-name" value="${esc(h?.name||'')}" placeholder="e.g. Review notes, Morning prayer..."></div>
    <div class="form-group"><label class="form-label">Runs every:</label>${recurPicker(h?.recur||'daily')}</div>
    <div class="form-group"><label class="form-label">Icon / Emoji (optional)</label><input class="form-input" id="f-icon" value="${esc(h?.icon||'')}" placeholder="📚" style="max-width:80px"></div>
    <button class="full-btn" onclick="saveHabit()">Save Habit</button>
    ${id?`<button class="del-btn" onclick="delHabit('${id}')">Delete</button>`:''}`;
}

function fNote(id) {
  const n=id?DB.notes.find(x=>x.id===id):null;
  return `
    <div class="form-group"><label class="form-label">Title</label><input class="form-input" id="f-title" value="${esc(n?.title||'')}" placeholder="Optional title"></div>
    <div class="form-group"><label class="form-label">Note *</label><textarea class="form-textarea" id="f-body" style="min-height:140px">${esc(n?.body||'')}</textarea></div>
    <div class="form-group"><label class="form-label">Area</label>${areaPicker(n?.area||'we')}</div>
    <div class="form-group"><label class="form-label">Link to person</label><select class="form-select" id="f-person"><option value="">— no one —</option>${DB.people.map(p=>`<option value="${p.id}" ${n?.personId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
    <button class="full-btn" onclick="saveNote()">Save Note</button>
    ${id?`<button class="del-btn" onclick="delNote('${id}')">Delete</button>`:''}`;
}

/* ===== SAVE / DELETE ===== */
function savePerson() {
  const name=val('f-name'); if(!name){showToast('Name required');return;}
  const ex=_eid?DB.people.find(p=>p.id===_eid):null;
  const p={id:_eid||uid(),name,role:val('f-role')||'student',school:val('f-school'),grade:val('f-grade'),contact:val('f-contact'),idea:val('f-idea'),lastTopic:val('f-last'),notes:val('f-notes'),createdAt:ex?.createdAt||Date.now()};
  if(_eid){const i=DB.people.findIndex(x=>x.id===_eid);if(i!==-1)DB.people[i]=p;showToast('Updated');}
  else{DB.people.push(p);showToast('Person added');}
  save();closePanel();renderCurrentView();
}
function delPerson(id){if(!confirm('Delete?'))return;DB.people=DB.people.filter(p=>p.id!==id);save();closePanel();closeModal();renderCurrentView();showToast('Deleted');}

function saveEvent() {
  const title=val('f-title');if(!title){showToast('Title required');return;}
  const ex=_eid?DB.events.find(e=>e.id===_eid):null;
  const e={id:_eid||uid(),title,area:getArea(),date:val('f-date'),time:val('f-time'),endTime:val('f-endtime'),location:val('f-location'),recur:getRecur(),notes:val('f-notes'),createdAt:ex?.createdAt||Date.now()};
  if(_eid){const i=DB.events.findIndex(x=>x.id===_eid);if(i!==-1)DB.events[i]=e;showToast('Event updated');}
  else{DB.events.push(e);showToast('Event added');}
  save();closePanel();renderCurrentView();
}
function delEvent(id){if(!confirm('Delete?'))return;DB.events=DB.events.filter(e=>e.id!==id);save();closePanel();closeModal();renderCurrentView();showToast('Deleted');}

function saveMeeting() {
  const title=val('f-title');if(!title){showToast('Title required');return;}
  const ex=_eid?DB.meetings.find(m=>m.id===_eid):null;
  const m={id:_eid||uid(),title,area:getArea(),date:val('f-date'),time:val('f-time'),location:val('f-location'),peopleIds:getPeople(),agenda:val('f-agenda'),notes:val('f-notes'),createdAt:ex?.createdAt||Date.now()};
  if(_eid){const i=DB.meetings.findIndex(x=>x.id===_eid);if(i!==-1)DB.meetings[i]=m;showToast('Meeting updated');}
  else{DB.meetings.push(m);if(m.date)DB.events.push({id:uid(),title:m.title,area:m.area,date:m.date,time:m.time,endTime:'',location:m.location,recur:'none',notes:'',createdAt:Date.now(),_mtgRef:m.id});showToast('Meeting scheduled');}
  save();closePanel();renderCurrentView();
}
function delMeeting(id){if(!confirm('Delete?'))return;DB.meetings=DB.meetings.filter(m=>m.id!==id);save();closePanel();closeModal();renderCurrentView();showToast('Deleted');}

function saveTask() {
  const title=val('f-title');if(!title){showToast('Task required');return;}
  const ex=_eid?DB.tasks.find(t=>t.id===_eid):null;
  const t={id:_eid||uid(),title,area:getArea(),date:val('f-date'),priority:val('f-pri')||'normal',top3:val('f-top3')||'',notes:val('f-notes'),done:ex?.done||false,createdAt:ex?.createdAt||Date.now()};
  if(_eid){const i=DB.tasks.findIndex(x=>x.id===_eid);if(i!==-1)DB.tasks[i]=t;showToast('Updated');}
  else{DB.tasks.push(t);showToast('Task added');}
  save();closePanel();renderCurrentView();
}
function delTask(id){if(!confirm('Delete?'))return;DB.tasks=DB.tasks.filter(t=>t.id!==id);save();closePanel();closeModal();renderCurrentView();showToast('Deleted');}
function toggleTask(id){const t=DB.tasks.find(x=>x.id===id);if(t){t.done=!t.done;save();renderCurrentView();}}

function saveReminder() {
  const text=val('f-text');if(!text){showToast('Reminder text required');return;}
  const ex=_eid?DB.reminders.find(r=>r.id===_eid):null;
  const r={id:_eid||uid(),text,area:getArea(),date:val('f-date'),priority:val('f-pri')||'normal',recur:getRecur(),personId:val('f-person'),done:ex?.done||false,createdAt:ex?.createdAt||Date.now()};
  if(_eid){const i=DB.reminders.findIndex(x=>x.id===_eid);if(i!==-1)DB.reminders[i]=r;showToast('Updated');}
  else{DB.reminders.push(r);showToast('Reminder set');}
  save();closePanel();renderCurrentView();
}
function delReminder(id){if(!confirm('Delete?'))return;DB.reminders=DB.reminders.filter(r=>r.id!==id);save();closePanel();closeModal();renderCurrentView();showToast('Deleted');}
function toggleReminder(id){
  const r=DB.reminders.find(x=>x.id===id);if(!r)return;
  if(!r.recur||r.recur==='none'){r.done=!r.done;}
  else{const today=todayStr();if(!DB.habitLog[today])DB.habitLog[today]={};DB.habitLog[today]['rem_'+id]=!DB.habitLog[today]['rem_'+id];}
  save();renderCurrentView();
}

function saveHabit() {
  const name=val('f-name');if(!name){showToast('Habit name required');return;}
  const ex=_eid?DB.habits.find(h=>h.id===_eid):null;
  const h={id:_eid||uid(),name,icon:val('f-icon'),recur:getRecur()||'daily',createdAt:ex?.createdAt||Date.now()};
  if(_eid){const i=DB.habits.findIndex(x=>x.id===_eid);if(i!==-1)DB.habits[i]=h;showToast('Updated');}
  else{DB.habits.push(h);showToast('Habit added');}
  save();closePanel();renderCurrentView();
}
function delHabit(id){if(!confirm('Delete?'))return;DB.habits=DB.habits.filter(h=>h.id!==id);save();closePanel();renderCurrentView();showToast('Deleted');}
function toggleHabit(id){const today=todayStr();if(!DB.habitLog[today])DB.habitLog[today]={};DB.habitLog[today][id]=!DB.habitLog[today][id];save();renderCurrentView();}

function saveNote() {
  const body=val('f-body');if(!body){showToast('Note cannot be empty');return;}
  const ex=_eid?DB.notes.find(n=>n.id===_eid):null;
  const n={id:_eid||uid(),title:val('f-title'),body,area:getArea(),personId:val('f-person'),createdAt:ex?.createdAt||Date.now()};
  if(_eid){const i=DB.notes.findIndex(x=>x.id===_eid);if(i!==-1)DB.notes[i]=n;showToast('Updated');}
  else{DB.notes.push(n);showToast('Note saved');}
  save();closePanel();renderCurrentView();
}
function delNote(id){if(!confirm('Delete?'))return;DB.notes=DB.notes.filter(n=>n.id!==id);save();closePanel();closeModal();renderCurrentView();showToast('Deleted');}
