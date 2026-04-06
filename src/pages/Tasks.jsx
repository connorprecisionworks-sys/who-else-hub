import { useState } from 'react'
import Panel, { Field, Input, Textarea, Select, Row, SaveBtn, DelBtn, AreaPicker, RecurPicker } from '../components/Panel'
import { formatDate, isPast, AREA_COLORS, AREA_LABELS } from '../store/useStore'
import styles from './Tasks.module.css'

function TaskForm({ task, store, onClose }) {
  const [f, setF] = useState({
    title: task?.title || '', area: task?.area || 'consult',
    date: task?.date || '', priority: task?.priority || 'normal',
    top3: task?.top3 || '', notes: task?.notes || '',
  })
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const save = () => {
    if (!f.title) return
    task ? store.updateTask(task.id, f) : store.addTask(f)
    onClose()
  }
  const del = () => { if (confirm('Delete?')) { store.deleteTask(task.id); onClose() } }
  return (
    <>
      <Field label="Task *"><Input value={f.title} onChange={s('title')} placeholder="What needs to get done?" /></Field>
      <Field label="Area"><AreaPicker value={f.area} onChange={v => setF(p => ({ ...p, area: v }))} /></Field>
      <Row>
        <Field label="Due Date"><Input type="date" value={f.date} onChange={s('date')} /></Field>
        <Field label="Priority"><Select value={f.priority} onChange={s('priority')}><option value="normal">Normal</option><option value="high">High</option></Select></Field>
      </Row>
      <Field label="Show on Home (Focus)">
        <Select value={f.top3} onChange={s('top3')}>
          <option value="">Not a focus task</option>
          <option value="1">Priority 1 — most important</option>
          <option value="2">Priority 2</option>
          <option value="3">Priority 3</option>
        </Select>
      </Field>
      <Field label="Notes"><Textarea value={f.notes} onChange={s('notes')} style={{ minHeight: 60 }} /></Field>
      <SaveBtn onClick={save} />
      {task && <DelBtn onClick={del} />}
    </>
  )
}

function ReminderForm({ reminder, people, store, onClose }) {
  const [f, setF] = useState({
    text: reminder?.text || '', area: reminder?.area || 'consult',
    date: reminder?.date || '', priority: reminder?.priority || 'normal',
    recur: reminder?.recur || 'none', personId: reminder?.personId || '',
  })
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const save = () => {
    if (!f.text) return
    reminder ? store.updateReminder(reminder.id, f) : store.addReminder(f)
    onClose()
  }
  const del = () => { if (confirm('Delete?')) { store.deleteReminder(reminder.id); onClose() } }
  return (
    <>
      <Field label="Reminder *"><Input value={f.text} onChange={s('text')} placeholder="What do you need to remember?" /></Field>
      <Field label="Area"><AreaPicker value={f.area} onChange={v => setF(p => ({ ...p, area: v }))} /></Field>
      <Row>
        <Field label="Date"><Input type="date" value={f.date} onChange={s('date')} /></Field>
        <Field label="Priority"><Select value={f.priority} onChange={s('priority')}><option value="normal">Normal</option><option value="high">High</option></Select></Field>
      </Row>
      <Field label="Recurring"><RecurPicker value={f.recur} onChange={v => setF(p => ({ ...p, recur: v }))} /></Field>
      <Field label="Link to person">
        <Select value={f.personId} onChange={s('personId')}>
          <option value="">— no one —</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </Field>
      <SaveBtn onClick={save} />
      {reminder && <DelBtn onClick={del} />}
    </>
  )
}

