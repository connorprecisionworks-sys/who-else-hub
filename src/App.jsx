import { useState, useCallback } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { useAuth } from './components/PasswordGate'
import PasswordGate from './components/PasswordGate'
import Layout from './components/Layout'
import Panel, { Field, Input, SaveBtn, RecurPicker } from './components/Panel'

import Home from './pages/Home'
import Calendar from './pages/Calendar'
import People from './pages/People'
import Meetings from './pages/Meetings'
import Tasks from './pages/Tasks'
import Notes from './pages/Notes'
import Pitch from './pages/Pitch'
import MeetingMode from './pages/MeetingMode'
import LinkedIn from './pages/LinkedIn'
import Agents from './pages/Agents'
import Projects from './pages/Projects'
import Ideas from './pages/Ideas'
import ContentPipeline from './pages/ContentPipeline'
import AITools from './pages/AITools'
import EmailSnapshot from './pages/EmailSnapshot'
import Assistant from './components/Assistant'

function HabitForm({ store, onClose }) {
  const [f, setF] = useState({ name: '', icon: '', recur: 'daily' })
  const save = () => { if (!f.name) return; store.addHabit(f); onClose() }
  return (
    <>
      <Field label="Habit *"><Input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Morning prayer, Review notes…" /></Field>
      <Field label="Runs every"><RecurPicker value={f.recur} onChange={v => setF(p => ({ ...p, recur: v }))} /></Field>
      <Field label="Icon / Emoji"><Input value={f.icon} onChange={e => setF(p => ({ ...p, icon: e.target.value }))} placeholder="📚" style={{ maxWidth: 80 }} /></Field>
      <SaveBtn onClick={save} />
    </>
  )
}

function AppInner({ lock }) {
  const store = useStore()
  const navigate = useNavigate()

  const [quickPanel, setQuickPanel] = useState({ open: false, type: null })
  const closeQuick = useCallback(() => setQuickPanel({ open: false, type: null }), [])
  const openQuick = useCallback((type) => {
    const routeMap = { person: '/people', meeting: '/meetings', event: '/calendar', task: '/tasks', reminder: '/tasks', habit: '/', note: '/notes' }
    if (routeMap[type]) navigate(routeMap[type])
    setQuickPanel({ open: true, type })
  }, [navigate])

  const [calPanel, setCalPanel]     = useState({ open: false, id: null })
  const [peoplePanel, setPeoplePanel] = useState({ open: false, id: null })
  const [meetPanel, setMeetPanel]   = useState({ open: false, id: null })
  const [taskPanel, setTaskPanel]   = useState({ open: false, type: 'task', id: null })
  const [notePanel, setNotePanel]   = useState({ open: false, id: null })
  const [projPanel, setProjPanel]   = useState({ open: false, id: null })

  return (
    <>
      <Layout onAdd={openQuick} onLock={lock}>
        <Routes>
          <Route path="/"             element={<Home store={store} onAdd={openQuick} />} />
          <Route path="/calendar"     element={<Calendar store={store} panelOpen={calPanel.open} panelId={calPanel.id} onOpenPanel={id => setCalPanel({ open: true, id })} onClosePanel={() => setCalPanel({ open: false, id: null })} />} />
          <Route path="/people"       element={<People store={store} panelOpen={peoplePanel.open} panelId={peoplePanel.id} onClosePanel={(id, open) => setPeoplePanel({ open: !!open, id: id || null })} />} />
          <Route path="/meetings"     element={<Meetings store={store} panelOpen={meetPanel.open} panelId={meetPanel.id} onOpenPanel={id => setMeetPanel({ open: true, id })} onClosePanel={() => setMeetPanel({ open: false, id: null })} />} />
          <Route path="/tasks"        element={<Tasks store={store} panelOpen={taskPanel.open} panelType={taskPanel.type} panelId={taskPanel.id} onOpenPanel={(type, id) => setTaskPanel({ open: true, type, id })} onClosePanel={() => setTaskPanel({ open: false, type: 'task', id: null })} />} />
          <Route path="/notes"        element={<Notes store={store} panelOpen={notePanel.open} panelId={notePanel.id} onOpenPanel={id => setNotePanel({ open: true, id })} onClosePanel={() => setNotePanel({ open: false, id: null })} />} />
          <Route path="/pitch"        element={<Pitch store={store} />} />
          <Route path="/projects"     element={<Projects store={store} panelOpen={projPanel.open} panelId={projPanel.id} onOpenPanel={id => setProjPanel({ open: true, id })} onClosePanel={() => setProjPanel({ open: false, id: null })} />} />
          <Route path="/ideas"       element={<Ideas store={store} />} />
          <Route path="/content"     element={<ContentPipeline store={store} />} />
          <Route path="/linkedin"     element={<LinkedIn />} />
          <Route path="/agents"      element={<Agents />} />
          <Route path="/ai-tools"    element={<AITools />} />
          <Route path="/email"       element={<EmailSnapshot />} />
          <Route path="/meeting-mode" element={<MeetingMode store={store} />} />
        </Routes>
      </Layout>

      <Panel title={quickPanel.type ? quickPanel.type.charAt(0).toUpperCase() + quickPanel.type.slice(1) : ''} open={quickPanel.open} onClose={closeQuick}>
        {quickPanel.type === 'habit' && <HabitForm store={store} onClose={closeQuick} />}
      </Panel>

      <Assistant />
    </>
  )
}

export default function App() {
  const { unlocked, unlock, lock } = useAuth()
  if (!unlocked) return <PasswordGate onUnlock={unlock} />
  return <AppInner lock={lock} />
}
