Spoiler monitor (local)
=======================

This small Node.js tool loads a webpage with a headless browser (Puppeteer), executes the page's JavaScript, finds spoiler elements using a CSS selector, and posts new spoilers to a Discord webhook.

When to use
- If your site builds spoiler content only client-side (via JS) and you want an automated notifier.
- Run this locally (or on a server) as a background job / cron / pm2 service.

Quick start (macOS)
1. Install Node.js (>=16) and npm.
2. From this folder:

```bash
cd tools/monitor-spoilers
npm install
cp config.example.json config.json
# Edit config.json: set url, selector and (optionally) idAttr
# Put your Discord webhook URL in the file or set env DISCORD_WEBHOOK
node monitor.js
```

Run as a background process (recommended): use pm2 or a launchd plist on macOS.

Configuration
- `url`: the URL to monitor (can be a local server like http://localhost:8000 or a file:// path but Puppeteer may need an http server).
- `selector`: CSS selector that matches all spoiler items on the page.
- `idAttr`: (optional) attribute used as unique id (e.g., `data-id`). If omitted the script will use textContent as id.
- `pollIntervalMinutes`: how often to run when you run in loop mode.

Notes
- The tool keeps a `seen.json` file with IDs it already notified about. Do not commit secrets; `config.json` is ignored by default.
- If your site is only accessible in your local browser session, run a local static server (e.g. `npx http-server .`) so Puppeteer can fetch it.
