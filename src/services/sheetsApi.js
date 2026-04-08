const BASE_URL = import.meta.env.VITE_SHEETS_URL
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY

if (!BASE_URL) console.error('[sheetsApi] VITE_SHEETS_URL is not set — check your .env file')
if (!API_KEY) console.error('[sheetsApi] VITE_SHEETS_API_KEY is not set — check your .env file')

async function get(params = {}) {
  const url = new URL(BASE_URL)
  url.searchParams.set('key', API_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`GET failed: ${res.status}`)
  return res.json()
}

async function post(body) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ key: API_KEY, ...body }),
  })
  if (!res.ok) throw new Error(`POST failed: ${res.status}`)
  return res.json()
}

export async function getAgents() {
  try {
    return await get({ action: 'agents' })
  } catch (err) {
    console.error('getAgents:', err)
    return []
  }
}

export async function getRuns(limit = 20) {
  try {
    return await get({ action: 'runs', limit: String(limit) })
  } catch (err) {
    console.error('getRuns:', err)
    return []
  }
}

export async function getDashboardSummary() {
  try {
    return await get()
  } catch (err) {
    console.error('getDashboardSummary:', err)
    return null
  }
}

export async function logRun(agentId, outputSummary, tokensUsed, status, trigger) {
  try {
    return await post({
      action: 'logRun',
      agent_id: agentId,
      output_summary: outputSummary,
      tokens_used: tokensUsed,
      status,
      trigger,
    })
  } catch (err) {
    console.error('logRun:', err)
    return { success: false, error: err.message }
  }
}

export async function setAgentStatus(agentId, status) {
  try {
    return await post({ action: 'setStatus', agent_id: agentId, status })
  } catch (err) {
    console.error('setAgentStatus:', err)
    return { success: false, error: err.message }
  }
}

export async function addAgent(agentData) {
  try {
    return await post({ action: 'addAgent', ...agentData })
  } catch (err) {
    console.error('addAgent:', err)
    return { success: false, error: err.message }
  }
}

export async function updateAgentConfig(agentId, promptConfig, notes) {
  try {
    return await post({
      action: 'updateConfig',
      agent_id: agentId,
      prompt_config: promptConfig,
      notes,
    })
  } catch (err) {
    console.error('updateAgentConfig:', err)
    return { success: false, error: err.message }
  }
}

export async function testConnection() {
  try {
    const data = await getDashboardSummary()
    if (data) {
      console.log('\u2713 Sheets connection working')
      return true
    }
    console.error('testConnection: No data returned')
    return false
  } catch (err) {
    console.error('testConnection failed:', err)
    return false
  }
}
