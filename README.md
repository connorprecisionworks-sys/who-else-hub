# Who Else Hub

Personal life/business dashboard built with React + Vite.

## Agents Module — Google Sheets Setup

The Agents section uses a Google Spreadsheet as its database, accessed via a Google Apps Script Web App.

### 1. Create the Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like "Who Else Hub — Agents".

### 2. Run the Setup Script

1. In the spreadsheet, go to **Extensions → Apps Script**.
2. Delete any existing code in the editor.
3. Create a new script file called `setup.gs` and paste the contents of `setup.gs` from this repo.
4. Click **Run → setupAgentsHub**.
5. Grant the permissions when prompted.
6. You should see a confirmation alert. The script creates 4 sheets (Agents, Runs, Dashboard, Config) and seeds starter data.

### 3. Add the Backend Script

1. In the same Apps Script project, create another script file called `backend.gs`.
2. Paste the contents of `backend.gs` from this repo.
3. Save the project.

### 4. Set the API Key

1. In Apps Script, go to **Project Settings** (gear icon in the left sidebar).
2. Scroll down to **Script Properties**.
3. Click **Add script property**.
4. Set Property to `API_KEY` and Value to a secret key of your choice (e.g. a random string).
5. Also update the `api_key` value in the **Config** sheet to match.

### 5. Deploy as Web App

1. In Apps Script, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set **Execute as**: Me (your Google account).
4. Set **Who has access**: Anyone.
5. Click **Deploy**.
6. Copy the **Web app URL** — you'll need this next.

### 6. Configure the React App

1. Copy `.env.example` to `.env` in the project root:
   ```
   cp .env.example .env
   ```
2. Fill in your values:
   ```
   VITE_SHEETS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   VITE_SHEETS_API_KEY=your_secret_key_here
   ```
3. Start the dev server:
   ```
   npm run dev
   ```

### 7. Daily Email Summary Agent Integration

When the Daily Email Summary agent runs (e.g. via a Claude Code scheduled task at 7 AM), it should POST to the web app URL to log its activity:

```bash
curl -X POST YOUR_WEB_APP_URL \
  -H "Content-Type: text/plain" \
  -d '{
    "key": "YOUR_API_KEY",
    "action": "logRun",
    "agent_id": "email-summary",
    "output_summary": "Processed 12 emails, sent daily digest",
    "tokens_used": 1500,
    "status": "Success",
    "trigger": "scheduled"
  }'
```

### 8. Manual Endpoint Testing

Test that your deployment works with curl:

```bash
# GET — fetch dashboard summary
curl "YOUR_WEB_APP_URL?key=YOUR_API_KEY"

# GET — fetch all agents
curl "YOUR_WEB_APP_URL?key=YOUR_API_KEY&action=agents"

# GET — fetch recent runs
curl "YOUR_WEB_APP_URL?key=YOUR_API_KEY&action=runs&limit=5"

# POST — log a test run
curl -X POST YOUR_WEB_APP_URL \
  -H "Content-Type: text/plain" \
  -d '{"key":"YOUR_API_KEY","action":"logRun","agent_id":"code-assistant","output_summary":"Test run","tokens_used":100,"status":"Success","trigger":"manual"}'

# POST — add a new agent
curl -X POST YOUR_WEB_APP_URL \
  -H "Content-Type: text/plain" \
  -d '{"key":"YOUR_API_KEY","action":"addAgent","agent_id":"test-agent","agent_name":"Test Agent","type":"other","schedule":"Manual","prompt_config":"","notes":"Testing"}'
```
