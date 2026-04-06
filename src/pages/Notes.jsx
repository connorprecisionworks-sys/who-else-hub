import { useState } from 'react'
import Panel, { Field, Input, Textarea, Select, SaveBtn, DelBtn, AreaPicker } from '../components/Panel'
import { formatDate, AREA_COLORS, AREA_LABELS } from '../store/useStore'
import styles from './Notes.module.css'

function NoteForm({ note, people, store, onClose }) {
  const [f, setF] = useState({
    title: note?.title || '',
    body: note?.body || '',
    area: note?.area || 'we',
    personId: note?.personId || '',
  })
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const save = () => {
    if (!f.body) return
    note ? store.updateNote(note.id, f) : store.addNote(f)
    onClose()
  }
  const del = () => { if (confirm('Delete?')) { store.deleteNote(note.id); onClose() } }
  return (
    <>
      <Field label="Title (optional)"><Input value={f.title} onChange={s('title')} placeholder="Note title" /></Field>
      <Field label="Note *"><Textarea value={f.body} onChange={s('body')} placeholder="Write anything…" style={{ minHeight: 160 }} /></Field>
      <Field label="Area"><AreaPicker value={f.area} onChange={v => setF(p => ({ ...p, area: v }))} /></Field>
      <Field label="Link to person">
        <Select value={f.personId} onChange={s('personId')}>
          <option value="">— no one —</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </Field>
      <SaveBtn onClick={save} />
      {note && <DelBtn onClick={del} />}
    </>
  )
}

export default function Notes({ store, panelOpen, panelId, onOpenPanel, onClosePanel }) {
  const notes = [...store.notes].sort((a, b) => b.createdAt - a.createdAt)
  const editNote = panelId ? store.notes.find(n => n.id === panelId) : null

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <h2 className={styles.title}>Notes</h2>
        <button className={styles.primaryBtn} onClick={() => onOpenPanel(null)}>+ Note</button>
      </div>

      {notes.length === 0 && <p style={{ color: 'var(--t3)', fontSize: 14, paddingTop: 20 }}>No notes yet.</p>}

      <div className={styles.grid}>
        {notes.map(n => {
          const person = n.personId ? store.people.find(p => p.id === n.personId) : null
          const c = AREA_COLORS[n.area]
          return (
            <div key={n.id} className={styles.card} onClick={() => onOpenPanel(n.id)}>
              {n.title && <div className={styles.cardTitle}>{n.title}</div>}
              <div className={styles.cardBody}>{n.body.slice(0, 220)}{n.body.length > 220 ? '…' : ''}</div>
              <div className={styles.cardFoot}>
                <span className={styles.cardDate}>{formatDate(new Date(n.createdAt).toISOString().split('T')[0])}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {n.area && c && (
                    <span className={styles.areaChip} style={{ background: c.bg, color: c.fg }}>{AREA_LABELS[n.area]}</span>
                  )}
                  {person && <span className={styles.personChip}>{person.name.split(' ')[0]}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Panel title={editNote ? 'Edit Note' : 'New Note'} open={panelOpen} onClose={onClosePanel}>
        <NoteForm note={editNote} people={store.people} store={store} onClose={onClosePanel} />
      </Panel>
    </div>
  )
}
