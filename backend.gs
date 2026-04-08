/**
 * WHO ELSE HUB — Agents Backend
 * Paste this into Google Apps Script (Extensions → Apps Script)
 * inside the spreadsheet created by setup.gs.
 *
 * After pasting:
 * 1. Run setup.gs first to create sheets and seed data.
 * 2. Go to Project Settings → Script Properties → Add:
 *    Property: API_KEY   Value: (your chosen key)
 * 3. Deploy → New deployment → Web app
 *    Execute as: Me
 *    Who has access: Anyone
 * 4. Copy the web app URL into your .env file.
 */

function doGet(e) {
  try {
    var key = (e.parameter || {}).key || ''
    if (!validateKey(key)) return jsonResponse({ error: 'Unauthorized' }, 401)

    var action = (e.parameter || {}).action || 'summary'

    if (action === 'agents') {
      return jsonResponse(getAllAgents())
    }
    if (action === 'runs') {
      var limit = parseInt((e.parameter || {}).limit) || 20
      return jsonResponse(getRecentRuns(limit))
    }
    if (action === 'unreadEmails') {
      return jsonResponse(getUnreadEmails())
    }
    return jsonResponse(getDashboardSummary())
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents)
    if (!validateKey(body.key)) return jsonResponse({ error: 'Unauthorized' }, 401)

    switch (body.action) {
      case 'logRun':
        return jsonResponse(logRun(body.agent_id, body.output_summary, body.tokens_used, body.status, body.trigger))
      case 'setStatus':
        return jsonResponse(setAgentStatus(body.agent_id, body.status))
      case 'addAgent':
        return jsonResponse(addAgent(body))
      case 'updateConfig':
        return jsonResponse(updateAgentConfig(body.agent_id, body.prompt_config, body.notes))
      default:
        return jsonResponse({ error: 'Unknown action: ' + body.action }, 400)
    }
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

// ── Helpers ──

function validateKey(key) {
  var stored = PropertiesService.getScriptProperties().getProperty('API_KEY')
  return key === stored
}

function jsonResponse(data, code) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

function getSheet(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)
  if (!sheet) {
    console.error('Sheet not found: "' + name + '" — check that the tab exists and the name matches exactly (case-sensitive)')
    throw new Error('Sheet not found: "' + name + '"')
  }
  return sheet
}

function getConfig(setting) {
  var sheet = getSheet('Config')
  var data = sheet.getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === setting) return data[i][1]
  }
  return null
}

function getTimezone() {
  return getConfig('timezone') || 'America/New_York'
}

function todayString() {
  return Utilities.formatDate(new Date(), getTimezone(), 'yyyy-MM-dd')
}

// ── Agents ──

function getAllAgents() {
  var sheet = getSheet('Agents')
  var data = sheet.getDataRange().getValues()
  var headers = data[0]
  var agents = []
  for (var i = 1; i < data.length; i++) {
    var obj = {}
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j]
    }
    agents.push(obj)
  }
  return agents
}

function findAgentRow(agentId) {
  var sheet = getSheet('Agents')
  var data = sheet.getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === agentId) return i + 1 // 1-indexed row
  }
  return -1
}

function setAgentStatus(agentId, status) {
  var row = findAgentRow(agentId)
  if (row === -1) return { success: false, error: 'Agent not found' }
  var sheet = getSheet('Agents')
  sheet.getRange(row, 4).setValue(status) // column D = status
  return { success: true }
}

function addAgent(data) {
  var sheet = getSheet('Agents')
  sheet.appendRow([
    data.agent_id,
    data.agent_name,
    data.type || 'other',
    'Paused',
    data.prompt_config || '',
    '',   // last_run
    0,    // total_tokens
    0,    // total_cost_usd
    data.schedule || '',
    data.notes || ''
  ])
  return { success: true, agent_id: data.agent_id }
}

function updateAgentConfig(agentId, promptConfig, notes) {
  var row = findAgentRow(agentId)
  if (row === -1) return { success: false, error: 'Agent not found' }
  var sheet = getSheet('Agents')
  sheet.getRange(row, 5).setValue(promptConfig) // column E = prompt_config
  sheet.getRange(row, 10).setValue(notes)       // column J = notes
  return { success: true }
}

// ── Runs ──

function logRun(agentId, outputSummary, tokensUsed, status, trigger) {
  console.log('logRun called — agentId: ' + agentId + ', status: ' + status + ', tokensUsed: ' + tokensUsed)
  console.log('logRun outputSummary: ' + (outputSummary || '(empty)'))

  var sheet = getSheet('Runs')
  var costPerK = parseFloat(getConfig('cost_per_1k_tokens')) || 0.003
  var tokens = Number(tokensUsed) || 0
  var cost = (tokens / 1000) * costPerK
  var now = new Date()
  var runId = 'run_' + now.getTime()

  console.log('logRun generated runId: ' + runId + ', cost: ' + cost)

  console.log('logRun writing to Runs sheet...')
  sheet.appendRow([
    runId,
    agentId,
    now,
    status,
    outputSummary || '',
    tokens,
    Math.round(cost * 10000) / 10000,
    trigger || 'manual',
    status === 'Failed' ? (outputSummary || '') : ''
  ])
  console.log('logRun Runs row appended')

  // Update agent row
  var agentRow = findAgentRow(agentId)
  console.log('logRun findAgentRow result: ' + agentRow)
  if (agentRow !== -1) {
    var agentSheet = getSheet('Agents')
    console.log('logRun updating Agents row ' + agentRow + '...')
    agentSheet.getRange(agentRow, 6).setValue(now)        // col F = last_run
    var prevTokens = Number(agentSheet.getRange(agentRow, 7).getValue()) || 0
    var prevCost = Number(agentSheet.getRange(agentRow, 8).getValue()) || 0
    agentSheet.getRange(agentRow, 7).setValue(prevTokens + tokens)   // col G = total_tokens
    agentSheet.getRange(agentRow, 8).setValue(Math.round((prevCost + cost) * 10000) / 10000) // col H = total_cost_usd
    agentSheet.getRange(agentRow, 4).setValue(status === 'Failed' ? 'Error' : 'Done') // col D = status
    console.log('logRun Agents row updated')
  } else {
    console.log('logRun WARNING: agent_id "' + agentId + '" not found in Agents sheet — skipping agent update')
  }

  // Email alerts
  try {
    checkAlerts(status, agentId)
  } catch (alertErr) {
    console.error('logRun alert check failed (non-fatal): ' + alertErr.message)
  }

  console.log('logRun complete — runId: ' + runId)
  return { success: true, runId: runId }
}

