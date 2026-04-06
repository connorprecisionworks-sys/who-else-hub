import { useState, useMemo } from 'react'
import Panel, { Field, Input, Textarea, Select, Row, SaveBtn, DelBtn, AreaPicker, RecurPicker } from '../components/Panel'
import { matchesRecurrence, formatDate, AREA_COLORS } from '../store/useStore'
import styles from './Calendar.module.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function EventForm({ event, store, prefillDate, onClose }) {
  const [f, setF] = useState({
    title: event?.title || '',
    area: event?.area || 'consult',
    date: event?.date || prefillDate || '',
    time: event?.time || '',
    endTime: event?.endTime || '',
    location: event?.location || '',
    recur: event?.recur || 'none',
    notes: event?.notes || '',
  })
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const save = () => {
    if (!f.title) return
    event ? store.updateEvent(event.id, f) : store.addEvent(f)
    onClose()
  }
  const del = () => { if (confirm('Delete?')) { store.deleteEvent(event.id); onClose() } }
  return (
    <>
      <Field label="Title *"><Input value={f.title} onChange={s('title')} placeholder="Event name" /></Field>
      <Field label="Area"><AreaPicker value={f.area} onChange={v => setF(p => ({ ...p, area: v }))} /></Field>
      <Row>
        <Field label="Date"><Input type="date" value={f.date} onChange={s('date')} /></Field>
        <Field label="Time"><Input type="time" value={f.time} onChange={s('time')} /></Field>
      </Row>
      <Row>
        <Field label="End Time"><Input type="time" value={f.endTime} onChange={s('endTime')} /></Field>
        <Field label="Location"><Input value={f.location} onChange={s('location')} placeholder="Where?" /></Field>
      </Row>
      <Field label="Recurring"><RecurPicker value={f.recur} onChange={v => setF(p => ({ ...p, recur: v }))} /></Field>
      <Field label="Notes"><Textarea value={f.notes} onChange={s('notes')} style={{ minHeight: 60 }} /></Field>
      <SaveBtn onClick={save} />
      {event && <DelBtn onClick={del} />}
    </>
  )
}

