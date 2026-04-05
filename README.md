# Who Else Hub — Command Center

Full command center for managing the Who Else / Faith+Founders program across all areas of your life.

## Views
| View | What it does |
|---|---|
| **Home** | Live clock, today's schedule, top 3 priorities, habits, mini calendar, reminders, upcoming events |
| **Calendar** | Month + week view, color-coded by area, recurring events, click to add |
| **People** | Students, teachers, waitlist — notes, last topic, contact, meetings linked |
| **Meetings** | Schedule with agenda, link people, add follow-up notes |
| **Tasks** | To-do list with priorities, area tags, top-3 flag for home dashboard |
| **Pitch Page** | Shareable one-pager for Who Else — editable, live stats |

## Areas (color-coded everywhere)
- 🟢 **Who Else** — club, recruiting, students
- 🔵 **Consulting** — AI consulting business
- 🟠 **Personal** — life, health
- 🟣 **Content** — videos, posts
- 🟡 **Finance** — billing, money

## Recurring Options
Events and reminders can recur: Daily, Weekdays, Weekly, Biweekly, Monthly, or specific days (Mon/Tue/Wed/Thu/Fri)

## Keyboard Shortcuts
| Key | Action |
|---|---|
| `⌘P` | Add person |
| `⌘M` | Schedule meeting |
| `⌘N` | New note |
| `⌘T` | Add task |
| `⌘E` | Add event |
| `1/2/3` | Jump to Home/Calendar/People |
| `Esc` | Close panel/modal |

## Deploy
```bash
# Option A: CLI
npm i -g vercel
cd who-else-hub
vercel

# Option B: GitHub → Vercel
git init && git add . && git commit -m "init"
# Push to GitHub, import at vercel.com, Framework = Other
```

## Local Use (drag to desktop)
Just open `index.html` in any browser. All data saves to localStorage automatically.

## Backup Data
Open DevTools → Application → Local Storage → copy value of `we_hub_v2`
To restore: `localStorage.setItem('we_hub_v2', '<paste>')`
