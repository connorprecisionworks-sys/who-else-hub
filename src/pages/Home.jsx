import { useState, useEffect } from 'react'
import { matchesRecurrence, todayStr, formatDate, formatDateShort, isPast, AREA_COLORS, AREA_LABELS } from '../store/useStore'
import styles from './Home.module.css'

function pad(n) { return String(n).padStart(2, '0') }

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t) }, [])
  const h = now.getHours(), m = now.getMinutes()
  const h12 = h % 12 || 12
  const ampm = h >= 12 ? 'pm' : 'am'
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return (
    <div className={styles.hero}>
      <div className={styles.heroTime}>{h12}:{pad(m)} {ampm}</div>
      <div className={styles.heroDate}>{days[now.getDay()]}, {months[now.getMonth()]} {now.getDate()}</div>
    </div>
  )
}

function Section({ label, onAdd, addLabel, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionLabel}>{label}</span>
        {onAdd && <button className={styles.ghost} onClick={onAdd}>{addLabel || '+ Add'}</button>}
      </div>
      {children}
    </section>
  )
}

function Empty({ text }) {
  return <p className={styles.empty}>{text}</p>
}

export default function Home({ store, onAdd }) {
  const today = todayStr()
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const log = store.habitLog[today] || {}

  // Overdue count
  const overdueCount =
    store.tasks.filter(t => !t.done && t.date && isPast(t.date)).length +
    store.reminders.filter(r => !r.done && r.date && (!r.recur || r.recur === 'none') && isPast(r.date)).length

  // Today's schedule
  const todayEvents = store.getEventsForDate(today)
  const todayTasks = store.tasks.filter(t => !t.done && t.date === today)
  const scheduleItems = [
    ...todayEvents.map(e => ({ ...e, _k: 'event' })),
    ...todayTasks.map(t => ({ ...t, _k: 'task', time: '' })),
  ].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  // Focus (top 3)
  const focus = store.tasks.filter(t => t.top3 && !t.done).sort((a, b) => Number(a.top3) - Number(b.top3)).slice(0, 3)

  // Today's habits
  const todayHabits = store.habits.filter(h => matchesRecurrence(h, today))

  // Active reminders
  const activeReminders = store.reminders.filter(r => {
    if (r.recur && r.recur !== 'none') return matchesRecurrence(r, today)
    if (r.done) return false
    return !r.date || r.date <= today
  }).slice(0, 6)

  // Upcoming (next 7 days)
  const upcoming = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i)
    const ds = d.toISOString().split('T')[0]
    store.getEventsForDate(ds).forEach(e => upcoming.push({ ...e, _date: ds }))
    store.meetings.filter(m => m.date === ds).forEach(m => upcoming.push({ ...m, _date: ds }))
  }
  upcoming.sort((a, b) => a._date.localeCompare(b._date) || (a.time || '').localeCompare(b.time || ''))

  const areaColor = (a) => AREA_COLORS[a]?.mid || 'var(--border2)'

  return (
    <div className={styles.wrap}>
      <Clock />

      {overdueCount > 0 && (
        <div className={styles.alert}>
          ⚠ {overdueCount} overdue item{overdueCount > 1 ? 's' : ''} need attention
        </div>
      )}

      <Section label="Today" onAdd={() => onAdd('event')} addLabel="+ Event">
        {scheduleItems.length === 0
          ? <Empty text="Nothing scheduled. Add an event or task." />
          : scheduleItems.map(item => {
            let isNow = false
            if (item.time) {
              const [hh, mm] = item.time.split(':').map(Number)
              const start = hh * 60 + mm
              const end = item.endTime ? (() => { const [eh, em] = item.endTime.split(':').map(Number); return eh * 60 + em })() : start + 60
              isNow = nowMin >= start && nowMin < end
            }
            return (
              <div key={item.id} className={styles.schedItem}>
                <div className={styles.schedTime}>{item.time || ''}</div>
                <div className={styles.schedBar} style={{ background: item._k === 'task' ? 'var(--border2)' : areaColor(item.area) }} />
                <div className={styles.schedBody}>
                  <div className={styles.schedTitle}>
                    {item.title}
                    {isNow && <span className={styles.nowBadge}>now</span>}
                  </div>
                  {item.location && <div className={styles.schedSub}>{item.location}</div>}
                  {item.recur && item.recur !== 'none' && <div className={styles.schedSub}>↻ {item.recur}</div>}
                </div>
              </div>
            )
          })}
      </Section>

      <Section label="Focus" onAdd={() => onAdd('task')} addLabel="+ Task">
        {focus.length === 0
          ? <Empty text="No focus tasks set. Add a task and mark it Top 1–3." />
          : focus.map(t => {
            const c = AREA_COLORS[t.area]
            return (
              <div key={t.id} className={styles.focusItem}>
                <div
                  className={`${styles.check} ${t.done ? styles.checkDone : ''}`}
                  onClick={() => store.toggleTask(t.id)}
                />
                <span className={`${styles.focusTitle} ${t.done ? styles.strikethrough : ''}`}>{t.title}</span>
                {t.area && (
                  <span className={styles.areaChip} style={{ background: c?.bg, color: c?.fg }}>
                    {AREA_LABELS[t.area]}
                  </span>
                )}
              </div>
            )
          })}
      </Section>

      <Section label="Habits" onAdd={() => onAdd('habit')} addLabel="+ Habit">
        {todayHabits.length === 0
          ? <Empty text="No habits for today. Add one above." />
          : todayHabits.map(h => (
            <div key={h.id} className={styles.habitItem}>
              <div
                className={`${styles.habitCheck} ${log[h.id] ? styles.habitDone : ''}`}
                onClick={() => store.toggleHabit(h.id)}
              />
              <span className={`${styles.habitName} ${log[h.id] ? styles.strikethrough : ''}`}>
                {h.icon && <>{h.icon} </>}{h.name}
              </span>
              <span className={styles.habitFreq}>{h.recur || 'daily'}</span>
            </div>
          ))}
      </Section>

      <Section label="Reminders" onAdd={() => onAdd('reminder')} addLabel="+ Add">
        {activeReminders.length === 0
          ? <Empty text="No reminders active today." />
          : activeReminders.map(r => {
            const isRecur = r.recur && r.recur !== 'none'
            const isDone = isRecur ? !!log['rem_' + r.id] : r.done
            const overdue = !isRecur && r.date && isPast(r.date) && !r.done
            return (
              <div key={r.id} className={styles.remItem}>
                <input type="checkbox" checked={isDone} onChange={() => store.toggleReminder(r.id)} className={styles.remCb} />
                <div>
                  <div className={`${styles.remText} ${isDone ? styles.strikethrough : ''}`}>{r.text}</div>
                  {r.date && !isRecur && <div className={`${styles.remDue} ${overdue ? styles.overdue : ''}`}>{overdue ? 'Overdue · ' : ''}{formatDate(r.date)}</div>}
                  {isRecur && <div className={styles.remRecur}>↻ {r.recur}</div>}
                </div>
              </div>
            )
          })}
      </Section>

      <Section label="Coming up">
        {upcoming.length === 0
          ? <Empty text="Nothing in the next 7 days." />
          : upcoming.slice(0, 5).map((e, i) => (
            <div key={i} className={styles.upItem}>
              <div className={styles.upDot} style={{ background: areaColor(e.area) }} />
              <div>
                <div className={styles.upTitle}>{e.title}</div>
                <div className={styles.upWhen}>{formatDateShort(e._date)}{e.time ? ' · ' + e.time : ''}</div>
              </div>
            </div>
          ))}
      </Section>
    </div>
  )
}