export default function Tasks({ store, panelOpen, panelType, panelId, onOpenPanel, onClosePanel }) {
  const [filter, setFilter] = useState('active')
  const today = new Date().toISOString().split('T')[0]

  let tasks = [...store.tasks]
  if (filter === 'active') tasks = tasks.filter(t => !t.done)
  else if (filter === 'today') tasks = tasks.filter(t => !t.done && t.date === today)
  else if (filter === 'overdue') tasks = tasks.filter(t => !t.done && t.date && isPast(t.date))
  else if (filter === 'done') tasks = tasks.filter(t => t.done)
  tasks.sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1
    if (b.priority === 'high' && a.priority !== 'high') return 1
    if (a.top3 && !b.top3) return -1
    if (b.top3 && !a.top3) return 1
    return (a.date || '9999').localeCompare(b.date || '9999')
  })

  let reminders = [...store.reminders]
  if (filter === 'active') reminders = reminders.filter(r => !r.done)
  else if (filter === 'overdue') reminders = reminders.filter(r => !r.done && r.date && isPast(r.date) && (!r.recur || r.recur === 'none'))
  else if (filter === 'done') reminders = reminders.filter(r => r.done && (!r.recur || r.recur === 'none'))
  else reminders = []

  const editTask = panelType === 'task' && panelId ? store.tasks.find(t => t.id === panelId) : null
  const editReminder = panelType === 'reminder' && panelId ? store.reminders.find(r => r.id === panelId) : null

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <h2 className={styles.title}>Tasks</h2>
        <div className={styles.barRight}>
          <button className={styles.primaryBtn} onClick={() => onOpenPanel('task', null)}>+ Task</button>
          <button className={styles.outlineBtn} onClick={() => onOpenPanel('reminder', null)}>+ Reminder</button>
        </div>
      </div>

      <div className={styles.segs}>
        {['active','today','overdue','done'].map(f => (
          <button key={f} className={`${styles.seg} ${filter === f ? styles.segActive : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {tasks.length > 0 && (
        <>
          <div className={styles.secLabel}>Tasks ({tasks.length})</div>
          {tasks.map(t => {
            const late = t.date && isPast(t.date) && !t.done
            const c = AREA_COLORS[t.area]
            return (
              <div key={t.id} className={`${styles.taskRow} ${t.priority === 'high' ? styles.highPri : ''}`}>
                <div className={`${styles.cb} ${t.done ? styles.cbDone : ''}`} onClick={() => store.toggleTask(t.id)} />
                <div className={styles.taskBody}>
                  <div className={`${styles.taskTitle} ${t.done ? styles.done : ''}`}>{t.title}</div>
                  <div className={styles.taskMeta}>
                    {t.date && <span className={`${styles.due} ${late && !t.done ? styles.late : ''}`}>{late && !t.done ? '⚠ Overdue · ' : ''}{formatDate(t.date)}</span>}
                    {t.area && <span className={styles.areaChip} style={{ background: c?.bg, color: c?.fg }}>{AREA_LABELS[t.area]}</span>}
                    {t.top3 && <span className={styles.topChip}>Top {t.top3}</span>}
                  </div>
                </div>
                <button className={styles.editBtn} onClick={() => onOpenPanel('task', t.id)}>✎</button>
              </div>
            )
          })}
        </>
      )}

      {reminders.length > 0 && filter !== 'today' && (
        <>
          <div className={styles.secLabel} style={{ marginTop: 16 }}>Reminders ({reminders.length})</div>
          {reminders.map(r => {
            const late = r.date && isPast(r.date) && !r.done && (!r.recur || r.recur === 'none')
            const c = AREA_COLORS[r.area]
            return (
              <div key={r.id} className={styles.taskRow}>
                <input type="checkbox" className={styles.remCb} checked={r.done} onChange={() => store.toggleReminder(r.id)} />
                <div className={styles.taskBody}>
                  <div className={`${styles.taskTitle} ${r.done ? styles.done : ''}`}>{r.text}</div>
                  <div className={styles.taskMeta}>
                    {r.date && (!r.recur || r.recur === 'none') && <span className={`${styles.due} ${late ? styles.late : ''}`}>{late ? '⚠ ' : ''}{formatDate(r.date)}</span>}
                    {r.recur && r.recur !== 'none' && <span className={styles.recurChip}>↻ {r.recur}</span>}
                    {r.area && <span className={styles.areaChip} style={{ background: c?.bg, color: c?.fg }}>{AREA_LABELS[r.area]}</span>}
                  </div>
                </div>
                <button className={styles.editBtn} onClick={() => onOpenPanel('reminder', r.id)}>✎</button>
              </div>
            )
          })}
        </>
      )}

      {tasks.length === 0 && reminders.length === 0 && (
        <p style={{ color: 'var(--t3)', fontSize: 14, paddingTop: 20 }}>Nothing here. Add a task or reminder above.</p>
      )}

      <Panel title={panelType === 'reminder' ? (editReminder ? 'Edit Reminder' : 'Set Reminder') : (editTask ? 'Edit Task' : 'Add Task')} open={panelOpen} onClose={() => onClosePanel()}>
        {panelType === 'reminder'
          ? <ReminderForm reminder={editReminder} people={store.people} store={store} onClose={onClosePanel} />
          : <TaskForm task={editTask} store={store} onClose={onClosePanel} />
        }
      </Panel>
    </div>
  )
}
