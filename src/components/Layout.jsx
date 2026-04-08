import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { exportData, importData, getLastBackup, daysSinceBackup } from '../services/backup'
import styles from './Layout.module.css'

const NAV = [
  { to: '/', label: 'Home', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { to: '/calendar', label: 'Calendar', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { to: '/people', label: 'People', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { to: '/meetings', label: 'Meetings', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { to: '/tasks', label: 'Tasks', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { to: '/notes', label: 'Notes', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { to: '/projects', label: 'Projects', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { to: '/ideas', label: 'Ideas', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg> },
  { to: '/content', label: 'Content', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> },
  { to: '/linkedin', label: 'LinkedIn', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
  { to: '/agents', label: 'Agents', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="9" x2="9" y2="9.01"/><line x1="15" y1="9" x2="15" y2="9.01"/><path d="M8 13a4 4 0 0 0 8 0"/></svg> },
  { to: '/ai-tools', label: 'AI Tools', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
  { to: '/email', label: 'Email', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg> },
  { to: '/meeting-mode', label: 'Meeting Mode', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { to: '/pitch', label: 'Pitch Page', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
]

const BOT_NAV = [
  NAV[0], NAV[1], NAV[2], NAV[3], NAV[13]
]

export default function Layout({ children, onAdd, onLock }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const fileRef = useRef(null)
  const location = useLocation()
  const currentLabel = NAV.find(n => n.to === location.pathname)?.label || 'Home'
  const isMeetingMode = location.pathname === '/meeting-mode'

  const days = daysSinceBackup()
  const lastBackup = getLastBackup()
  const backupLabel = !lastBackup ? 'No backup yet' : days === 0 ? 'Backed up today' : `Backup: ${days}d ago`
  const backupWarn = !lastBackup ? 'warn' : days >= 7 ? 'warn' : ''

  const handleExport = () => {
    exportData()
    setToast('Backup saved')
    setTimeout(() => setToast(null), 2000)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm('This will overwrite all current data. Continue?')) { e.target.value = ''; return }
    try {
      await importData(file)
      setToast('Data restored successfully')
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      setToast(err.message)
    }
    e.target.value = ''
    setTimeout(() => setToast(null), 3000)
  }

  // Cmd+Shift+E / Ctrl+Shift+E shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'e') {
        e.preventDefault()
        handleExport()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (isMeetingMode) return <>{children}</>

  return (
    <div className={styles.shell}>
      <nav className={styles.sidebar}>
        <div>
          <div className={styles.logo}>
            <span className={styles.logoBadge}>D-001</span>
            <span className={styles.logoText}>Dashboard</span>
          </div>
          <div className={styles.navItems}>
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}>
                {n.icon}<span>{n.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
        <div className={styles.sidebarFooter}>
          <div className={styles.backupRow}>
            <span className={`${styles.backupStatus} ${backupWarn ? styles.backupWarn : ''}`}>{backupLabel}</span>
          </div>
          <div className={styles.backupBtns}>
            <button className={styles.footerBtn} onClick={handleExport} title="Export backup (Cmd+Shift+E)">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
            <button className={styles.footerBtn} onClick={() => fileRef.current?.click()} title="Import backup">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </div>
          {toast && <div className={styles.toast}>{toast}</div>}
          <button className={styles.lockBtn} onClick={onLock} title="Lock app">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Lock
          </button>
          <div className={styles.areaPips}>
            {['#2d9e63','#3b82f6','#f97316','#8b5cf6','#eab308'].map((c,i) => (
              <span key={i} className={styles.pip} style={{ background: c }} />
            ))}
          </div>
        </div>
      </nav>

      <header className={styles.mobHeader}>
        <span className={styles.logoBadgeSm}>D-001</span>
        <span className={styles.mobTitle}>{currentLabel}</span>
        <button className={styles.mobPlus} onClick={() => setMenuOpen(m => !m)}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </header>

      {menuOpen && (
        <>
          <div className={styles.addBg} onClick={() => setMenuOpen(false)} />
          <div className={styles.addMenu}>
            <p className={styles.addMenuHead}>Add new</p>
            {['Event','Task','Reminder','Habit','Person','Meeting','Note'].map(t => (
              <button key={t} onClick={() => { setMenuOpen(false); onAdd(t.toLowerCase()) }}>{t}</button>
            ))}
            <p className={styles.addMenuHead} style={{ marginTop: 4 }}>Navigate</p>
            <button onClick={() => { setMenuOpen(false); window.location.href='/linkedin' }}>LinkedIn</button>
            <button onClick={() => { setMenuOpen(false); window.location.href='/meeting-mode' }}>Meeting Mode</button>
          </div>
        </>
      )}

      <main className={styles.main}>{children}</main>

      <nav className={styles.botNav}>
        {BOT_NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            className={({ isActive }) => `${styles.botBtn} ${isActive ? styles.botBtnActive : ''}`}>
            {n.icon}<span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
