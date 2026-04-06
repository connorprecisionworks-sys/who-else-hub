import { useState, useEffect } from 'react'
import styles from './PasswordGate.module.css'

const PASSWORD = 'whoelse2026'
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

  const attempt = () => {
    const ok = onUnlock(pw)
    if (!ok) {
      setError(true)
      setShake(true)
      setPw('')
      setTimeout(() => setShake(false), 500)
    }
  }

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Enter') attempt() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pw])

  return (
    <div className={styles.wrap}>
      <div className={`${styles.box} ${shake ? styles.shake : ''}`}>
        <div className={styles.logo}>W/E</div>
        <div className={styles.title}>Who Else Hub</div>
        <div className={styles.sub}>Enter your password to continue</div>
        <input
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          type="password"
          placeholder="Password"
          value={pw}
          autoFocus
          onChange={e => { setPw(e.target.value); setError(false) }}
        />
        {error && <div className={styles.error}>Incorrect password</div>}
        <button className={styles.btn} onClick={attempt}>Unlock →</button>
      </div>
    </div>
  )
}
