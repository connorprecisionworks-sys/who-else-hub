import { useState } from 'react'
import { rewriteText, generateSubjectLines, buildAgenda, summarizeNotes } from '../services/ai'
import styles from './AITools.module.css'

const TONES = ['professional', 'casual', 'friendly', 'concise', 'enthusiastic']

function ToolSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={styles.section}>
      <button className={styles.sectionHead} onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <span className={styles.chevron}>{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  )
}

function RewriteTool() {
  const [text, setText] = useState('')
  const [tone, setTone] = useState('professional')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = async () => {
    if (!text.trim()) return
    setLoading(true); setError(null); setResult('')
    try { setResult(await rewriteText(text, tone)) }
    catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <>
      <textarea className={styles.input} value={text} onChange={e => setText(e.target.value)} placeholder="Paste text to rewrite…" />
      <div className={styles.toolRow}>
        <div className={styles.tones}>
          {TONES.map(t => (
            <button key={t} className={`${styles.tonePill} ${tone === t ? styles.tonePillActive : ''}`} onClick={() => setTone(t)}>
              {t}
            </button>
          ))}
        </div>
        <button className={styles.runBtn} onClick={run} disabled={loading || !text.trim()}>
          {loading ? 'Rewriting…' : 'Rewrite'}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {result && <div className={styles.output}>{result}</div>}
    </>
  )
}

function SubjectLineTool() {
  const [context, setContext] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = async () => {
    if (!context.trim()) return
    setLoading(true); setError(null); setResult('')
    try { setResult(await generateSubjectLines(context)) }
    catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <>
      <textarea className={styles.input} value={context} onChange={e => setContext(e.target.value)} placeholder="Describe the email context…" />
      <button className={styles.runBtn} onClick={run} disabled={loading || !context.trim()}>
        {loading ? 'Generating…' : 'Generate'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
      {result && <div className={styles.output}>{result}</div>}
    </>
  )
}

function AgendaTool() {
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = async () => {
    if (!notes.trim()) return
    setLoading(true); setError(null); setResult('')
    try { setResult(await buildAgenda(notes)) }
    catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <>
      <textarea className={styles.input} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Paste meeting notes or topics…" />
      <button className={styles.runBtn} onClick={run} disabled={loading || !notes.trim()}>
        {loading ? 'Building…' : 'Build Agenda'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
      {result && <div className={styles.output}>{result}</div>}
    </>
  )
}

function SummaryTool() {
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = async () => {
    if (!notes.trim()) return
    setLoading(true); setError(null); setResult('')
    try { setResult(await summarizeNotes(notes)) }
    catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <>
      <textarea className={styles.input} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Paste notes to summarize…" />
      <button className={styles.runBtn} onClick={run} disabled={loading || !notes.trim()}>
        {loading ? 'Summarizing…' : 'Summarize'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
      {result && <div className={styles.output}>{result}</div>}
    </>
  )
}

export default function AITools() {
  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <h2 className={styles.title}>AI Tools</h2>
      </div>
      <ToolSection title="Rewrite Text" defaultOpen={true}><RewriteTool /></ToolSection>
      <ToolSection title="Email Subject Line Generator"><SubjectLineTool /></ToolSection>
      <ToolSection title="Meeting Agenda Builder"><AgendaTool /></ToolSection>
      <ToolSection title="Notes-to-Summary"><SummaryTool /></ToolSection>
    </div>
  )
}
