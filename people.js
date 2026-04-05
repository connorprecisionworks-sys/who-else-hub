/* ===== PEOPLE ===== */
let _pf='all';
function setPeopleFilter(f,btn){_pf=f;document.querySelectorAll('#ppl-segs .seg').forEach(e=>e.classList.remove('active'));if(btn)btn.classList.add('active');renderPeopleView();}
function filterPeople(q){renderPeopleView(q);}

function renderPeopleView(q) {
  q=q||document.getElementById('people-search')?.value||'';
  const el=document.getElementById('people-grid');if(!el)return;
  let people=[...DB.people];
  if(_pf!=='all')people=people.filter(p=>p.role===_pf);
  if(q)people=people.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())||p.school?.toLowerCase().includes(q.toLowerCase())||p.idea?.toLowerCase().includes(q.toLowerCase()));
  if(!people.length){el.innerHTML='<p style="color:var(--t3);font-size:14px;padding:20px 0">No people found.</p>';return;}
  el.innerHTML=people.map(p=>{
    const ini=p.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    const av=p.role==='teacher'?'av-t':p.role==='waitlist'?'av-w':'av-s';
    const mtgs=DB.meetings.filter(m=>(m.peopleIds||[]).includes(p.id)).length;
    return `<div class="person-card" onclick="showPersonDetail('${p.id}')">
      <div class="pc-top"><div class="pc-av ${av}">${ini}</div><div><div class="pc-name">${esc(p.name)}</div><div class="pc-meta">${p.role}${p.school?' · '+esc(p.school):''}${p.grade?' · '+esc(p.grade):''}</div></div></div>
      ${p.idea?`<div class="pc-idea">${esc(p.idea)}</div>`:''}
      ${p.lastTopic?`<div class="pc-last">Last: ${esc(p.lastTopic.slice(0,60))}${p.lastTopic.length>60?'…':''}</div>`:''}
      ${p.contact?`<div class="pc-contact">${esc(p.contact)}</div>`:''}
      <div class="pc-actions">
        <button class="outline-btn" style="font-size:12px;padding:5px 10px" onclick="event.stopPropagation();openPanel('person','${p.id}')">Edit</button>
        <button class="outline-btn" style="font-size:12px;padding:5px 10px" onclick="event.stopPropagation();openPanel('meeting')">+ Meeting</button>
        <span style="font-size:11px;color:var(--t3);margin-left:auto;align-self:center">${mtgs} mtg${mtgs!==1?'s':''}</span>
      </div>
    </div>`;
  }).join('');
}

function showPersonDetail(id) {
  const p=DB.people.find(x=>x.id===id);if(!p)return;
  const meetings=DB.meetings.filter(m=>(m.peopleIds||[]).includes(id));
  const notes=DB.notes.filter(n=>n.personId===id);
  openModal(p.name,`
    <div class="det-s"><div class="det-l">Role</div><div class="det-v">${p.role}${p.grade?' · '+esc(p.grade):''}</div></div>
    ${p.school?`<div class="det-s"><div class="det-l">School / Org</div><div class="det-v">${esc(p.school)}</div></div>`:''}
    ${p.contact?`<div class="det-s"><div class="det-l">Contact</div><div class="det-v">${esc(p.contact)}</div></div>`:''}
    ${p.idea?`<div class="det-s"><div class="det-l">Building</div><div class="det-v">${esc(p.idea)}</div></div>`:''}
    ${p.lastTopic?`<div class="det-s"><div class="det-l">Last talked about</div><div class="det-v">${esc(p.lastTopic)}</div></div>`:''}
    ${p.notes?`<div class="det-s"><div class="det-l">Notes</div><div class="det-v">${esc(p.notes)}</div></div>`:''}
    ${meetings.length?`<div class="det-s"><div class="det-l">Meetings (${meetings.length})</div><div class="tag-row">${meetings.map(m=>`<span class="tag">${esc(m.title)}${m.date?' · '+formatDateShort(m.date):''}</span>`).join('')}</div></div>`:''}
    ${notes.length?`<div class="det-s"><div class="det-l">Notes (${notes.length})</div>${notes.map(n=>`<div style="font-size:13px;padding:6px 0;border-bottom:1px solid var(--border)">${n.title?`<strong>${esc(n.title)}</strong><br>`:''}${esc(n.body.slice(0,100))}…</div>`).join('')}</div>`:''}
    <div class="det-actions">
      <button class="outline-btn" onclick="closeModal();openPanel('person','${id}')">Edit</button>
      <button class="outline-btn" onclick="closeModal();openPanel('meeting')">+ Meeting</button>
      <button class="outline-btn" onclick="closeModal();openPanel('note')">+ Note</button>
    </div>
  `);
}

