import { useState, useEffect, useRef } from 'react'
import styles from './PasswordGate.module.css'

const PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'whoelse2026'
const SESSION_KEY = 'we_hub_auth'

export function useAuth() {
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === 'true'
  })
  const unlock = (pw) => {
    if (pw === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setUnlocked(true)
      return true
    }
    return false
  }
  const lock = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setUnlocked(false)
  }
  return { unlocked, unlock, lock }
}

export default function PasswordGate({ onUnlock }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [phase, setPhase] = useState(0)
  const [fading, setFading] = useState(false)
  const [removed, setRemoved] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 600)
    const t3 = setTimeout(() => setPhase(3), 900)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (phase >= 3) inputRef.current?.focus()
  }, [phase])

  const attempt = () => {
    if (!pw) return
    const ok = onUnlock(pw)
    if (ok) {
      setFading(true)
      setTimeout(() => setRemoved(true), 400)
    } else {
      setError(true)
      setShake(true)
      setPw('')
      setTimeout(() => setShake(false), 500)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') attempt()
  }

  if (removed) return null

  return (
    <div className={`${styles.screen} ${fading ? styles.fadeOut : ''}`}>
      <div className={styles.content}>
        <img
          src="/assets/dorelabssphere.gif"
          alt=""
          className={styles.sphere}
        />

        <img
          src="/assets/dorelabs180inverted.gif"
          alt="DORE LABS"
          className={`${styles.wordmark} ${phase >= 1 ? styles.vis : ''}`}
        />

        <div className={`${styles.subtitle} ${phase >= 2 ? styles.vis : ''}`}>
          Dashboard-001
        </div>

        <div className={`${styles.form} ${phase >= 3 ? styles.vis : ''} ${shake ? styles.shake : ''}`}>
          <input
            ref={inputRef}
            className={`${styles.input} ${error ? styles.inputErr : ''}`}
            type="password"
            placeholder="Enter password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false) }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <button className={styles.btn} onClick={attempt}>Unlock</button>
          {error && <div className={styles.error}>Incorrect password</div>}
        </div>
      </div>
    </div>
  )
}
