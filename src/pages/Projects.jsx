import { useState } from 'react'
import Panel, { Field, Input, Textarea, Select, Row, SaveBtn, DelBtn } from '../components/Panel'
import { formatDate, isPast, uid } from '../store/useStore'
import { focusAdvice } from '../services/ai'
import styles from './Projects.module.css'

const CATEGORIES = ['all', 'school', 'client', 'personal']
const STATUSES = ['backlog', 'in-progress', 'done']
const PRIORITIES = ['low', 'normal', 'high']
const CAT_COLORS = {
  school: { bg: '#eff6ff', fg: '#1e3a8a' },
  client: { bg: '#f5f3ff', fg: '#4c1d95' },
  personal: { bg: '#fff7ed', fg: '#7c2d12' },
}

function ProjectForm({ project, store, onClose }) {
  const [f, setF] = useState({
    title: project?.title || '', category: project?.category || 'client',
    status: project?.status || 'backlog', priority: project?.priority || 'normal',
    dueDate: project?.dueDate || '', nextAction: project?.nextAction || '',
    notes: project?.notes || '',
  })
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const save = () => {
    if (!f.title) return
    project ? store.updateProject(project.id, f) : store.addProject(f)
    onClose()
  }
  const del = () => { if (confirm('Delete this project?')) { store.deleteProject(project.id); onClose() } }
  return (
    <>
      <Field label="Title *"><Input value={f.title} onChange={s('title')} placeholder="Project name" /></Field>
      <Row>
        <Field label="Category">
          <Select value={f.category} onChange={s('category')}>
            <option value="school">School</option>
            <option value="client">Client</option>
            <option value="personal">Personal</option>
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={f.priority} onChange={s('priority')}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label="Status">
          <Select value={f.status} onChange={s('status')}>
            <option value="backlog">Backlog</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </Select>
        </Field>
        <Field label="Due Date"><Input type="date" value={f.dueDate} onChange={s('dueDate')} /></Field>
      </Row>
      <Field label="Next Action"><Input value={f.nextAction} onChange={s('nextAction')} placeholder="What's the next step?" /></Field>
      <Field label="Notes"><Textarea value={f.notes} onChange={s('notes')} style={{ minHeight: 60 }} /></Field>
      <SaveBtn onClick={save} />
      {project && <DelBtn onClick={del} />}
    </>
  )
}

export default function Projects({ store, panelOpen, panelId, onOpenPanel, onClosePanel }) {
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [focusResult, setFocusResult] = useState(null)
  const [focusLoading, setFocusLoading] = useState(false)

  let projects = [...(store.projects || [])]
  if (catFilter !== 'all') projects = projects.filter(p => p.category === catFilter)
  if (statusFilter !== 'all') projects = projects.filter(p => p.status === statusFilter)
  projects.sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1
    if (b.priority === 'high' && a.priority !== 'high') return 1
    const statusOrder = { 'in-progress': 0, backlog: 1, done: 2 }
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status]
    return (a.dueDate || '9999').localeCompare(b.dueDate || '9999')
  })

  const editProject = panelId ? (store.projects || []).find(p => p.id === panelId) : null

  const handleFocus = async () => {
    const active = (store.projects || []).filter(p => p.status !== 'done')
    if (active.length === 0) { setFocusResult('No active projects to analyze.'); return }
    setFocusLoading(true)
    setFocusResult(null)
    try {
      const advice = await focusAdvice(active)
      setFocusResult(advice)
    } catch (err) {
      setFocusResult('AI unavailable — focus on overdue and high-priority items first.')
    }
    setFocusLoading(false)
  }

  const cycleStatus = (id) => {
    const p = (store.projects || []).find(x => x.id === id)
    if (!p) return
    const next = { backlog: 'in-progress', 'in-progress': 'done', done: 'backlog' }
    store.updateProject(id, { status: next[p.status] })
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <h2 className={styles.title}>Projects</h2>
        <div className={styles.barRight}>
          <button className={styles.focusBtn} onClick={handleFocus} disabled={focusLoading}>
            {focusLoading ? 'Thinking…' : 'What should I focus on?'}
          </button>
          <button className={styles.primaryBtn} onClick={() => onOpenPanel(null)}>+ Project</button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.segs}>
          {CATEGORIES.map(c => (
            <button key={c} className={`${styles.seg} ${catFilter === c ? styles.segActive : ''}`} onClick={() => setCatFilter(c)}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.segs}>
          {['all', ...STATUSES].map(s => (
            <button key={s} className={`${styles.seg} ${statusFilter === s ? styles.segActive : ''}`} onClick={() => setStatusFilter(s)}>
              {s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {focusResult && (
        <div className={styles.focusCard}>
          <div className={styles.focusHead}>Focus Advice</div>
          <div className={styles.focusBody}>{focusResult}</div>
          <button className={styles.focusDismiss} onClick={() => setFocusResult(null)}>Dismiss</button>
        </div>
      )}

      <div className={styles.secLabel}>Projects ({projects.length})</div>
      {projects.length === 0 ? (
        <p className={styles.empty}>No projects match your filters.</p>
      ) : (
        projects.map(p => {
          const overdue = p.dueDate && isPast(p.dueDate) && p.status !== 'done'
          const cc = CAT_COLORS[p.category] || {}
          return (
            <div key={p.id} className={`${styles.row} ${p.priority === 'high' ? styles.highPri : ''}`}>
              <button className={`${styles.statusBadge} ${styles['status_' + p.status.replace('-', '_')]}`} onClick={() => cycleStatus(p.id)} title="Click to change status">
                {p.status === 'in-progress' ? 'In Progress' : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
              </button>
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>{p.title}</div>
                <div className={styles.rowMeta}>
                  <span className={styles.catChip} style={{ background: cc.bg, color: cc.fg }}>{p.category}</span>
                  {p.dueDate && <span className={`${styles.due} ${overdue ? styles.late : ''}`}>{overdue ? 'Overdue · ' : ''}{formatDate(p.dueDate)}</span>}
                  {p.nextAction && <span className={styles.nextAction}>Next: {p.nextAction}</span>}
                </div>
              </div>
              <button className={styles.editBtn} onClick={() => onOpenPanel(p.id)}>✎</button>
            </div>
          )
        })
      )}

      <Panel title={editProject ? 'Edit Project' : 'Add Project'} open={panelOpen} onClose={onClosePanel}>
        <ProjectForm project={editProject} store={store} onClose={onClosePanel} />
      </Panel>
    </div>
  )
}