/* ===== MEETINGS ===== */
let _mf='upcoming';
function setMeetingFilter(f,btn){_mf=f;document.querySelectorAll('#mtg-segs .seg').forEach(e=>e.classList.remove('active'));if(btn)btn.classList.add('active');renderMeetingsView();}

function renderMeetingsView() {
  const el=document.getElementById('meetings-list');if(!el)return;
  const today=todayStr();
  let m=[...DB.meetings].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  if(_mf==='upcoming')m=m.filter(x=>!x.date||x.date>=today);
  else if(_mf==='past')m=m.filter(x=>x.date&&x.date<today);
  if(!m.length){el.innerHTML='<p style="color:var(--t3);font-size:14px;padding:20px 0">No meetings here.</p>';return;}
  el.innerHTML=m.map(mtg=>{
    const people=DB.people.filter(p=>(mtg.peopleIds||[]).includes(p.id));
    const up=mtg.date&&isUpcoming(mtg.date);
    let mo='',dy='';
    if(mtg.date){const d=new Date(mtg.date+'T12:00:00');mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];dy=d.getDate();}
    return `<div class="mtg-row" onclick="showMeetingDetail('${mtg.id}')">
      ${mtg.date?`<div class="mtg-date"><div class="mtg-month">${mo}</div><div class="mtg-day">${dy}</div></div>`:''}
      <div class="mtg-info">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
          <div style="width:7px;height:7px;border-radius:50%;background:${areaMid(mtg.area)};flex-shrink:0"></div>
          <div class="mtg-title">${esc(mtg.title)}</div>
          ${up?'<span class="upcoming-pip">Upcoming</span>':''}
        </div>
        <div class="mtg-sub">${mtg.time?mtg.time+' · ':''}${mtg.location?esc(mtg.location):'No location'}</div>
        ${people.length?`<div class="mtg-ppl">${people.map(p=>`<span class="mtg-tag">${esc(p.name.split(' ')[0])}</span>`).join('')}</div>`:''}
        ${mtg.agenda?`<div style="font-size:12px;color:var(--t3);margin-top:6px">${esc(mtg.agenda.slice(0,80))}${mtg.agenda.length>80?'…':''}</div>`:''}
      </div>
    </div>`;
  }).join('');
}

function showMeetingDetail(id) {
  const m=DB.meetings.find(x=>x.id===id);if(!m)return;
  const people=DB.people.filter(p=>(m.peopleIds||[]).includes(p.id));
  openModal(m.title,`
    ${m.date?`<div class="det-s"><div class="det-l">When</div><div class="det-v">${formatDate(m.date)}${m.time?' at '+m.time:''}</div></div>`:''}
    ${m.location?`<div class="det-s"><div class="det-l">Where</div><div class="det-v">${esc(m.location)}</div></div>`:''}
    ${people.length?`<div class="det-s"><div class="det-l">Who</div><div class="tag-row">${people.map(p=>`<span class="tag">${esc(p.name)}</span>`).join('')}</div></div>`:''}
    ${m.agenda?`<div class="det-s"><div class="det-l">Goals</div><div class="det-v">${esc(m.agenda)}</div></div>`:''}
    ${m.notes?`<div class="det-s"><div class="det-l">Notes</div><div class="det-v">${esc(m.notes)}</div></div>`:''}
    <div class="det-actions"><button class="outline-btn" onclick="closeModal();openPanel('meeting','${id}')">Edit</button><button class="del-btn" style="width:auto;margin:0" onclick="delMeeting('${id}')">Delete</button></div>
  `);
}

/* ===== TASKS ===== */
let _tf='active';
function setTaskFilter(f,btn){_tf=f;document.querySelectorAll('#task-segs .seg').forEach(e=>e.classList.remove('active'));if(btn)btn.classList.add('active');renderTasksView();}

