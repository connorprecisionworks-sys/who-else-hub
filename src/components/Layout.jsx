import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import styles from './Layout.module.css'

const NAV = [
  { to: '/', label: 'Home', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { to: '/calendar', label: 'Calendar', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { to: '/people', label: 'People', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { to: '/meetings', label: 'Meetings', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { to: '/tasks', label: 'Tasks', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { to: '/notes', label: 'Notes', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { to: '/linkedin', label: 'LinkedIn', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
  { to: '/meeting-mode', label: 'Meeting Mode', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { to: '/pitch', label: 'Pitch Page', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
]

const BOT_NAV = [
  NAV[0], NAV[1], NAV[2], NAV[3], NAV[7]
]

export default function Layout({ children, onAdd, onLock }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const currentLabel = NAV.find(n => n.to === location.pathname)?.label || 'Home'
  const isMeetingMode = location.pathname === '/meeting-mode'

  if (isMeetingMode) return <>{children}</>

  return (
    <div className={styles.shell}>
      <nav className={styles.sidebar}>
        <div>
          <div className={styles.logo}>
            <span className={styles.logoBadge}>W/E</span>
            <span className={styles.logoText}>Hub</span>
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
        <span className={styles.logoBadgeSm}>W/E</span>
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
