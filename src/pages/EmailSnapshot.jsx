import { useState, useEffect, useCallback } from 'react'
import { draftEmail } from '../services/ai'
import styles from './EmailSnapshot.module.css'

const SHEETS_URL = import.meta.env.VITE_SHEETS_URL
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY

async function fetchEmails() {
  if (!SHEETS_URL || !API_KEY) throw new Error('Sheets endpoint not configured')
  const url = new URL(SHEETS_URL)
  url.searchParams.set('key', API_KEY)
  url.searchParams.set('action', 'unreadEmails')
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  return res.json()
}

export default function EmailSnapshot() {
  const [emails, setEmails] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftResult, setDraftResult] = useState('')
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchEmails()
      setUnreadCount(data.unreadCount || 0)
      setEmails(data.emails || [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleDraft = async () => {
    if (!draftPrompt.trim()) return
    setDraftLoading(true)
    setDraftError(null)
    setDraftResult('')
    try {
      const result = await draftEmail(draftPrompt)
      setDraftResult(result)
    } catch (err) {
      setDraftError(err.message)
    }
    setDraftLoading(false)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <h2 className={styles.title}>Email</h2>
        <button className={styles.refreshBtn} onClick={refresh} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className={styles.setupNotice}>
          <div className={styles.setupHead}>Setup Required</div>
          <p className={styles.setupText}>
            To use the Email Snapshot, add the Gmail functions from backend.gs to your
            Apps Script project, re-authorize, and redeploy. The endpoint needs GmailApp access.
          </p>
          <p className={styles.setupError}>{error}</p>
        </div>
      )}

      {!error && (
        <>
          <div className={styles.countCard}>
            <div className={styles.countLabel}>Unread Emails</div>
            <div className={styles.countValue}>{loading ? '—' : unreadCount}</div>
          </div>

          <div className={styles.secLabel}>Recent Unread</div>
          {loading ? (
            <p className={styles.loading}>Loading emails…</p>
          ) : !emails || emails.length === 0 ? (
            <p className={styles.empty}>No unread emails.</p>
          ) : (
            <div className={styles.emailList}>
              {emails.map((e, i) => (
                <div key={i} className={styles.emailRow}>
                  <div className={styles.emailFrom}>{e.from}</div>
                  <div className={styles.emailSubject}>{e.subject}</div>
                  <div className={styles.emailDate}>{e.date}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className={styles.secLabel}>Quick Draft</div>
      <div className={styles.draftBar}>
        <input
          className={styles.draftInput}
          value={draftPrompt}
          onChange={e => setDraftPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleDraft()}
          placeholder="Describe the email you want to draft…"
        />
        <button className={styles.draftBtn} onClick={handleDraft} disabled={draftLoading || !draftPrompt.trim()}>
          {draftLoading ? 'Drafting…' : 'Draft'}
        </button>
      </div>
      {draftError && <p className={styles.error}>{draftError}</p>}
      {draftResult && (
        <div className={styles.draftOutput}>
          <div className={styles.draftHead}>Generated Draft</div>
          <pre className={styles.draftBody}>{draftResult}</pre>
          <button className={styles.copyBtn} onClick={() => { navigator.clipboard.writeText(draftResult) }}>Copy</button>
        </div>
      )}
    </div>
  )
}