function renderTasksView() {
  const el=document.getElementById('tasks-list');if(!el)return;
  const today=todayStr();
  let tasks=[...DB.tasks];
  if(_tf==='active')tasks=tasks.filter(t=>!t.done);
  else if(_tf==='today')tasks=tasks.filter(t=>!t.done&&t.date===today);
  else if(_tf==='overdue')tasks=tasks.filter(t=>!t.done&&t.date&&isPast(t.date));
  else if(_tf==='done')tasks=tasks.filter(t=>t.done);
  tasks.sort((a,b)=>{
    if(a.priority==='high'&&b.priority!=='high')return -1;
    if(b.priority==='high'&&a.priority!=='high')return 1;
    if(a.top3&&!b.top3)return -1;
    if(b.top3&&!a.top3)return 1;
    return(a.date||'9999').localeCompare(b.date||'9999');
  });
  let reminders=[...DB.reminders];
  if(_tf==='active')reminders=reminders.filter(r=>!r.done);
  else if(_tf==='overdue')reminders=reminders.filter(r=>!r.done&&r.date&&isPast(r.date)&&(!r.recur||r.recur==='none'));
  else if(_tf==='done')reminders=reminders.filter(r=>r.done&&(!r.recur||r.recur==='none'));
  else reminders=[];

  let html='';
  if(tasks.length){
    html+=`<div class="sec-lbl">Tasks (${tasks.length})</div>`;
    html+=tasks.map(t=>{
      const late=t.date&&isPast(t.date)&&!t.done;
      return `<div class="task-row ${t.priority==='high'?'t-high':''}">
        <div class="t-cb ${t.done?'done':''}" onclick="toggleTask('${t.id}')"></div>
        <div class="t-body">
          <div class="t-title ${t.done?'done':''}">${esc(t.title)}</div>
          <div class="t-meta">
            ${t.date?`<span class="t-due ${late&&!t.done?'late':''}">${late&&!t.done?'⚠ Overdue · ':''}${formatDate(t.date)}</span>`:''}
            ${t.area?`<span class="t-area" style="background:${areaBg(t.area)};color:${areaFg(t.area)}">${areaLabel(t.area)}</span>`:''}
            ${t.top3?`<span class="t-top">Top ${t.top3}</span>`:''}
          </div>
        </div>
        <button class="icon-btn" onclick="openPanel('task','${t.id}')">✎</button>
      </div>`;
    }).join('');
  }
  if(reminders.length&&_tf!=='today'){
    html+=`<div class="sec-lbl" style="margin-top:8px">Reminders (${reminders.length})</div>`;
    html+=reminders.map(r=>{
      const late=r.date&&isPast(r.date)&&!r.done&&(!r.recur||r.recur==='none');
      return `<div class="task-row">
        <input type="checkbox" style="width:15px;height:15px;margin-top:3px;flex-shrink:0;accent-color:var(--accent);cursor:pointer" ${r.done?'checked':''} onchange="toggleReminder('${r.id}')">
        <div class="t-body">
          <div class="t-title ${r.done?'done':''}">${esc(r.text)}</div>
          <div class="t-meta">
            ${r.date&&(!r.recur||r.recur==='none')?`<span class="t-due ${late?'late':''}">${late?'⚠ ':''} ${formatDate(r.date)}</span>`:''}
            ${r.recur&&r.recur!=='none'?`<span class="t-recur">↻ ${r.recur}</span>`:''}
            ${r.area?`<span class="t-area" style="background:${areaBg(r.area)};color:${areaFg(r.area)}">${areaLabel(r.area)}</span>`:''}
          </div>
        </div>
        <button class="icon-btn" onclick="openPanel('reminder','${r.id}')">✎</button>
      </div>`;
    }).join('');
  }
  if(!tasks.length&&!reminders.length) html='<p style="color:var(--t3);font-size:14px;padding:20px 0">Nothing here. Add a task or reminder above.</p>';
  el.innerHTML=html;
}

/* ===== NOTES ===== */
function renderNotesView() {
  const el=document.getElementById('notes-grid');if(!el)return;
  const notes=[...DB.notes].sort((a,b)=>b.createdAt-a.createdAt);
  if(!notes.length){el.innerHTML='<p style="color:var(--t3);font-size:14px;padding:20px 0">No notes yet.</p>';return;}
  el.innerHTML=notes.map(n=>{
    const person=n.personId?DB.people.find(p=>p.id===n.personId):null;
    return `<div class="note-card" onclick="openPanel('note','${n.id}')">
      ${n.title?`<div class="note-title">${esc(n.title)}</div>`:''}
      <div class="note-body">${esc(n.body.slice(0,200))}${n.body.length>200?'…':''}</div>
      <div class="note-foot">
        <span class="note-date">${formatDate(new Date(n.createdAt).toISOString().split('T')[0])}</span>
        ${n.area?`<span style="font-size:10px;padding:2px 7px;border-radius:10px;background:${areaBg(n.area)};color:${areaFg(n.area)}">${areaLabel(n.area)}</span>`:''}
        ${person?`<span style="font-size:11px;color:var(--t3)">${esc(person.name.split(' ')[0])}</span>`:''}
      </div>
    </div>`;
  }).join('');
}

