/**
 * WHO ELSE HUB — Agents Setup Script
 * Run this ONCE to create sheets and seed data.
 *
 * Steps:
 * 1. Create a new Google Spreadsheet
 * 2. Go to Extensions → Apps Script
 * 3. Paste this file into a new script file (e.g. setup.gs)
 * 4. Click Run → setupAgentsHub
 * 5. Grant permissions when prompted
 * 6. Then paste backend.gs into the same project
 */

function setupAgentsHub() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()

  // ── 1. Agents sheet ──
  var agents = ss.getSheetByName('Agents') || ss.insertSheet('Agents')
  agents.clear()
  agents.getRange(1, 1, 1, 10).setValues([[
    'agent_id', 'agent_name', 'type', 'status', 'prompt_config',
    'last_run', 'total_tokens', 'total_cost_usd', 'schedule', 'notes'
  ]])
  agents.getRange(1, 1, 1, 10).setFontWeight('bold')

  // ── 2. Runs sheet ──
  var runs = ss.getSheetByName('Runs') || ss.insertSheet('Runs')
  runs.clear()
  runs.getRange(1, 1, 1, 9).setValues([[
    'run_id', 'agent_id', 'timestamp', 'status', 'output_summary',
    'tokens_used', 'cost_usd', 'trigger', 'error_detail'
  ]])
  runs.getRange(1, 1, 1, 9).setFontWeight('bold')

  // ── 3. Dashboard sheet ──
  var dash = ss.getSheetByName('Dashboard') || ss.insertSheet('Dashboard')
  dash.clear()
  dash.getRange(1, 1, 1, 3).setValues([['Metric', 'Value', 'Notes']])
  dash.getRange(1, 1, 1, 3).setFontWeight('bold')

  dash.getRange(2, 1, 7, 3).setValues([
    ['Active agents',    '=COUNTIF(Agents!D:D,"Running")',                               'Agents with status Running'],
    ['Tasks today',      '=COUNTIF(Runs!C:C,">="&TODAY())',                               'All runs logged today'],
    ['Completed today',  '=COUNTIFS(Runs!C:C,">="&TODAY(),Runs!D:D,"Success")',           'Successful runs today'],
    ['Failed today',     '=COUNTIFS(Runs!C:C,">="&TODAY(),Runs!D:D,"Failed")',            'Failed runs today'],
    ['Tokens today',     '=SUMPRODUCT((Runs!C:C>=TODAY())*1,Runs!F:F)',                   'Total tokens used today'],
    ['Cost today',       '=SUMPRODUCT((Runs!C:C>=TODAY())*1,Runs!G:G)',                   'Total cost today ($)'],
    ['Cost this month',  '=SUMPRODUCT((MONTH(Runs!C:C)=MONTH(TODAY()))*(YEAR(Runs!C:C)=YEAR(TODAY()))*1,Runs!G:G)', 'Total cost this month ($)']
  ])

  // ── 4. Config sheet ──
  var config = ss.getSheetByName('Config') || ss.insertSheet('Config')
  config.clear()
  config.getRange(1, 1, 1, 2).setValues([['setting', 'value']])
  config.getRange(1, 1, 1, 2).setFontWeight('bold')

  config.getRange(2, 1, 5, 2).setValues([
    ['cost_per_1k_tokens', 0.003],
    ['api_key',            'REPLACE_ME'],
    ['alert_email',        'REPLACE_ME'],
    ['daily_cost_alert',   5.00],
    ['timezone',           'America/New_York']
  ])

  // ── 5. Seed starter agents ──
  agents.getRange(2, 1, 4, 10).setValues([
    ['email-summary',  'Daily Email Summary', 'email',      'Paused', '', '', 0, 0, 'Daily at 7 AM',  'Summarizes inbox and sends digest'],
    ['calendar-mgr',   'Calendar Manager',    'scheduling', 'Paused', '', '', 0, 0, 'Every 30 min',   'Monitors calendar for conflicts'],
    ['code-assistant', 'Code Assistant',       'coding',     'Paused', '', '', 0, 0, 'On demand',      'Assists with code review and fixes'],
    ['lead-gen',       'Lead Gen Outreach',    'outreach',   'Paused', '', '', 0, 0, 'Daily at 9 AM',  'Generates and qualifies leads']
  ])

  // ── Clean up default Sheet1 if it exists and is empty ──
  var sheet1 = ss.getSheetByName('Sheet1')
  if (sheet1 && sheet1.getDataRange().getNumRows() <= 1) {
    ss.deleteSheet(sheet1)
  }

  SpreadsheetApp.getUi().alert('Setup complete! 4 sheets created and seeded.\n\nNext steps:\n1. Paste backend.gs into this project\n2. Set API_KEY in Script Properties\n3. Deploy as Web App')
}
