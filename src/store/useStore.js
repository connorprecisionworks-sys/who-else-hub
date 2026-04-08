import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'we_hub_v4'

const DEFAULT_PORTFOLIO = {
  name: 'Who Else',
  tagline: 'The student innovation collective at the intersection of faith, technology, and the next generation.',
  powered: 'Powered by Genesis Studios @ Austin Christian University',
  question: '"Who else should be trusted to pioneer the future of technology?"',
  questionSub: "This isn't rhetorical. It's a selection mechanism. Who Else identifies the young founders who answer that question with their work — not their words.",
  mission: "A high-agency cohort of high school builders who don't wait for permission to ship. We're the talent pipeline, competition engine, and community hub for faith-driven founders.",
  infra: 'Genesis Studios at ACU provides the capital, mentorship, network, and institutional credibility.',
  offers: ['AI-judged pitch competition with prizes', '1-on-1 mentorship from Genesis Studios', 'Weekly Mission Drops — build challenges', 'Team formation with other student founders'],
  who: ['High school builders with a real idea', 'Faith-driven problem solvers', 'Students who ship, not just talk', 'Future founders who want to be found early'],
  teachersMsg: 'We partner with schools and churches to bring the Who Else experience to your students. At no cost to them.',
  email: 'whoelse@genesistudios.com',
}

