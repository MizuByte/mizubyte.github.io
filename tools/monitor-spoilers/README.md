Spoiler monitor
===============

This Node.js tool monitors Nitter (a Twitter alternative) for anime spoilers. It scrapes tweets from specified handles, detects spoilers based on configurable keywords or image-only posts, and posts notifications to a Discord webhook.

When to use
- To automatically monitor Twitter accounts for anime leaks/spoilers without using Twitter's API.
- Runs locally or in GitHub Actions as a scheduled job.

Quick start
1. Install Node.js (>=16) and npm.
2. From this folder:

```bash
cd tools/monitor-spoilers
npm install
cp config.example.json config.json
# Edit config.json: set nitterBaseUrls, handles, spoilerKeywords, treatImageOnlyAsSpoiler, etc.
# Set your Discord webhook URL in the file or as env DISCORD_WEBHOOK
node monitor.js --once  # for one-time run
# or node monitor.js  # for continuous monitoring
```

Run in GitHub Actions: The included workflow runs this automatically on schedule.

Configuration
- `nitterBaseUrls`: Array of Nitter instance URLs to try (fallbacks for reliability).
- `handles`: Array of Twitter handles to monitor (without @).
- `spoilerKeywords`: Array of keywords that indicate a spoiler (e.g., "spoil", "leak").
- `treatImageOnlyAsSpoiler`: Boolean; if true, posts with images but no text are considered spoilers.
- `pollIntervalMinutes`: How often to check when running in loop mode.
- `discordWebhookUrl`: Discord webhook URL (or set via env DISCORD_WEBHOOK).

Notes
- The tool keeps a `lastNews.json` file with seen tweet IDs. Do not commit secrets; `config.json` is ignored.
- Uses direct HTML scraping with cheerio; no browser required.
- If Nitter instances are blocked, update `nitterBaseUrls` with working mirrors.