function getRecentRuns(limit) {
  var sheet = getSheet('Runs')
  var data = sheet.getDataRange().getValues()
  var headers = data[0]
  var runs = []
  for (var i = data.length - 1; i >= 1 && runs.length < limit; i--) {
    var obj = {}
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j]
    }
    runs.push(obj)
  }
  return runs
}

// ── Dashboard Summary ──

function getDashboardSummary() {
  var agents = getAllAgents()
  var today = todayString()
  var tz = getTimezone()

  var activeAgents = 0, pausedAgents = 0
  for (var i = 0; i < agents.length; i++) {
    if (agents[i].status === 'Running') activeAgents++
    if (agents[i].status === 'Paused') pausedAgents++
  }

  // Today's runs
  var runsSheet = getSheet('Runs')
  var runsData = runsSheet.getDataRange().getValues()
  var tasksToday = 0, completedToday = 0, failedToday = 0, tokensToday = 0, costToday = 0
  for (var i = 1; i < runsData.length; i++) {
    var ts = runsData[i][2]
    if (ts instanceof Date) {
      var runDate = Utilities.formatDate(ts, tz, 'yyyy-MM-dd')
      if (runDate === today) {
        tasksToday++
        if (runsData[i][3] === 'Success') completedToday++
        if (runsData[i][3] === 'Failed') failedToday++
        tokensToday += (runsData[i][5] || 0)
        costToday += (runsData[i][6] || 0)
      }
    }
  }

  var recentRuns = getRecentRuns(20)

  return {
    activeAgents: activeAgents,
    pausedAgents: pausedAgents,
    totalAgents: agents.length,
    tasksToday: tasksToday,
    completedToday: completedToday,
    failedToday: failedToday,
    tokensToday: tokensToday,
    costToday: Math.round(costToday * 100) / 100,
    agents: agents,
    recentRuns: recentRuns
  }
}

// ── Alerts ──

function checkAlerts(status, agentId) {
  var alertEmail = getConfig('alert_email')
  if (!alertEmail || alertEmail === 'REPLACE_ME') return

  if (status === 'Failed') {
    MailApp.sendEmail(
      alertEmail,
      'Who Else Hub — Agent Failed: ' + agentId,
      'Agent "' + agentId + '" logged a failed run at ' + new Date().toISOString() + '.\n\nCheck the Agents dashboard for details.'
    )
  }

  // Check daily cost threshold
  var summary = getDashboardSummary()
  var costLimit = parseFloat(getConfig('daily_cost_alert')) || 5.00
  if (summary.costToday > costLimit) {
    MailApp.sendEmail(
      alertEmail,
      'Who Else Hub — Daily Cost Alert: $' + summary.costToday.toFixed(2),
      'Daily agent cost has exceeded $' + costLimit.toFixed(2) + '.\nCurrent total: $' + summary.costToday.toFixed(2) + '\n\nCheck the Agents dashboard.'
    )
  }
}

// ── Daily Email Trigger ──

function createDailyEmailTrigger() {
  // Delete existing triggers for logDailyEmailRun to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers()
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'logDailyEmailRun') {
      ScriptApp.deleteTrigger(triggers[i])
      console.log('Deleted existing logDailyEmailRun trigger')
    }
  }

  ScriptApp.newTrigger('logDailyEmailRun')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create()

  console.log('Trigger created successfully')
}

function logDailyEmailRun() {
  try {
    var result = logRun(
      'email-summary',
      'Daily email summary completed via Cowork',
      3000,
      'Completed',
      'Scheduled'
    )
    console.log('logDailyEmailRun success: ' + JSON.stringify(result))
  } catch (err) {
    console.error('logDailyEmailRun failed: ' + err.message)
    try {
      logRun('email-summary', err.message, 0, 'Failed', 'Scheduled')
    } catch (e) {
      console.error('Failed to log error run: ' + e.message)
    }
  }
}

// ── Gmail ──

function getUnreadEmails() {
  try {
    var unreadCount = GmailApp.getInboxUnreadCount()
    var threads = GmailApp.search('is:unread', 0, 5)
    var emails = []
    for (var i = 0; i < threads.length; i++) {
      var msg = threads[i].getMessages()[0]
      emails.push({
        subject: msg.getSubject(),
        from: msg.getFrom(),
        date: Utilities.formatDate(msg.getDate(), getTimezone(), 'MMM d, h:mm a'),
        snippet: threads[i].getFirstMessageSubject()
      })
    }
    return { unreadCount: unreadCount, emails: emails }
  } catch (err) {
    console.error('getUnreadEmails failed: ' + err.message)
    return { error: err.message, unreadCount: 0, emails: [] }
  }
}

// ── Manual Test ──

function testLogRun() {
  var result = logRun(
    'email-summary',
    'Test run from Apps Script editor',
    1000,
    'Success',
    'manual'
  )
  console.log('testLogRun result: ' + JSON.stringify(result))
}
