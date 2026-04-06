import { useEffect } from 'react'
import styles from './Panel.module.css'

export default function Panel({ title, open, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} />}
      <aside className={`${styles.panel} ${open ? styles.open : ''}`}>
        <div className={styles.head}>
          <span className={styles.title}>{title}</span>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>{children}</div>
      </aside>
    </>
  )
}

// Reusable form field components
export function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  )
}

export function Input({ ...props }) {
  return <input className={styles.input} {...props} />
}

export function Textarea({ ...props }) {
  return <textarea className={styles.textarea} {...props} />
}

export function Select({ children, ...props }) {
  return <select className={styles.select} {...props}>{children}</select>
}

export function Row({ children }) {
  return <div className={styles.row}>{children}</div>
}

export function SaveBtn({ onClick, children = 'Save' }) {
  return <button className={styles.saveBtn} onClick={onClick}>{children}</button>
}

export function DelBtn({ onClick }) {
  return <button className={styles.delBtn} onClick={onClick}>Delete</button>
}

export function AreaPicker({ value, onChange }) {
  const areas = [
    { k: 'we', l: 'Who Else', bg: 'var(--we-s)', fg: 'var(--we-d)' },
    { k: 'consult', l: 'Consulting', bg: 'var(--cn-s)', fg: 'var(--cn-d)' },
    { k: 'personal', l: 'Personal', bg: 'var(--pe-s)', fg: 'var(--pe-d)' },
    { k: 'content', l: 'Content', bg: 'var(--co-s)', fg: 'var(--co-d)' },
    { k: 'finance', l: 'Finance', bg: 'var(--fi-s)', fg: 'var(--fi-d)' },
  ]
  return (
    <div className={styles.chips}>
      {areas.map(a => (
        <button
          key={a.k}
          type="button"
          className={`${styles.chip} ${value === a.k ? styles.chipActive : ''}`}
          style={{ background: a.bg, color: a.fg, borderColor: value === a.k ? a.fg : 'transparent' }}
          onClick={() => onChange(a.k)}
        >{a.l}</button>
      ))}
    </div>
  )
}

export function RecurPicker({ value, onChange }) {
  const opts = [
    { k: 'none', l: 'Once' }, { k: 'daily', l: 'Daily' }, { k: 'weekday', l: 'Weekdays' },
    { k: 'weekly', l: 'Weekly' }, { k: 'biweekly', l: 'Biweekly' }, { k: 'monthly', l: 'Monthly' },
    { k: 'mon', l: 'Mon' }, { k: 'tue', l: 'Tue' }, { k: 'wed', l: 'Wed' },
    { k: 'thu', l: 'Thu' }, { k: 'fri', l: 'Fri' },
  ]
  return (
    <div className={styles.chips}>
      {opts.map(o => (
        <button
          key={o.k}
          type="button"
          className={`${styles.recurChip} ${value === o.k ? styles.recurChipActive : ''}`}
          onClick={() => onChange(o.k)}
        >{o.l}</button>
      ))}
    </div>
  )
}

export function PeoplePicker({ people, value = [], onChange }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id])
  if (!people.length) return <p style={{ fontSize: 13, color: 'var(--t3)', padding: '4px 0' }}>No people added yet.</p>
  return (
    <div className={styles.peoplePick}>
      {people.map(p => {
        const on = value.includes(p.id)
        return (
          <div
            key={p.id}
            className={`${styles.personPickItem} ${on ? styles.personPickOn : ''}`}
            onClick={() => toggle(p.id)}
          >
            <span className={styles.pickAv}>{p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
            {p.name}
            <span style={{ fontSize: 11, opacity: 0.5, marginLeft: 'auto' }}>{p.role}</span>
          </div>
        )
      })}
    </div>
  )
}
