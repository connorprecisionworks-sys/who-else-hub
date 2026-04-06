// pages/Meetings.jsx
import { useState } from 'react'
import Panel, { Field, Input, Textarea, Select, Row, SaveBtn, DelBtn, AreaPicker, PeoplePicker } from '../components/Panel'
import { formatDate, formatDateShort, isUpcoming, AREA_COLORS } from '../store/useStore'
import styles from './Meetings.module.css'

function MeetingForm({ meeting, people, store, onClose }) {
  const [f, setF] = useState({
    title: meeting?.title || '', area: meeting?.area || 'we',
    date: meeting?.date || '', time: meeting?.time || '',
    location: meeting?.location || '', peopleIds: meeting?.peopleIds || [],
    agenda: meeting?.agenda || '', notes: meeting?.notes || '',
  })
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const save = () => {
    if (!f.title) return
    meeting ? store.updateMeeting(meeting.id, f) : store.addMeeting(f)
    onClose()
  }
  const del = () => { if (confirm('Delete?')) { store.deleteMeeting(meeting.id); onClose() } }
  return (
    <>
      <Field label="Title *"><Input value={f.title} onChange={s('title')} placeholder="e.g. Intro with Marcus" /></Field>
      <Field label="Area"><AreaPicker value={f.area} onChange={v => setF(p => ({ ...p, area: v }))} /></Field>
      <Row>
        <Field label="Date"><Input type="date" value={f.date} onChange={s('date')} /></Field>
        <Field label="Time"><Input type="time" value={f.time} onChange={s('time')} /></Field>
      </Row>
      <Field label="Location / Link"><Input value={f.location} onChange={s('location')} placeholder="Classroom, Zoom…" /></Field>
      <Field label="Who">
        <PeoplePicker people={people} value={f.peopleIds} onChange={v => setF(p => ({ ...p, peopleIds: v }))} />
      </Field>
      <Field label="What I want to get out of this meeting"><Textarea value={f.agenda} onChange={s('agenda')} /></Field>
      <Field label="Notes / Follow-up"><Textarea value={f.notes} onChange={s('notes')} /></Field>
      <SaveBtn onClick={save} />
      {meeting && <DelBtn onClick={del} />}
    </>
  )
}

export default function Meetings({ store, panelOpen, panelId, onOpenPanel, onClosePanel }) {
  const [filter, setFilter] = useState('upcoming')
  const today = new Date().toISOString().split('T')[0]
  const editMeeting = panelId ? store.meetings.find(m => m.id === panelId) : null

  let meetings = [...store.meetings].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  if (filter === 'upcoming') meetings = meetings.filter(m => !m.date || m.date >= today)
  else if (filter === 'past') meetings = meetings.filter(m => m.date && m.date < today)

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <h2 className={styles.title}>Meetings</h2>
        <button className={styles.primaryBtn} onClick={() => onOpenPanel(null)}>+ Schedule</button>
      </div>
      <div className={styles.segs}>
        {['upcoming','all','past'].map(f => (
          <button key={f} className={`${styles.seg} ${filter === f ? styles.segActive : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {meetings.length === 0 && <p style={{ color: 'var(--t3)', fontSize: 14, paddingTop: 20 }}>No meetings here.</p>}
      {meetings.map(m => {
        const people = store.people.filter(p => (m.peopleIds || []).includes(p.id))
        const up = m.date && isUpcoming(m.date)
        let mo = '', dy = ''
        if (m.date) { const d = new Date(m.date + 'T12:00:00'); mo = MONTHS[d.getMonth()]; dy = d.getDate() }
        const c = AREA_COLORS[m.area]
        return (
          <div key={m.id} className={styles.row} onClick={() => onOpenPanel(m.id)}>
            {m.date && <div className={styles.dateCol}><div className={styles.mo}>{mo}</div><div className={styles.dy}>{dy}</div></div>}
            <div className={styles.info}>
              <div className={styles.infoTop}>
                <div className={styles.dot} style={{ background: c?.mid || 'var(--border2)' }} />
                <div className={styles.rowTitle}>{m.title}</div>
                {up && <span className={styles.upBadge}>Upcoming</span>}
              </div>
              <div className={styles.sub}>{m.time ? m.time + ' · ' : ''}{m.location || 'No location'}</div>
              {people.length > 0 && (
                <div className={styles.tags}>{people.map(p => <span key={p.id} className={styles.tag}>{p.name.split(' ')[0]}</span>)}</div>
              )}
              {m.agenda && <div className={styles.agenda}>{m.agenda.slice(0, 80)}{m.agenda.length > 80 ? '…' : ''}</div>}
            </div>
          </div>
        )
      })}

      <Panel title={editMeeting ? 'Edit Meeting' : 'Schedule Meeting'} open={panelOpen} onClose={onClosePanel}>
        <MeetingForm meeting={editMeeting} people={store.people} store={store} onClose={onClosePanel} />
      </Panel>
    </div>
  )
}