/* ===== PORTFOLIO ===== */
function renderPortfolio() {
  const p=DB.portfolio;
  const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  s('p-name',p.name);s('p-tagline',p.tagline);s('p-powered',p.powered);
  s('p-question',p.question);s('p-question-sub',p.questionSub);
  s('p-mission',p.mission);s('p-infra',p.infra);
  s('p-teachers-msg',p.teachersMsg);s('p-email',p.email);
  const oe=document.getElementById('p-offers');if(oe)oe.innerHTML=p.offers.map(o=>`<li>${esc(o)}</li>`).join('');
  const we=document.getElementById('p-who');if(we)we.innerHTML=p.who.map(o=>`<li>${esc(o)}</li>`).join('');
  s('p-students',DB.people.filter(x=>x.role==='student').length);
  s('p-teachers-c',DB.people.filter(x=>x.role==='teacher').length);
  s('p-waitlist-c',DB.people.filter(x=>x.role==='waitlist').length);
  s('p-meetings-c',DB.meetings.length);
}
function openPortfolioEditor() {
  const p=DB.portfolio;
  openModal('Edit Pitch Page',`
    <div class="form-group"><label class="form-label">Club Name</label><input class="form-input" id="pe-name" value="${esc(p.name)}"></div>
    <div class="form-group"><label class="form-label">Tagline</label><input class="form-input" id="pe-tagline" value="${esc(p.tagline)}"></div>
    <div class="form-group"><label class="form-label">Powered By</label><input class="form-input" id="pe-powered" value="${esc(p.powered)}"></div>
    <div class="form-group"><label class="form-label">The Question</label><input class="form-input" id="pe-question" value="${esc(p.question)}"></div>
    <div class="form-group"><label class="form-label">Question sub-text</label><textarea class="form-textarea" id="pe-qsub">${esc(p.questionSub)}</textarea></div>
    <div class="form-group"><label class="form-label">Mission paragraph</label><textarea class="form-textarea" id="pe-mission">${esc(p.mission)}</textarea></div>
    <div class="form-group"><label class="form-label">Infrastructure paragraph</label><textarea class="form-textarea" id="pe-infra">${esc(p.infra)}</textarea></div>
    <div class="form-group"><label class="form-label">What Members Get (one per line)</label><textarea class="form-textarea" id="pe-offers">${p.offers.map(esc).join('\n')}</textarea></div>
    <div class="form-group"><label class="form-label">Who Should Join (one per line)</label><textarea class="form-textarea" id="pe-who">${p.who.map(esc).join('\n')}</textarea></div>
    <div class="form-group"><label class="form-label">Teachers message</label><textarea class="form-textarea" id="pe-teachers">${esc(p.teachersMsg)}</textarea></div>
    <div class="form-group"><label class="form-label">Contact Email</label><input class="form-input" id="pe-email" value="${esc(p.email)}"></div>
    <button class="full-btn" onclick="savePortfolio()">Save</button>
  `);
}
function savePortfolio(){
  DB.portfolio={name:val('pe-name')||DB.portfolio.name,tagline:val('pe-tagline')||DB.portfolio.tagline,powered:val('pe-powered')||DB.portfolio.powered,question:val('pe-question')||DB.portfolio.question,questionSub:document.getElementById('pe-qsub')?.value||DB.portfolio.questionSub,mission:document.getElementById('pe-mission')?.value||DB.portfolio.mission,infra:document.getElementById('pe-infra')?.value||DB.portfolio.infra,offers:(document.getElementById('pe-offers')?.value||'').split('\n').map(s=>s.trim()).filter(Boolean),who:(document.getElementById('pe-who')?.value||'').split('\n').map(s=>s.trim()).filter(Boolean),teachersMsg:document.getElementById('pe-teachers')?.value||DB.portfolio.teachersMsg,email:val('pe-email')||DB.portfolio.email};
  save();closeModal();renderPortfolio();showToast('Pitch page updated');
}
function openWaitlistModal(){
  openModal('Join the Waitlist',`
    <div class="form-group"><label class="form-label">Name *</label><input class="form-input" id="wl-name" placeholder="Full name"></div>
    <div class="form-group"><label class="form-label">Role</label><select class="form-select" id="wl-role"><option value="student">Student — I have an idea</option><option value="teacher">Teacher / Advisor</option><option value="parent">Parent</option><option value="mentor">Mentor / Investor</option></select></div>
    <div class="f2">
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="wl-email" type="email" placeholder="you@email.com"></div>
      <div class="form-group"><label class="form-label">School / Org</label><input class="form-input" id="wl-school"></div>
    </div>
    <div class="form-group"><label class="form-label">What are you building / interested in?</label><textarea class="form-textarea" id="wl-idea" style="min-height:60px"></textarea></div>
    <button class="full-btn" onclick="saveWaitlist()">Submit →</button>
  `);
}
function saveWaitlist(){
  const name=val('wl-name');if(!name){showToast('Name required');return;}
  DB.people.push({id:uid(),name,role:'waitlist',contact:val('wl-email'),school:val('wl-school'),idea:val('wl-idea'),grade:val('wl-role'),lastTopic:'',notes:'Added via waitlist form',createdAt:Date.now()});
  save();closeModal();showToast('Added to waitlist!');
}
