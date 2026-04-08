import { useState, useEffect, useCallback } from 'react'
import { getAgents, getRuns, getDashboardSummary, logRun, setAgentStatus, addAgent, updateAgentConfig, testConnection } from '../services/sheetsApi'
import styles from './Agents.module.css'

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d)) return String(ts)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusPill({ status }) {
  const cls = {
    Running: styles.pillRunning,
    Paused: styles.pillPaused,
    Error: styles.pillError,
    Done: styles.pillDone,
    Failed: styles.pillFailed,
    Success: styles.pillSuccess,
  }
  return <span className={`${styles.pill} ${cls[status] || ''}`}>{status}</span>
}

export default function Agents() {
  const [summary, setSummary] = useState(null)
  const [agents, setAgents] = useState([])
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editPrompt, setEditPrompt] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('loading')
  const [testMsg, setTestMsg] = useState(null)
  const [runMsg, setRunMsg] = useState({})
  const [bulkState, setBulkState] = useState(null)

  // Add form state
  const [form, setForm] = useState({ agent_name: '', agent_id: '', type: 'other', schedule: '', prompt_config: '', notes: '' })
  const [formError, setFormError] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const data = await getDashboardSummary()
      if (data) {
        setSummary(data)
        setAgents(data.agents || [])
        setRuns(data.recentRuns || [])
        setConnectionStatus('connected')
      } else {
        const [a, r] = await Promise.all([getAgents(), getRuns(20)])
        setAgents(a)
        setRuns(r)
        setConnectionStatus(a.length > 0 || r.length > 0 ? 'connected' : 'error')
      }
      setError(null)
    } catch (err) {
      setError('Failed to load data')
      setConnectionStatus('error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Auto-refresh activity log every 60s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const r = await getRuns(20)
        setRuns(r)
      } catch (_) {}
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleRun = async (agentId) => {
    setActionLoading(agentId + '-run')
    setRunMsg(m => ({ ...m, [agentId]: null }))
    try {
      await setAgentStatus(agentId, 'Running')
      const res = await logRun(agentId, 'Manual run triggered from dashboard', 0, 'Completed', 'Manual')
      await refresh()
      setRunMsg(m => ({ ...m, [agentId]: res?.success === false ? 'Failed \u2014 check console' : 'Run logged' }))
    } catch {
      setRunMsg(m => ({ ...m, [agentId]: 'Failed \u2014 check console' }))
    }
    setActionLoading(null)
    setTimeout(() => setRunMsg(m => ({ ...m, [agentId]: null })), 2000)
  }

  const handleBulkRun = async () => {
    const eligible = agents.filter(a => a.status === 'Running' || a.status === 'Done')
    if (eligible.length === 0) { setBulkState('No active agents'); setTimeout(() => setBulkState(null), 2000); return }
    for (let i = 0; i < eligible.length; i++) {
      setBulkState(`Logging ${i + 1} of ${eligible.length}\u2026`)
      await logRun(eligible[i].agent_id, 'Manual run triggered from dashboard', 0, 'Completed', 'Manual')
    }
    await refresh()
    setBulkState('All runs logged')
    setTimeout(() => setBulkState(null), 2000)
  }

  const handlePause = async (agentId) => {
    setActionLoading(agentId + '-pause')
    await setAgentStatus(agentId, 'Paused')
    await refresh()
    setActionLoading(null)
  }

  const handleEdit = (agent) => {
    setEditingId(agent.agent_id)
    setEditPrompt(agent.prompt_config || '')
    setEditNotes(agent.notes || '')
  }

  const handleEditSave = async () => {
    setActionLoading(editingId + '-edit')
    await updateAgentConfig(editingId, editPrompt, editNotes)
    setEditingId(null)
    await refresh()
    setActionLoading(null)
  }

  const handleTest = async () => {
    setTestMsg(null)
    const ok = await testConnection()
    setTestMsg(ok ? 'connected' : 'error')
    setTimeout(() => setTestMsg(null), 3000)
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    setForm(f => ({ ...f, agent_name: name, agent_id: slugify(name) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.agent_name || !form.agent_id) return
    setFormLoading(true)
    setFormError(null)
    const res = await addAgent(form)
    if (res.success) {
      setForm({ agent_name: '', agent_id: '', type: 'other', schedule: '', prompt_config: '', notes: '' })
      await refresh()
    } else {
      setFormError(res.error || 'Failed to add agent')
    }
    setFormLoading(false)
  }

  const activeCount = agents.filter(a => a.status === 'Running').length
  const tokensToday = summary?.tokensToday ?? 0
  const costToday = summary?.costToday ?? 0
  const tasksToday = summary?.tasksToday ?? 0

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <h2 className={styles.title}>Agents</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: "'DM Mono', monospace", color: connectionStatus === 'connected' ? '#166534' : connectionStatus === 'error' ? '#991b1b' : 'var(--t3)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: connectionStatus === 'connected' ? '#2d9e63' : connectionStatus === 'error' ? '#dc2626' : '#b0b0aa', display: 'inline-block' }} />
            {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Connection error \u2014 check your .env file' : 'Connecting\u2026'}
          </span>
          <button className={styles.actBtn} onClick={handleTest} style={{ fontSize: 11 }}>Test connection</button>
          <button className={styles.actBtn} onClick={handleBulkRun} disabled={!!bulkState && bulkState.startsWith('Logging')} style={{ fontSize: 11 }}>
            {bulkState && bulkState.startsWith('Logging') ? bulkState : 'Log all runs'}
          </button>
          {testMsg && (
            <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: testMsg === 'connected' ? '#166534' : '#991b1b' }}>
              {testMsg === 'connected' ? '\u2713 Working' : '\u2717 Failed'}
            </span>
          )}
          {bulkState && !bulkState.startsWith('Logging') && (
            <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: bulkState === 'All runs logged' ? '#166534' : '#991b1b' }}>
              {bulkState}
            </span>
          )}
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* Section 1 — Metrics */}
      <div className={styles.secLabel}>Overview</div>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Active Agents</div>
          <div className={styles.metricValue}>{loading ? '—' : activeCount}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Tasks Today</div>
          <div className={styles.metricValue}>{loading ? '—' : tasksToday}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Tokens Today</div>
          <div className={styles.metricValue}>{loading ? '—' : tokensToday.toLocaleString()}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Cost Today</div>
          <div className={styles.metricValue}>{loading ? '—' : `$${costToday.toFixed(2)}`}</div>
        </div>
      </div>

      {/* Section 2 — Agent Roster */}
      <div className={styles.secLabel}>Agent Roster</div>
      {loading ? (
        <p className={styles.loading}>Loading agents…</p>
      ) : agents.length === 0 ? (
        <p className={styles.empty}>No agents yet. Add one below.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Agent Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Last Run</th>
              <th>Total Tokens</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <>
                <tr key={a.agent_id}>
                  <td className={styles.agentName}>{a.agent_name}</td>
                  <td><span className={styles.agentType}>{a.type}</span></td>
                  <td><StatusPill status={a.status} /></td>
                  <td>{formatTime(a.last_run)}</td>
                  <td>{(a.total_tokens || 0).toLocaleString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={`${styles.actBtn} ${styles.actBtnRun}`}
                        onClick={() => handleRun(a.agent_id)}
                        disabled={actionLoading === a.agent_id + '-run'}
                      >
                        {actionLoading === a.agent_id + '-run' ? 'Running\u2026' : 'Run'}
                      </button>
                      {runMsg[a.agent_id] && (
                        <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: runMsg[a.agent_id] === 'Run logged' ? '#166534' : '#991b1b' }}>
                          {runMsg[a.agent_id]}
                        </span>
                      )}
                      <button
                        className={styles.actBtn}
                        onClick={() => handlePause(a.agent_id)}
                        disabled={actionLoading === a.agent_id + '-pause'}
                      >
                        Pause
                      </button>
                      <button className={styles.actBtn} onClick={() => handleEdit(a)}>Edit</button>
                    </div>
                  </td>
                </tr>
                {editingId === a.agent_id && (
                  <tr key={a.agent_id + '-edit'}>
                    <td colSpan="6">
                      <div className={styles.editPanel}>
                        <label>Prompt Config</label>
                        <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} />
                        <label>Notes</label>
                        <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                        <div>
                          <button className={styles.editSave} onClick={handleEditSave} disabled={actionLoading === editingId + '-edit'}>
                            {actionLoading === editingId + '-edit' ? 'Saving…' : 'Save'}
                          </button>
                          <button className={styles.editCancel} onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}

      {/* Section 3 — Activity Log */}
      <div className={styles.secLabel}>Activity Log</div>
      {runs.length === 0 ? (
        <p className={styles.empty}>No activity yet.</p>
      ) : (
        <table className={styles.logTable}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Agent</th>
              <th>Summary</th>
              <th>Tokens</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r, i) => (
              <tr key={r.run_id || i}>
                <td className={styles.logTime}>{formatTime(r.timestamp)}</td>
                <td>{r.agent_id}</td>
                <td>{r.output_summary}</td>
                <td>{(r.tokens_used || 0).toLocaleString()}</td>
                <td><StatusPill status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Section 4 — Add New Agent */}
      <div className={styles.secLabel}>Add New Agent</div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div>
            <label className={styles.formLabel}>Agent Name</label>
            <input className={styles.formInput} value={form.agent_name} onChange={handleNameChange} placeholder="e.g. Daily Email Summary" />
          </div>
          <div>
            <label className={styles.formLabel}>Agent ID</label>
            <input className={styles.formInput} value={form.agent_id} onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))} placeholder="auto-generated" />
          </div>
          <div>
            <label className={styles.formLabel}>Type</label>
            <select className={styles.formSelect} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="scheduling">Scheduling</option>
              <option value="email">Email</option>
              <option value="coding">Coding</option>
              <option value="outreach">Outreach</option>
              <option value="research">Research</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={styles.formLabel}>Schedule</label>
            <input className={styles.formInput} value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} placeholder="e.g. Every 30 min" />
          </div>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Prompt Config</label>
          <textarea className={styles.formTextarea} value={form.prompt_config} onChange={e => setForm(f => ({ ...f, prompt_config: e.target.value }))} placeholder="System prompt or configuration…" />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Notes</label>
          <textarea className={styles.formTextarea} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes…" />
        </div>
        {formError && <p className={styles.error}>{formError}</p>}
        <button className={styles.submitBtn} type="submit" disabled={formLoading || !form.agent_name}>
          {formLoading ? 'Adding…' : 'Add Agent'}
        </button>
      </form>
    </div>
  )
}
