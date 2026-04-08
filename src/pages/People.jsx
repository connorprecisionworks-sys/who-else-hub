import { useState } from 'react'
import Panel, { Field, Input, Textarea, Select, Row, SaveBtn, DelBtn, AreaPicker } from '../components/Panel'
import { uid, formatDateShort, AREA_COLORS, AREA_LABELS } from '../store/useStore'
import styles from './People.module.css'

function PersonForm({ person, people, meetings, notes, store, onClose }) {
  const isEdit = !!person
  const [saved, setSaved] = useState(false)
  const [f, setF] = useState(() => {
    if (!person) return { name: '', role: 'student', school: '', grade: '', contact: '', idea: '', lastTopic: '', notes: '' }
    return {
      name: person.name || '', role: person.role || 'student',
      school: person.school || '', grade: person.grade || '',
      contact: person.contact || '', idea: person.idea || '',
      lastTopic: person.lastTopic || '', notes: person.notes || '',
    }
  })
  const s = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }))

  const save = () => {
    if (!f.name) return
    if (isEdit) {
      store.updatePerson(person.id, { ...person, ...f })
    } else {
      store.addPerson(f)
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 600)
  }
  const del = () => { if (confirm('Delete?')) { store.deletePerson(person.id); onClose() } }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault()
      const inputs = e.target.closest('form, [role="form"], aside')?.querySelectorAll('input, select, textarea')
      if (inputs) {
        const arr = Array.from(inputs)
        const idx = arr.indexOf(e.target)
        if (idx < arr.length - 1) arr[idx + 1].focus()
        else save()
      }
    }
  }

  const personMeetings = isEdit ? meetings.filter(m => (m.peopleIds || []).includes(person.id)) : []

  return (
    <div onKeyDown={handleKeyDown}>
      <Field label="Name *"><Input value={f.name} onChange={s('name')} placeholder="Full name" autoFocus={!isEdit} /></Field>
      <Field label="Role">
        <Select value={f.role} onChange={s('role')}>
          <option value="student">Student</option>
          <option value="teacher">Teacher / Advisor</option>
          <option value="waitlist">Waitlist</option>
        </Select>
      </Field>
      <Row>
        <Field label="School / Org"><Input value={f.school} onChange={s('school')} /></Field>
        <Field label="Grade / Title"><Input value={f.grade} onChange={s('grade')} placeholder="11th grade" /></Field>
      </Row>
      <Field label="Contact"><Input value={f.contact} onChange={s('contact')} placeholder="email or @handle" /></Field>
      <Field label="What they're building"><Input value={f.idea} onChange={s('idea')} /></Field>
      <Field label="Last talked about"><Textarea value={f.lastTopic} onChange={s('lastTopic')} style={{ minHeight: 60 }} /></Field>
      <Field label="Notes"><Textarea value={f.notes} onChange={s('notes')} /></Field>
      {isEdit && personMeetings.length > 0 && (
        <Field label={`Meetings (${personMeetings.length})`}>
          <div className={styles.detailTags}>{personMeetings.map(m => <span key={m.id} className={styles.tag}>{m.title}{m.date ? ' · ' + formatDateShort(m.date) : ''}</span>)}</div>
        </Field>
      )}
      {saved
        ? <div style={{ padding: '8px 0', color: '#166534', fontSize: 13, fontFamily: "'DM Mono', monospace" }}>Saved</div>
        : <SaveBtn onClick={save} />
      }
      {isEdit && !saved && <DelBtn onClick={del} />}
    </div>
  )
}

const SORT_KEY = 'we_hub_people_sort'

export default function People({ store, panelOpen, panelId, onClosePanel }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState(() => {
    try { return localStorage.getItem(SORT_KEY) || 'newest' } catch { return 'newest' }
  })

  const changeSort = (s) => {
    setSort(s)
    try { localStorage.setItem(SORT_KEY, s) } catch {}
  }

  let people = [...store.people]
  if (filter !== 'all') people = people.filter(p => p.role === filter)
  if (search) people = people.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.school?.toLowerCase().includes(search.toLowerCase())
  )

  if (sort === 'az') people.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort === 'za') people.sort((a, b) => b.name.localeCompare(a.name))
  else if (sort === 'newest') people.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  else if (sort === 'oldest') people.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  else if (sort === 'role') people.sort((a, b) => (a.role || '').localeCompare(b.role || ''))

  const editPerson = panelId ? store.people.find(p => p.id === panelId) : null

  const initials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const avClass = (role) => role === 'teacher' ? styles.avT : role === 'waitlist' ? styles.avW : styles.avS

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <h2 className={styles.title}>People</h2>
        <div className={styles.barRight}>
          <input className={styles.search} type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          <button className={styles.primaryBtn} onClick={() => onClosePanel(null, true)}>+ Add</button>
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.segs}>
          {['all','student','teacher','waitlist'].map(f => (
            <button key={f} className={`${styles.seg} ${filter === f ? styles.segActive : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'student' ? 'Students' : f === 'teacher' ? 'Teachers' : 'Waitlist'}
            </button>
          ))}
        </div>
        <select className={styles.sortSelect} value={sort} onChange={e => changeSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="az">Name A–Z</option>
          <option value="za">Name Z–A</option>
          <option value="role">By role</option>
        </select>
      </div>

      <div className={styles.grid}>
        {people.length === 0 && <p style={{ color: 'var(--t3)', fontSize: 14 }}>No people found.</p>}
        {people.map(p => {
          const mtgs = store.meetings.filter(m => (m.peopleIds || []).includes(p.id)).length
          return (
            <div key={p.id} className={styles.card} onClick={() => onClosePanel(p.id, true)}>
              <div className={styles.cardTop}>
                <div className={`${styles.av} ${avClass(p.role)}`}>{initials(p.name)}</div>
                <div>
                  <div className={styles.cardName}>{p.name}</div>
                  <div className={styles.cardMeta}>{p.role}{p.school ? ' · ' + p.school : ''}{p.grade ? ' · ' + p.grade : ''}</div>
                </div>
              </div>
              {p.idea && <div className={styles.cardIdea}>{p.idea}</div>}
              {p.lastTopic && <div className={styles.cardLast}>Last: {p.lastTopic.slice(0, 60)}{p.lastTopic.length > 60 ? '…' : ''}</div>}
              {p.contact && <div className={styles.cardContact}>{p.contact}</div>}
              <div className={styles.cardActions}>
                <button className={styles.outlineBtn} onClick={e => { e.stopPropagation(); onClosePanel(p.id, true) }}>Edit</button>
                <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto', alignSelf: 'center' }}>{mtgs} mtg{mtgs !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )
        })}
      </div>

      <Panel title={editPerson ? editPerson.name : 'Add Person'} open={panelOpen} onClose={() => onClosePanel(null, false)}>
        <PersonForm
          person={editPerson}
          people={store.people}
          meetings={store.meetings}
          notes={store.notes}
          store={store}
          onClose={() => onClosePanel(null, false)}
        />
      </Panel>
    </div>
  )
}