function MonthView({ year, month, events, meetings, onDayClick, onEventClick }) {
  const today = new Date().toISOString().split('T')[0]
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()

  const cells = []
  // prev month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, current: false, dateStr: null })
  }
  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ day: d, current: true, dateStr: ds })
  }
  // next month fill
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) cells.push({ day: i, current: false, dateStr: null })

  const getItems = (ds) => {
    const evs = events.filter(e => matchesRecurrence(e, ds))
    const mtgs = meetings.filter(m => m.date === ds)
    return [...evs, ...mtgs.map(m => ({ ...m, _isMtg: true }))].sort((a,b) => (a.time||'').localeCompare(b.time||''))
  }

  return (
    <div className={styles.monthGrid}>
      <div className={styles.dowRow}>{DAYS.map(d => <div key={d} className={styles.dow}>{d}</div>)}</div>
      <div className={styles.daysGrid}>
        {cells.map((cell, i) => {
          const items = cell.dateStr ? getItems(cell.dateStr) : []
          const isToday = cell.dateStr === today
          return (
            <div
              key={i}
              className={`${styles.dayCell} ${!cell.current ? styles.otherMonth : ''}`}
              onClick={() => cell.dateStr && onDayClick(cell.dateStr)}
            >
              <div className={`${styles.dayNum} ${isToday ? styles.todayNum : ''}`}>{cell.day}</div>
              <div className={styles.dayEvents}>
                {items.slice(0, 3).map((ev, j) => {
                  const c = AREA_COLORS[ev.area]
                  return (
                    <div
                      key={j}
                      className={styles.dayEvent}
                      style={{ background: c?.mid || 'var(--border2)' }}
                      onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                    >
                      {ev.time ? ev.time.slice(0,5) + ' ' : ''}{ev.title}
                    </div>
                  )
                })}
                {items.length > 3 && <div className={styles.more}>+{items.length - 3} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ weekStart, events, meetings, onSlotClick, onEventClick }) {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const START_H = 6, HOURS = 17, PX = 48

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i)
    return { d, ds: d.toISOString().split('T')[0] }
  })

  const getItems = (ds) => {
    const evs = events.filter(e => matchesRecurrence(e, ds) && e.time)
    const mtgs = meetings.filter(m => m.date === ds && m.time)
    return [...evs, ...mtgs.map(m => ({ ...m, _isMtg: true }))]
  }

  return (
    <div className={styles.weekGrid}>
      <div className={styles.weekHdr}>
        <div className={styles.weekHdrTime} />
        {weekDays.map(({ d, ds }) => {
          const isToday = ds === today
          return (
            <div key={ds} className={styles.weekHdrCell}>
              <div className={styles.weekDow}>{DAYS[d.getDay()]}</div>
              <div className={`${styles.weekDayNum} ${isToday ? styles.weekTodayNum : ''}`}>{d.getDate()}</div>
            </div>
          )
        })}
      </div>
      <div className={styles.weekBody}>
        <div className={styles.weekTimeCol}>
          {Array.from({ length: HOURS }, (_, h) => {
            const hour = START_H + h
            const label = hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`
            return <div key={h} className={styles.weekHourLabel}>{label}</div>
          })}
        </div>
        {weekDays.map(({ ds }) => {
          const isToday = ds === today
          const items = getItems(ds)
          return (
            <div key={ds} className={styles.weekDayCol}>
              {Array.from({ length: HOURS }, (_, h) => (
                <div key={h} className={styles.weekHourLine} onClick={() => onSlotClick(ds, `${String(START_H + h).padStart(2,'0')}:00`)} />
              ))}
              {items.map((ev, j) => {
                const [hh, mm] = ev.time.split(':').map(Number)
                const top = (hh - START_H) * PX + (mm / 60) * PX
                let durMin = 60
                if (ev.endTime) { const [eh,em] = ev.endTime.split(':').map(Number); durMin = (eh-hh)*60+(em-mm); if(durMin<=0)durMin=30 }
                const height = Math.max(20, (durMin / 60) * PX)
                const c = AREA_COLORS[ev.area]
                return (
                  <div
                    key={j}
                    className={styles.weekEvent}
                    style={{ top, height, background: c?.mid || 'var(--border2)' }}
                    onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                  >
                    <div style={{ fontWeight: 500 }}>{ev.time.slice(0,5)}</div>
                    <div>{ev.title}</div>
                  </div>
                )
              })}
              {isToday && nowMin >= START_H * 60 && (
                <div className={styles.nowLine} style={{ top: (nowMin - START_H * 60) / 60 * PX }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Calendar({ store, panelOpen, panelId, onOpenPanel, onClosePanel }) {
  const [view, setView] = useState('month')
  const [curDate, setCurDate] = useState(new Date())
  const [prefillDate, setPrefillDate] = useState('')
  const [prefillTime, setPrefillTime] = useState('')

  const editEvent = panelId ? store.events.find(e => e.id === panelId) : null

  const nav = (dir) => {
    const d = new Date(curDate)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    else d.setDate(d.getDate() + dir * 7)
    setCurDate(d)
  }

  const weekStart = useMemo(() => {
    const d = new Date(curDate)
    d.setDate(d.getDate() - d.getDay())
    return d
  }, [curDate])

  const title = view === 'month'
    ? `${MONTHS[curDate.getMonth()]} ${curDate.getFullYear()}`
    : (() => {
        const end = new Date(weekStart); end.setDate(end.getDate() + 6)
        return `${weekStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-US',{month:'short',day:'numeric'})}, ${weekStart.getFullYear()}`
      })()

  const handleDayClick = (ds) => {
    setPrefillDate(ds); setPrefillTime('')
    onOpenPanel(null)
  }
  const handleSlotClick = (ds, time) => {
    setPrefillDate(ds); setPrefillTime(time)
    onOpenPanel(null)
  }
  const handleEventClick = (ev) => { onOpenPanel(ev.id) }

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.barLeft}>
          <button className={styles.iconBtn} onClick={() => nav(-1)}>‹</button>
          <button className={styles.iconBtn} onClick={() => nav(1)}>›</button>
          <span className={styles.calTitle}>{title}</span>
          <button className={styles.ghost} onClick={() => setCurDate(new Date())}>Today</button>
        </div>
        <div className={styles.barRight}>
          <div className={styles.segCtrl}>
            <button className={`${styles.seg} ${view === 'month' ? styles.segActive : ''}`} onClick={() => setView('month')}>Month</button>
            <button className={`${styles.seg} ${view === 'week' ? styles.segActive : ''}`} onClick={() => setView('week')}>Week</button>
          </div>
          <button className={styles.primaryBtn} onClick={() => { setPrefillDate(''); setPrefillTime(''); onOpenPanel(null) }}>+ Event</button>
        </div>
      </div>

      <div className={styles.legend}>
        {Object.entries(AREA_COLORS).map(([k, c]) => (
          <span key={k} className={styles.legItem}>
            <span className={styles.legDot} style={{ background: c.mid }} />
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </span>
        ))}
      </div>

      {view === 'month'
        ? <MonthView year={curDate.getFullYear()} month={curDate.getMonth()} events={store.events} meetings={store.meetings} onDayClick={handleDayClick} onEventClick={handleEventClick} />
        : <WeekView weekStart={weekStart} events={store.events} meetings={store.meetings} onSlotClick={handleSlotClick} onEventClick={handleEventClick} />
      }

      <Panel title={editEvent ? 'Edit Event' : 'Add Event'} open={panelOpen} onClose={onClosePanel}>
        <EventForm
          event={editEvent}
          store={store}
          prefillDate={prefillDate}
          onClose={() => { onClosePanel(); setPrefillDate(''); setPrefillTime('') }}
        />
      </Panel>
    </div>
  )
}