const DEFAULT_STATE = {
  people: [],
  events: [],
  meetings: [],
  tasks: [],
  reminders: [],
  habits: [],
  habitLog: {},
  notes: [],
  projects: [],
  ideas: [],
  contentItems: [],
  portfolio: DEFAULT_PORTFOLIO,
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw)
    parsed.portfolio = { ...DEFAULT_PORTFOLIO, ...parsed.portfolio }
    return { ...DEFAULT_STATE, ...parsed }
  } catch { return DEFAULT_STATE }
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(d) {
  if (!d) return ''
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateShort(d) {
  if (!d) return ''
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function isPast(d) {
  return d && new Date(d + 'T00:00:00') < new Date(new Date().toDateString())
}

export function isUpcoming(d) {
  return d && new Date(d + 'T00:00:00') >= new Date(new Date().toDateString())
}

export const AREA_LABELS = { we: 'Who Else', consult: 'Consulting', personal: 'Personal', content: 'Content', finance: 'Finance' }
export const AREA_COLORS = {
  we: { bg: 'var(--we-s)', fg: 'var(--we-d)', mid: 'var(--we)' },
  consult: { bg: 'var(--cn-s)', fg: 'var(--cn-d)', mid: 'var(--cn)' },
  personal: { bg: 'var(--pe-s)', fg: 'var(--pe-d)', mid: 'var(--pe)' },
  content: { bg: 'var(--co-s)', fg: 'var(--co-d)', mid: 'var(--co)' },
  finance: { bg: 'var(--fi-s)', fg: 'var(--fi-d)', mid: 'var(--fi)' },
}

export function matchesRecurrence(item, d) {
  if (!item.recur || item.recur === 'none') return item.date === d
  if (item.date && d < item.date) return false
  const dt = new Date(d + 'T12:00:00')
  const dow = dt.getDay()
  const dom = dt.getDate()
  if (item.recur === 'daily') return true
  if (item.recur === 'weekday') return dow >= 1 && dow <= 5
  if (item.recur === 'weekly') {
    if (!item.date) return false
    return new Date(item.date + 'T12:00:00').getDay() === dow
  }
  if (item.recur === 'biweekly') {
    if (!item.date) return false
    const s = new Date(item.date + 'T12:00:00')
    if (s.getDay() !== dow) return false
    return Math.round((dt - s) / 604800000) % 2 === 0
  }
  if (item.recur === 'monthly') {
    if (!item.date) return false
    return new Date(item.date + 'T12:00:00').getDate() === dom
  }
  const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 }
  if (dayMap[item.recur] !== undefined) return dayMap[item.recur] === dow
  return false
}

export function useStore() {
  const [state, setState] = useState(loadState)

  // Persist on every change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  }, [state])

  const update = useCallback((key, fn) => {
    setState(prev => ({ ...prev, [key]: fn(prev[key]) }))
  }, [])

  const set = useCallback((key, val) => {
    setState(prev => ({ ...prev, [key]: val }))
  }, [])

  // People
  const addPerson = useCallback((p) => update('people', arr => [...arr, { ...p, id: uid(), createdAt: Date.now() }]), [update])
  const updatePerson = useCallback((id, p) => update('people', arr => arr.map(x => x.id === id ? { ...x, ...p } : x)), [update])
  const deletePerson = useCallback((id) => update('people', arr => arr.filter(x => x.id !== id)), [update])

  // Events
  const addEvent = useCallback((e) => update('events', arr => [...arr, { ...e, id: uid(), createdAt: Date.now() }]), [update])
  const updateEvent = useCallback((id, e) => update('events', arr => arr.map(x => x.id === id ? { ...x, ...e } : x)), [update])
  const deleteEvent = useCallback((id) => update('events', arr => arr.filter(x => x.id !== id)), [update])

  // Meetings
  const addMeeting = useCallback((m) => {
    const id = uid()
    setState(prev => ({
      ...prev,
      meetings: [...prev.meetings, { ...m, id, createdAt: Date.now() }],
      // auto-add to calendar
      events: m.date ? [...prev.events, { id: uid(), title: m.title, area: m.area, date: m.date, time: m.time, endTime: '', location: m.location, recur: 'none', notes: '', createdAt: Date.now(), _mtgRef: id }] : prev.events,
    }))
  }, [])
  const updateMeeting = useCallback((id, m) => update('meetings', arr => arr.map(x => x.id === id ? { ...x, ...m } : x)), [update])
  const deleteMeeting = useCallback((id) => update('meetings', arr => arr.filter(x => x.id !== id)), [update])

  // Tasks
  const addTask = useCallback((t) => update('tasks', arr => [...arr, { ...t, id: uid(), done: false, createdAt: Date.now() }]), [update])
  const updateTask = useCallback((id, t) => update('tasks', arr => arr.map(x => x.id === id ? { ...x, ...t } : x)), [update])
  const deleteTask = useCallback((id) => update('tasks', arr => arr.filter(x => x.id !== id)), [update])
  const toggleTask = useCallback((id) => update('tasks', arr => arr.map(x => x.id === id ? { ...x, done: !x.done } : x)), [update])

  // Reminders
  const addReminder = useCallback((r) => update('reminders', arr => [...arr, { ...r, id: uid(), done: false, createdAt: Date.now() }]), [update])
  const updateReminder = useCallback((id, r) => update('reminders', arr => arr.map(x => x.id === id ? { ...x, ...r } : x)), [update])
  const deleteReminder = useCallback((id) => update('reminders', arr => arr.filter(x => x.id !== id)), [update])
  const toggleReminder = useCallback((id) => {
    setState(prev => {
      const r = prev.reminders.find(x => x.id === id)
      if (!r) return prev
      if (!r.recur || r.recur === 'none') {
        return { ...prev, reminders: prev.reminders.map(x => x.id === id ? { ...x, done: !x.done } : x) }
      }
      const today = todayStr()
      const log = { ...prev.habitLog }
      log[today] = { ...log[today], ['rem_' + id]: !log[today]?.['rem_' + id] }
      return { ...prev, habitLog: log }
    })
  }, [])

  // Habits
  const addHabit = useCallback((h) => update('habits', arr => [...arr, { ...h, id: uid(), createdAt: Date.now() }]), [update])
  const updateHabit = useCallback((id, h) => update('habits', arr => arr.map(x => x.id === id ? { ...x, ...h } : x)), [update])
  const deleteHabit = useCallback((id) => update('habits', arr => arr.filter(x => x.id !== id)), [update])
  const toggleHabit = useCallback((id) => {
    const today = todayStr()
    setState(prev => {
      const log = { ...prev.habitLog }
      log[today] = { ...log[today], [id]: !log[today]?.[id] }
      return { ...prev, habitLog: log }
    })
  }, [])

  // Notes
  const addNote = useCallback((n) => update('notes', arr => [...arr, { ...n, id: uid(), createdAt: Date.now() }]), [update])
  const updateNote = useCallback((id, n) => update('notes', arr => arr.map(x => x.id === id ? { ...x, ...n } : x)), [update])
  const deleteNote = useCallback((id) => update('notes', arr => arr.filter(x => x.id !== id)), [update])

  // Projects
  const addProject = useCallback((p) => update('projects', arr => [...arr, { ...p, id: uid(), createdAt: Date.now() }]), [update])
  const updateProject = useCallback((id, p) => update('projects', arr => arr.map(x => x.id === id ? { ...x, ...p } : x)), [update])
  const deleteProject = useCallback((id) => update('projects', arr => arr.filter(x => x.id !== id)), [update])

  // Ideas
  const addIdea = useCallback((i) => update('ideas', arr => [...arr, { ...i, id: uid(), createdAt: Date.now() }]), [update])
  const deleteIdea = useCallback((id) => update('ideas', arr => arr.filter(x => x.id !== id)), [update])

  // Content Items
  const addContentItem = useCallback((c) => update('contentItems', arr => [...arr, { ...c, id: uid(), createdAt: Date.now() }]), [update])
  const updateContentItem = useCallback((id, c) => update('contentItems', arr => arr.map(x => x.id === id ? { ...x, ...c } : x)), [update])
  const deleteContentItem = useCallback((id) => update('contentItems', arr => arr.filter(x => x.id !== id)), [update])

  // Portfolio
  const updatePortfolio = useCallback((p) => set('portfolio', p), [set])

  const getEventsForDate = useCallback((d) => {
    return state.events.filter(e => matchesRecurrence(e, d))
  }, [state.events])

  return {
    ...state,
    addPerson, updatePerson, deletePerson,
    addEvent, updateEvent, deleteEvent,
    addMeeting, updateMeeting, deleteMeeting,
    addTask, updateTask, deleteTask, toggleTask,
    addReminder, updateReminder, deleteReminder, toggleReminder,
    addHabit, updateHabit, deleteHabit, toggleHabit,
    addNote, updateNote, deleteNote,
    addProject, updateProject, deleteProject,
    addIdea, deleteIdea,
    addContentItem, updateContentItem, deleteContentItem,
    updatePortfolio,
    getEventsForDate,
  }
}
