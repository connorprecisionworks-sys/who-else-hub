import { useState } from 'react'
import { uid } from '../store/useStore'
import styles from './ContentPipeline.module.css'

const STAGES = ['idea', 'scripted', 'recorded', 'edited', 'published']
const STAGE_LABELS = { idea: 'Idea', scripted: 'Scripted', recorded: 'Recorded', edited: 'Edited', published: 'Published' }

export default function ContentPipeline({ store }) {
  const [input, setInput] = useState('')
  const items = store.contentItems || []

  const add = () => {
    if (!input.trim()) return
    store.addContentItem({ title: input.trim(), stage: 'idea', notes: '' })
    setInput('')
  }

  const move = (id, direction) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const idx = STAGES.indexOf(item.stage)
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= STAGES.length) return
    store.updateContentItem(id, { stage: STAGES[newIdx] })
  }

  const remove = (id) => {
    if (confirm('Remove this content item?')) store.deleteContentItem(id)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <h2 className={styles.title}>Content Pipeline</h2>
      </div>

      <div className={styles.addBar}>
        <input
          className={styles.addInput}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="New content piece…"
        />
        <button className={styles.addBtn} onClick={add} disabled={!input.trim()}>Add</button>
      </div>

      <div className={styles.board}>
        {STAGES.map(stage => {
          const stageItems = items.filter(i => i.stage === stage)
          return (
            <div key={stage} className={styles.column}>
              <div className={styles.colHead}>
                <span className={styles.colLabel}>{STAGE_LABELS[stage]}</span>
                <span className={styles.colCount}>{stageItems.length}</span>
              </div>
              <div className={styles.colBody}>
                {stageItems.map(item => (
                  <div key={item.id} className={styles.card}>
                    <div className={styles.cardTitle}>{item.title}</div>
                    <div className={styles.cardActions}>
                      {STAGES.indexOf(stage) > 0 && (
                        <button className={styles.moveBtn} onClick={() => move(item.id, -1)} title="Move back">←</button>
                      )}
                      {STAGES.indexOf(stage) < STAGES.length - 1 && (
                        <button className={styles.moveBtn} onClick={() => move(item.id, 1)} title="Move forward">→</button>
                      )}
                      <button className={styles.removeBtn} onClick={() => remove(item.id)} title="Remove">×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
