import { useState } from 'react'
import { uid } from '../store/useStore'
import { expandIdea } from '../services/ai'
import styles from './Ideas.module.css'

const CATEGORIES = ['content', 'tool', 'client', 'business', 'school']
const CAT_COLORS = {
  content: { bg: '#f5f3ff', fg: '#4c1d95' },
  tool: { bg: '#dbeafe', fg: '#1e3a8a' },
  client: { bg: '#fef3c7', fg: '#92400e' },
  business: { bg: '#dcfce7', fg: '#166534' },
  school: { bg: '#eff6ff', fg: '#1e3a8a' },
}

export default function Ideas({ store }) {
  const [input, setInput] = useState('')
  const [cat, setCat] = useState('content')
  const [filter, setFilter] = useState('all')
  const [weekOnly, setWeekOnly] = useState(false)
  const [expanding, setExpanding] = useState(null)
  const [expanded, setExpanded] = useState({})

  const ideas = [...(store.ideas || [])]
    .filter(i => filter === 'all' || i.category === filter)
    .filter(i => {
      if (!weekOnly) return true
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      return i.createdAt >= weekAgo
    })
    .sort((a, b) => b.createdAt - a.createdAt)

  const add = () => {
    if (!input.trim()) return
    store.addIdea({ text: input.trim(), category: cat })
    setInput('')
  }

  const handleExpand = async (idea) => {
    setExpanding(idea.id)
    try {
      const result = await expandIdea(idea.text)
      setExpanded(prev => ({ ...prev, [idea.id]: result }))
    } catch (err) {
      setExpanded(prev => ({ ...prev, [idea.id]: 'AI unavailable — try again later.' }))
    }
    setExpanding(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') add()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <h2 className={styles.title}>Ideas</h2>
        <button
          className={`${styles.weekBtn} ${weekOnly ? styles.weekBtnActive : ''}`}
          onClick={() => setWeekOnly(w => !w)}
        >
          This Week
        </button>
      </div>

      <div className={styles.addBar}>
        <input
          className={styles.addInput}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Capture an idea…"
        />
        <select className={styles.addCat} value={cat} onChange={e => setCat(e.target.value)}>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <button className={styles.addBtn} onClick={add} disabled={!input.trim()}>Add</button>
      </div>

      <div className={styles.segs}>
        {['all', ...CATEGORIES].map(c => (
          <button key={c} className={`${styles.seg} ${filter === c ? styles.segActive : ''}`} onClick={() => setFilter(c)}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.secLabel}>Ideas ({ideas.length})</div>
      {ideas.length === 0 ? (
        <p className={styles.empty}>No ideas yet. Start capturing above.</p>
      ) : (
        ideas.map(i => {
          const cc = CAT_COLORS[i.category] || {}
          return (
            <div key={i.id} className={styles.ideaRow}>
              <div className={styles.ideaBody}>
                <div className={styles.ideaText}>{i.text}</div>
                <div className={styles.ideaMeta}>
                  <span className={styles.catChip} style={{ background: cc.bg, color: cc.fg }}>{i.category}</span>
                  <span className={styles.ideaDate}>
                    {new Date(i.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {expanded[i.id] && (
                  <div className={styles.expandedCard}>
                    <div className={styles.expandedHead}>Expanded</div>
                    <div className={styles.expandedBody}>{expanded[i.id]}</div>
                  </div>
                )}
              </div>
              <div className={styles.ideaActions}>
                <button
                  className={styles.expandBtn}
                  onClick={() => handleExpand(i)}
                  disabled={expanding === i.id}
                >
                  {expanding === i.id ? '…' : 'Expand'}
                </button>
                <button className={styles.delBtn} onClick={() => store.deleteIdea(i.id)}>×</button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
