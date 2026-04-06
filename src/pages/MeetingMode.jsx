import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styles from './MeetingMode.module.css'

function pad(n) { return String(n).padStart(2, '0') }

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

const PRESETS = [15, 20, 30, 45, 60, 90]

function Timer({ onWarn, onDone }) {
  const [mins, setMins] = useState(30)
  const [totalSecs, setTotalSecs] = useState(30 * 60)
  const [remaining, setRemaining] = useState(30 * 60)
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const warnedRef = useRef(false)
  const doneRef = useRef(false)
  const intervalRef = useRef(null)

  // Apply preset before starting
  const applyPreset = (m) => {
    if (running) return
    setMins(m)
    setTotalSecs(m * 60)
    setRemaining(m * 60)
    setStarted(false)
    warnedRef.current = false
    doneRef.current = false
  }

  const applyCustom = (val) => {
    const m = Math.max(1, Math.min(180, Number(val)))
    setMins(m)
    setTotalSecs(m * 60)
    setRemaining(m * 60)
    setStarted(false)
    warnedRef.current = false
    doneRef.current = false
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          const next = r - 1
          if (next <= 60 && !warnedRef.current) {
            warnedRef.current = true
            onWarn?.()
          }
          if (next <= 0 && !doneRef.current) {
            doneRef.current = true
            onDone?.()
            clearInterval(intervalRef.current)
            setRunning(false)
            return 0
          }
          return next
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const start = () => { setStarted(true); setRunning(true) }
  const pause = () => setRunning(false)
  const resume = () => setRunning(true)
  const reset = () => {
    setRunning(false)
    setStarted(false)
    setRemaining(totalSecs)
    warnedRef.current = false
    doneRef.current = false
  }

  const pct = totalSecs > 0 ? (remaining / totalSecs) * 100 : 0
  const isLow = remaining <= 60 && remaining > 0
  const isDone = remaining === 0 && started

  return (
    <div className={styles.timerCard}>
      <div className={styles.timerLabel}>Meeting Timer</div>

      {/* Preset buttons — only show before started */}
      {!started && (
        <div className={styles.presets}>
          {PRESETS.map(m => (
            <button
              key={m}
              className={`${styles.preset} ${mins === m ? styles.presetActive : ''}`}
              onClick={() => applyPreset(m)}
            >{m}m</button>
          ))}
          <div className={styles.customWrap}>
            <input
              type="number"
              min="1"
              max="180"
              value={mins}
              onChange={e => applyCustom(e.target.value)}
              className={styles.customInput}
            />
            <span className={styles.customLabel}>min</span>
          </div>
        </div>
      )}

      {/* Timer display */}
      <div className={`${styles.timerDisplay} ${isLow ? styles.timerLow : ''} ${isDone ? styles.timerDone : ''}`}>
        {formatTime(remaining)}
      </div>

      {/* Progress bar */}
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${isLow ? styles.progressLow : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {isDone && <div className={styles.doneMsg}>Time's up!</div>}

      {/* Controls */}
      <div className={styles.controls}>
        {!started && (
          <button className={styles.startBtn} onClick={start}>Start Timer</button>
        )}
        {started && !isDone && (
          <>
            <button className={styles.startBtn} onClick={running ? pause : resume}>
              {running ? 'Pause' : 'Resume'}
            </button>
            <button className={styles.resetBtn} onClick={reset}>Reset</button>
          </>
        )}
        {isDone && (
          <button className={styles.resetBtn} onClick={reset}>Set New Timer</button>
        )}
      </div>
    </div>
  )
}

export default function MeetingMode({ store }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const meetingId = searchParams.get('id')
  const meeting = meetingId ? store.meetings.find(m => m.id === meetingId) : null
  const people = meeting ? store.people.filter(p => (meeting.peopleIds || []).includes(p.id)) : []

  const [notes, setNotes] = useState(meeting?.notes || '')
  const [saved, setSaved] = useState(false)
  const [alert, setAlert] = useState(null) // 'warn' | 'done' | null

  const upcomingMeetings = store.meetings
    .filter(m => m.date >= new Date().toISOString().split('T')[0])
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .slice(0, 12)

  const handleWarn = useCallback(() => {
    setAlert('warn')
    setTimeout(() => setAlert(null), 5000)
  }, [])

  const handleDone = useCallback(() => {
    setAlert('done')
  }, [])

  const saveNotes = () => {
    if (!meeting) return
    store.updateMeeting(meeting.id, { ...meeting, notes })
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const inits = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={styles.wrap}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.exitBtn} onClick={() => navigate('/meetings')}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 12H5M5 12l7-7M5 12l7 7"/></svg>
          Exit
        </button>
        <div className={styles.topTitle}>{meeting ? meeting.title : 'Meeting Mode'}</div>
        {meeting?.date && <div className={styles.topMeta}>{meeting.date}{meeting.time ? ' · ' + meeting.time : ''}{meeting.location ? ' · ' + meeting.location : ''}</div>}
        {!meeting && <div className={styles.topMeta}>Select a meeting below to get started</div>}
      </div>

      {/* Alert banner */}
      {alert && (
        <div className={`${styles.alertBanner} ${alert === 'done' ? styles.alertDone : styles.alertWarn}`}>
          {alert === 'warn' ? '⚠ One minute left' : '⏱ Time is up!'}
          {alert === 'done' && <button className={styles.alertDismiss} onClick={() => setAlert(null)}>Dismiss</button>}
        </div>
      )}

      {/* No meeting selected — show picker */}
      {!meeting && (
        <div className={styles.picker}>
          <div className={styles.pickerTitle}>Choose a meeting</div>
          {upcomingMeetings.length === 0 && (
            <p style={{ color: 'var(--t3)', fontSize: 14 }}>
              No upcoming meetings.{' '}
              <button className={styles.textBtn} onClick={() => navigate('/meetings')}>Schedule one →</button>
            </p>
          )}
          {upcomingMeetings.map(m => (
            <div key={m.id} className={styles.pickRow} onClick={() => navigate(`/meeting-mode?id=${m.id}`)}>
              <div className={styles.pickTitle}>{m.title}</div>
              <div className={styles.pickMeta}>{m.date}{m.time ? ' · ' + m.time : ''}{m.location ? ' · ' + m.location : ''}</div>
            </div>
          ))}
        </div>
      )}

      {/* Active meeting layout */}
      {meeting && (
        <div className={styles.grid}>

          {/* Left */}
          <div className={styles.left}>
            <Timer onWarn={handleWarn} onDone={handleDone} />

            {/* People */}
            {people.length > 0 && (
              <div className={styles.card}>
                <div className={styles.cardLabel}>Who's here</div>
                {people.map(p => (
                  <div key={p.id} className={styles.personRow}>
                    <div className={styles.av}>{inits(p.name)}</div>
                    <div>
                      <div className={styles.personName}>{p.name}</div>
                      <div className={styles.personRole}>{p.role}{p.school ? ' · ' + p.school : ''}</div>
                      {p.idea && <div className={styles.personDetail}>{p.idea}</div>}
                      {p.lastTopic && <div className={styles.personLast}>Last: {p.lastTopic}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Change meeting */}
            <button className={styles.textBtn} style={{ alignSelf: 'flex-start' }} onClick={() => navigate('/meeting-mode')}>
              ← Switch meeting
            </button>
          </div>

          {/* Right */}
          <div className={styles.right}>

            {/* Agenda */}
            {meeting.agenda && (
              <div className={styles.card}>
                <div className={styles.cardLabel}>What I want out of this meeting</div>
                <div className={styles.agendaText}>{meeting.agenda}</div>
              </div>
            )}

            {/* Notes */}
            <div className={`${styles.card} ${styles.notesCard}`}>
              <div className={styles.notesHead}>
                <div className={styles.cardLabel}>Meeting Notes</div>
                <button
                  className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ''}`}
                  onClick={saveNotes}
                >
                  {saved ? '✓ Saved' : 'Save'}
                </button>
              </div>
              <textarea
                className={styles.notesArea}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Type your notes here — click Save to write them back to this meeting record…"
              />
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
