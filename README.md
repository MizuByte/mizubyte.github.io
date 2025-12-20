# Spoiler Monitor (GitHub Actions + optional Railway)

This repo powers a GitHub Pages site that shows anime news/spoilers.

The core idea:
- A scheduled runner generates `data/latestSpoilers.json`.
- The website reads that JSON **same-origin** (no CORS/proxy drama).
- Discord notifications are sent via webhook.

## Option B (Recommended): GitHub Actions generates the JSON

Workflow: `.github/workflows/monitor-spoilers.yml`

What it does:
- Runs `tools/monitor-spoilers/monitor.js` on a schedule.
- Writes/updates `data/latestSpoilers.json`.
- Commits the JSON back to the repo.
- Sends Discord messages (if `DISCORD_WEBHOOK` is configured).

### Setup

1) Create a GitHub repo secret:
- `DISCORD_WEBHOOK`: your Discord webhook URL.

2) Configure sources/keywords/mentions:
- Edit `tools/monitor-spoilers/config.example.json`.
	- `nitterBaseUrls`: list of Nitter base URLs to try.
	- `spoilerKeywords`: spoiler matching keywords.
	- `treatImageOnlyAsSpoiler`: treat image-only posts as spoilers.
	- `discordMentions` / `handleMentions`: put role mentions like `<@&ROLE_ID>`.

The workflow copies `config.example.json` -> `config.json` at runtime and injects the `DISCORD_WEBHOOK` secret.

### Notes on reliability

Public Nitter endpoints often return blocked/empty responses to scripts.
The monitor includes retries + RSS/HTML parsing + optional browser fallback.

## Website data flow

The website reads this file:
- `data/latestSpoilers.json`

Client code:
- `js/main.js` uses `SITE_SPOILERS_JSON_URL = '/data/latestSpoilers.json'`
- `FORCE_JSON_ONLY = true` (so the site does not spam fetches to Nitter)

## Local usage (Windows PowerShell)

Install dependencies:

```powershell
cd c:\Users\EfeNa\mizubyte.github.io\tools\monitor-spoilers
npm install
```

Run once (debug):

```powershell
$env:DISCORD_WEBHOOK='https://discord.com/api/webhooks/...'
$env:BROWSER_FALLBACK='1'
node monitor.js --once --debug
```

Serve the site locally (so `/data/latestSpoilers.json` is same-origin):

```powershell
cd c:\Users\EfeNa\mizubyte.github.io
python -m http.server 8000
```

Then open: `http://localhost:8000`

## Option A (Optional): Railway “monitor service”

If you want an always-on service on Railway, the intended approach is:
- A small Node service that periodically refreshes the JSON and sends Discord.
- It serves `GET /data/latestSpoilers.json` in the **same schema** as the repo.

You can then:
- keep the website using GitHub Actions (recommended), OR
- point the website at the Railway JSON endpoint (requires allowing cross-origin fetches or proxying).

This repo’s default setup is Option B (GitHub Actions) because it keeps the website simple and same-origin.

# mizubyte.github.io
MizuByte is a website for your latest manga news.
