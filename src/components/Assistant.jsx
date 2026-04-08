import { useState, useRef, useEffect } from 'react'
import { chat } from '../services/ai'
import styles from './Assistant.module.css'

export default function Assistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const reply = await chat(next)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + err.message }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      <button className={styles.fab} onClick={() => setOpen(o => !o)} title="AI Assistant">
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/>
          <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>
        </svg>
      </button>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      <div className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
        <div className={styles.head}>
          <span className={styles.headTitle}>Assistant</span>
          <div className={styles.headActions}>
            <button className={styles.clearBtn} onClick={() => setMessages([])} title="Clear chat">Clear</button>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>
        </div>

        <div className={styles.body}>
          {messages.length === 0 && (
            <div className={styles.welcome}>
              <p className={styles.welcomeText}>Quick-access AI assistant. Ask anything.</p>
              <div className={styles.suggestions}>
                {['Draft a follow-up email', 'Brainstorm video ideas', 'Explain this code', 'What should I work on?'].map(s => (
                  <button key={s} className={styles.suggestion} onClick={() => { setInput(s) }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`${styles.msg} ${m.role === 'user' ? styles.msgUser : styles.msgAssistant}`}>
              <div className={styles.msgContent}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className={`${styles.msg} ${styles.msgAssistant}`}>
              <div className={styles.msgContent}>
                <span className={styles.typing}>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className={styles.inputBar}>
          <textarea
            className={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything…"
            rows={1}
          />
          <button className={styles.sendBtn} onClick={send} disabled={loading || !input.trim()}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
