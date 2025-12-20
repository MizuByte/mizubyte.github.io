#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const crypto = require('crypto');

const SCRIPT_DIR = __dirname;
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const CONFIG_FILE = path.join(SCRIPT_DIR, 'config.json');
const CONFIG_EXAMPLE_FILE = path.join(SCRIPT_DIR, 'config.example.json');
const SEEN_FILE = path.join(SCRIPT_DIR, 'seen.json');
const LAST_NEWS_FILE = path.join(SCRIPT_DIR, 'lastNews.json');
const SITE_DATA_FILE = path.join(REPO_ROOT, 'data', 'latestSpoilers.json');

function loadJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw || !raw.trim()) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function loadConfig() {
  const cfgFromFile = loadJsonFile(CONFIG_FILE);
  if (cfgFromFile && typeof cfgFromFile === 'object') return cfgFromFile;
  const cfgFromExample = loadJsonFile(CONFIG_EXAMPLE_FILE);
  if (cfgFromExample && typeof cfgFromExample === 'object') return cfgFromExample;
  return {};
}

const cfg = loadConfig();

function normalizeBaseUrl(baseUrl) {
  return (baseUrl || '').toString().trim().replace(/\/$/, '');
}

function uniqueStrings(list) {
  const out = [];
  const seen = new Set();
  for (const v of list || []) {
    const s = (v || '').toString().trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function getNitterBaseUrls() {
  const fromCfgList = Array.isArray(cfg.nitterBaseUrls) ? cfg.nitterBaseUrls : [];
  const fromCfgSingle = cfg.nitterBaseUrl ? [cfg.nitterBaseUrl] : [];
  const fromEnv = (process.env.NITTER_BASE_URLS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Keep a few known mirrors as fallback. These change over time; order matters.
  const defaults = [
    'https://nitter.net',
    'https://nitter.poast.org',
    'https://nitter.privacydev.net',
    'https://nitter.fdn.fr'
  ];

  return uniqueStrings([...fromEnv, ...fromCfgList, ...fromCfgSingle, ...defaults]).map(normalizeBaseUrl);
}

const NITTER_BASE_URLS = getNitterBaseUrls();

async function loadSeen() {
  try {
    const data = JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

const DEFAULT_SELECTIONS = ['one-piece', 'boruto', 'black-clover', 'berserk'];

const HANDLE_CONFIG = {
  'pewpiece': { anime: 'onepiece', label: 'One Piece α', subsource: 'alpha' },
  'worstgenhq': { anime: 'onepiece', label: 'One Piece β', subsource: 'beta' },
  'mugiwara_23': { anime: 'onepiece', label: 'One Piece γ', subsource: 'gamma' },
  'schmurfiv1': { anime: 'boruto', label: 'Boruto', subsource: '' },
  'pacemanop': { anime: 'blackclover', label: 'Black Clover', subsource: '' },
  'daily_berserk': { anime: 'berserk', label: 'Berserk', subsource: '' }
};

const ANIME_SELECTIONS = {
  'one-piece': ['pewpiece', 'worstgenhq', 'mugiwara_23'],
  'boruto': ['schmurfiv1'],
  'black-clover': ['pacemanop'],
  'berserk': ['daily_berserk']
};

const ANIME_LABELS = {
  onepiece: 'One Piece',
  boruto: 'Boruto',
  blackclover: 'Black Clover',
  berserk: 'Berserk',
  unknown: 'Unknown'
};

async function saveSeen(list) {
  fs.writeFileSync(SEEN_FILE, JSON.stringify(Array.isArray(list) ? list : [], null, 2));
}

function loadLastNews() {
  try {
    const data = JSON.parse(fs.readFileSync(LAST_NEWS_FILE, 'utf8'));
    if (data && typeof data === 'object') return data;
  } catch (e) {}
  return {};
}

function saveLastNews(map) {
  try {
    fs.writeFileSync(LAST_NEWS_FILE, JSON.stringify(map, null, 2));
  } catch (e) {
    console.warn('Failed to persist last news cache:', e && e.message);
  }
}

function ensureDirExists(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (e) {
    // ignore
  }
}

function writeSiteSpoilersJson(items) {
  // This file is consumed by the GitHub Pages site (same-origin fetch).
  // Keep it small and free of secrets. Produce categorized output with
  // `spoilers` and `misc` arrays, and also include `items` for
  // backward compatibility.
  const list = Array.isArray(items) ? items : [];
  const maxTotal = Number(cfg.siteJsonMaxItems) > 0 ? Number(cfg.siteJsonMaxItems) : 60;
  const perHandleMax = Number(cfg.siteJsonPerHandleMax) > 0 ? Number(cfg.siteJsonPerHandleMax) : 5;

  // Separate spoilers and misc while enforcing per-handle and global limits.
  const spoilers = [];
  const misc = [];
  const countsByHandle = Object.create(null);

  function addIfAllowed(targetArray, it) {
    if (!it || !it.handle) return false;
    const h = it.handle;
    countsByHandle[h] = countsByHandle[h] || 0;
    if (countsByHandle[h] >= perHandleMax) return false;
    if (spoilers.length + misc.length >= maxTotal) return false;
    targetArray.push({
      id: it.id,
      anime: it.anime,
      handle: it.handle,
      sourceLabel: it.sourceLabel,
      title: it.title,
      text: it.text || '',
      url: it.url,
      date: it.date || '',
      isSpoiler: Boolean(it.isSpoiler),
      hasAttachments: Boolean(it.hasAttachments),
      attachments: Array.isArray(it.attachments) ? it.attachments : []
    });
    countsByHandle[h] += 1;
    return true;
  }

  // Try to add spoilers first so they get priority in the limited output.
  for (const it of list) {
    if (!it) continue;
    if (Boolean(it.isSpoiler)) addIfAllowed(spoilers, it);
  }

  // Fill remaining slots with misc posts.
  for (const it of list) {
    if (!it) continue;
    if (Boolean(it.isSpoiler)) continue;
    if (spoilers.length + misc.length >= maxTotal) break;
    addIfAllowed(misc, it);
  }

  // Keep a combined `items` array for compatibility but limited to maxTotal
  // and following the same per-handle limits (we already enforced them above).
  const combined = [...spoilers, ...misc].slice(0, maxTotal);

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'tools/monitor-spoilers/monitor.js',
    spoilers,
    misc,
    // Backward-compatible field: `items` contains combined list.
    items: combined
  };

  ensureDirExists(path.dirname(SITE_DATA_FILE));
  fs.writeFileSync(SITE_DATA_FILE, JSON.stringify(payload, null, 2));
}

function makeSiteItem(meta, handle, tweet, { isSpoiler = false } = {}) {
  const text = (tweet?.content || '').toString();
  const url = (tweet?.url || '').toString();
  const hasAttachments = Array.isArray(tweet?.attachments) && tweet.attachments.length > 0;
  const id = makeIdForItem(meta.anime, text.trim(), url);
  return {
    id,
    anime: meta.anime,
    handle,
    sourceLabel: meta.label || `@${handle}`,
    title: text.replace(/\s+/g, ' ').trim().slice(0, 200),
    text,
    url,
    date: tweet?.date || '',
    isSpoiler: Boolean(isSpoiler),
    hasAttachments,
    attachments: hasAttachments ? tweet.attachments : []
  };
}

const lastNewsCache = loadLastNews();

function rememberLastNews(handle, tweet) {
  if (!handle || !tweet) return;
  const text = (tweet.content || '').replace(/\s+/g, ' ').trim().slice(0, 240);
  if (!text && !(tweet.attachments && tweet.attachments.length)) return;
  lastNewsCache[handle] = {
    handle,
    tweet,
    text: text || '(image-only post)',
    url: tweet.url || '',
    date: tweet.date || '',
    recordedAt: new Date().toISOString()
  };
}

function reportLastNews(handle) {
  if (!handle) return;
  const last = lastNewsCache[handle];
  if (last) {
    console.warn(`[last-known] ${handle}: "${last.text}" ${last.url || ''} (seen ${last.date || last.recordedAt || 'unknown'})`);
  } else {
    console.warn(`[last-known] ${handle}: no previous news recorded`);
  }
}

function isBerserkSpoiler(text) {
  if (!text || typeof text !== 'string') return false;
  const chapterOut = /\bCHAPTER\b[\s\S]{0,120}?\bOUT\b/i;
  return chapterOut.test(text) || /spoil/i.test(text);
}

function detectSpoilerForAnime(text, animeKey, { hasAttachments = false } = {}) {
  const normalizedAnime = (animeKey || '').toString().toLowerCase();
  const safeText = (text || '').toString();
  const up = safeText.toUpperCase();

  if (normalizedAnime === 'berserk' || up.includes('BERSERK')) {
    return isBerserkSpoiler(safeText);
  }

  const keywords = Array.isArray(cfg.spoilerKeywords) && cfg.spoilerKeywords.length
    ? cfg.spoilerKeywords
    : ['spoil', 'spoiler', 'leak', 'leaks', 'raw', 'raws'];

  for (const kw of keywords) {
    const k = (kw || '').toString().trim();
    if (!k) continue;
    if (safeText.toLowerCase().includes(k.toLowerCase())) return true;
  }

  if (cfg.treatImageOnlyAsSpoiler && hasAttachments && (!safeText || !safeText.trim())) return true;

  return false;
}

function makeIdForItem(anime, text, url) {
  const s = `${anime}||${(text||'').trim().slice(0,300)}||${url||''}`;
  return crypto.createHash('sha256').update(s).digest('hex');
}

function normalizeHandle(handle) {
  return (handle || '').toString().trim().toLowerCase();
}

function resolveHandles(selectionList = []) {
  const selections = Array.isArray(selectionList) && selectionList.length ? selectionList : DEFAULT_SELECTIONS;
  const handles = new Set();
  for (const entry of selections) {
    if (!entry) continue;
    const key = normalizeHandle(entry);
    if (HANDLE_CONFIG[key]) {
      handles.add(key);
    } else if (ANIME_SELECTIONS[key]) {
      ANIME_SELECTIONS[key].forEach(h => handles.add(normalizeHandle(h)));
    }
  }
  return Array.from(handles);
}

function animeLabel(animeKey) {
  const normalized = (animeKey || '').toString().toLowerCase();
  return ANIME_LABELS[normalized] || ANIME_LABELS[normalized.replace(/-/g, '')] || animeKey;
}

function sleep(ms) {
  if (!ms || ms <= 0) return Promise.resolve();
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function notifyDiscordGrouped(webhook, grouped, { roleMentions = {}, handleMentions = {}, animeLabels = {} } = {}) {
  for (const animeKey of Object.keys(grouped)) {
    const items = grouped[animeKey];
    const displayName = animeLabels[animeKey] || animeLabel(animeKey);
    const mention = roleMentions[animeKey] ? ` ${roleMentions[animeKey]}` : '';
    const lines = items.map(it => {
      const parts = [];
      if (it.sourceLabel) parts.push(it.sourceLabel);
      if (it.handle && !parts.includes(`@${it.handle}`)) parts.push(`@${it.handle}`);
      if (handleMentions[it.handle]) parts.push(handleMentions[it.handle]);
      const prefix = parts.length ? `[${parts.join(' ')}] ` : '';
      const base = (it.title || it.text || '').replace(/\s+/g, ' ').trim().slice(0, 200) || '(image-only post)';
      return it.url ? `- ${prefix}${base}\n  ${it.url}` : `- ${prefix}${base}`;
    });
    const header = `Neue Spoiler für **${displayName}** (${items.length})${mention}`;
    const content = [header, ...lines].join('\n');
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      await sleep(500);
    } catch (e) {
      console.error('Failed to send Discord message for', animeKey, e.message || e);
    }
  }
}

async function fetchWithRetries(url, { retries = 3, retryDelayMs = 3000, timeoutMs = 30000, debug = false, userAgent, handle } = {}) {
  const headers = {
    'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, { headers, redirect: 'follow', signal: controller.signal });
      clearTimeout(timer);

      if (response.status === 200) {
        const text = await response.text();
        if (!text || !text.trim()) {
          throw new Error('Empty response body');
        }
        return text;
      }

      if (response.status === 429) {
        if (attempt === retries) {
          if (handle) reportLastNews(handle);
          throw new Error(`HTTP 429 from ${url}`);
        }
        if (debug) console.warn(`[fetch] 429 from ${url}, retrying in ${retryDelayMs * (attempt + 1)}ms`);
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }

      if (response.status >= 500 && attempt < retries) {
        if (debug) console.warn(`[fetch] ${response.status} from ${url}, retrying...`);
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }

      const body = await response.text().catch(() => '');
      if (handle) reportLastNews(handle);
      throw new Error(`HTTP ${response.status} from ${url} (body length ${body.length})`);
    } catch (err) {
      if (attempt === retries) {
        if (handle) reportLastNews(handle);
        throw err;
      }
      if (debug) console.warn(`[fetch] attempt ${attempt + 1} failed for ${url}:`, err.message || err);
      await sleep(retryDelayMs * (attempt + 1));
    }
  }

  return null;
}

function parseNitterPage(handle, html, baseUrl) {
  const $ = cheerio.load(html);
  const tweets = [];

  $('.timeline-item').each((_, element) => {
    const node = $(element);
    const hasRetweetHeader = node.find('.retweet-header').length > 0;
    const isRetweetClass = node.hasClass('retweet');
    const content = (node.find('.tweet-content').text() || '').trim();
    const startsWithRT = content.startsWith('RT @');
    if (hasRetweetHeader || isRetweetClass || startsWithRT) return;

    const linkEl = node.find('.tweet-date a').first();
    const href = linkEl.attr('href') || '';
    let fullUrl = '';
    try {
      if (href) {
        const u = href.startsWith('http') ? new URL(href) : new URL(href, baseUrl);
        // strip query and fragment to avoid transient params like ?t=...
        u.search = '';
        u.hash = '';
        fullUrl = `${u.origin}${u.pathname}`;
      }
    } catch (e) {
      fullUrl = href ? (href.startsWith('http') ? href : `${baseUrl}${href}`) : '';
    }
    const date = (linkEl.text() || '').trim();

    const attachments = [];
    node
      .find('.attachments img, .attachments .still-image, .attachments .attachment.image')
      .each((__, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src && src !== 'null') {
          try {
            const au = src.startsWith('http') ? new URL(src) : new URL(src, baseUrl);
            au.search = '';
            au.hash = '';
            attachments.push(`${au.origin}${au.pathname}`);
          } catch (e) {
            attachments.push(src.startsWith('http') ? src : `${baseUrl}${src}`);
          }
        }
      });

    if (!content && attachments.length === 0) return;

    tweets.push({
      handle,
      content,
      url: fullUrl,
      date,
      attachments
    });
  });

  let nextCursor = '';
  const moreHref = $('.show-more a').attr('href');
  if (moreHref) {
    const match = moreHref.match(/cursor=([^&]+)/);
    if (match) nextCursor = decodeURIComponent(match[1]);
  }

  return { tweets, nextCursor };
}

function looksBlockedOrBad(html) {
  if (!html || !html.trim()) return true;
  const sample = html.slice(0, 2000).toLowerCase();
  if (sample.includes('cloudflare')) return true;
  if (sample.includes('access denied')) return true;
  if (sample.includes('just a moment')) return true;
  if (sample.includes('captcha')) return true;
  // Nitter pages should at least have some timeline structure
  if (!sample.includes('timeline') && !sample.includes('tweet')) return true;
  return false;
}

async function fetchHandleTweets(handle, {
  limit = 40,
  maxPages = 2,
  retries = 3,
  retryDelayMs = 3000,
  pageDelayMs = 1500,
  timeoutMs = 30000,
  debug = false,
  userAgent
} = {}) {
  const normalized = normalizeHandle(handle);
  const collected = [];
  let cursor = '';

  const baseUrls = NITTER_BASE_URLS.length ? NITTER_BASE_URLS : ['https://nitter.net'];

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);

    let parsed = null;
    let lastError = null;

    for (const baseUrl of baseUrls) {
      const qs = params.toString();
      const url = qs ? `${baseUrl}/${normalized}?${qs}` : `${baseUrl}/${normalized}`;
      if (debug) console.log(`[${new Date().toISOString()}] Fetching ${url}`);

      let html;
      try {
        html = await fetchWithRetries(url, { retries, retryDelayMs, timeoutMs, debug, userAgent, handle: normalized });
      } catch (err) {
        lastError = err;
        if (debug) console.warn(`[${new Date().toISOString()}] ${normalized}: failed from ${baseUrl}: ${err.message || err}`);
        continue;
      }

      if (!html) {
        lastError = new Error('Empty response body');
        continue;
      }

      if (looksBlockedOrBad(html)) {
        lastError = new Error(`Blocked or bad HTML from ${baseUrl} (len=${html.length})`);
        if (debug) console.warn(`[${new Date().toISOString()}] ${normalized}: ${lastError.message}`);
        continue;
      }

      const result = parseNitterPage(normalized, html, baseUrl);
      if (debug) console.log(`[${new Date().toISOString()}] ${normalized}: parsed ${result.tweets.length} tweets from ${baseUrl}`);
      parsed = { ...result, baseUrl };
      break;
    }

    if (!parsed) {
      if (lastError && debug) {
        console.error(`[${new Date().toISOString()}] ${normalized}: all Nitter instances failed: ${lastError.message || lastError}`);
      }
      break;
    }

    const { tweets, nextCursor } = parsed;
    collected.push(...tweets);

    if (tweets.length) {
      rememberLastNews(normalized, tweets[0]);
    }

    if (collected.length >= limit) break;
    if (!nextCursor) break;
    cursor = nextCursor;

    if (pageDelayMs) await sleep(pageDelayMs);
  }

  return collected.slice(0, limit);
}

async function scrapeOnce() {
  const webhook = process.env.DISCORD_WEBHOOK || cfg.discordWebhook;
  if (!webhook) {
    console.error('No Discord webhook provided. Set DISCORD_WEBHOOK env or discordWebhook in config.json');
    process.exit(1);
  }

  const DEBUG = process.argv.includes('--debug') || process.env.DEBUG === '1' || cfg.debug;
  const VERBOSE = process.argv.includes('--verbose') || process.env.VERBOSE === '1';

  const selections = cfg.defaultSelections || cfg.selectedAnime || DEFAULT_SELECTIONS;
  const extraHandles = Array.isArray(cfg.extraHandles) ? cfg.extraHandles.map(normalizeHandle) : [];
  const handles = [...new Set([...resolveHandles(selections), ...extraHandles])];

  if (!handles.length) {
    console.warn('No handles resolved from selections; nothing to scrape.');
    return;
  }

  console.log(`[${new Date().toISOString()}] scrapeOnce: fetching ${handles.length} handles`);

  const fetchOptions = {
    limit: cfg.maxTweetsPerHandle || 40,
    maxPages: cfg.maxPagesPerHandle || 2,
    retries: cfg.fetchRetries ?? 3,
    retryDelayMs: cfg.retryDelayMs ?? 3000,
    pageDelayMs: cfg.pageDelayMs ?? 1500,
    timeoutMs: cfg.fetchTimeoutMs ?? 30000,
    debug: DEBUG,
    userAgent: cfg.userAgent
  };

  const seen = await loadSeen();
  const seenSet = new Set(seen);
  const filtered = [];
  const allItems = [];
  const concurrency = Math.max(1, Math.min(handles.length, Number(cfg.fetchConcurrency) || 3));
  const handleDelayMs = cfg.handleDelayMs ?? 1500;

  let index = 0;

  async function processNext(workerId) {
    while (true) {
      if (index >= handles.length) break;
      const handle = handles[index];
      index += 1;

      const meta = HANDLE_CONFIG[handle] || { anime: 'unknown', label: `@${handle}`, subsource: '' };
      if (VERBOSE || DEBUG) {
        const workerTag = concurrency > 1 ? `worker#${workerId} ` : '';
        console.log(`[${new Date().toISOString()}] ${workerTag}Processing handle ${handle} (anime=${meta.anime})`);
      }

      let tweets = [];
      try {
        tweets = await fetchHandleTweets(handle, fetchOptions);
      } catch (err) {
        console.error(`Failed to fetch ${handle}:`, err.message || err);
        reportLastNews(handle);
        continue;
      }

      if (!tweets.length) {
        if (VERBOSE || DEBUG) console.log(`[${new Date().toISOString()}] ${handle}: no tweets fetched`);
        continue;
      }

      for (const tweet of tweets) {
        const text = (tweet.content || '').trim();
        const url = tweet.url || '';
        const id = makeIdForItem(meta.anime, text, url);
        const hasAttachments = Array.isArray(tweet.attachments) && tweet.attachments.length > 0;

        const isSpoiler = detectSpoilerForAnime(text, meta.anime, { hasAttachments });

        // Website JSON gets everything (dedup later).
        allItems.push(makeSiteItem(meta, handle, tweet, { isSpoiler }));

        // Discord notifications remain spoiler-only and deduped across runs.
        if (seenSet.has(id)) continue;
        if (!isSpoiler) continue;

        filtered.push(makeSiteItem(meta, handle, tweet, { isSpoiler: true }));
        seenSet.add(id);
      }

      if (handleDelayMs > 0) await sleep(handleDelayMs);
    }
  }

  const workerCount = Math.min(concurrency, handles.length);
  const workers = [];
  for (let i = 0; i < workerCount; i++) {
    workers.push(processNext(i + 1));
  }
  await Promise.all(workers);

  // Always update the public site JSON. If today's scrape yields nothing (e.g. Nitter down),
  // fall back to last known items so the site doesn't go blank.
  const unique = new Map();
  for (const it of allItems) {
    if (!it || !it.id) continue;
    if (!unique.has(it.id)) unique.set(it.id, it);
  }

  if (unique.size === 0) {
    const fallback = Object.values(lastNewsCache || {})
      .map(entry => {
        const handle = normalizeHandle(entry?.handle || entry?.tweet?.handle || '');
        if (!handle) return null;
        const meta = HANDLE_CONFIG[handle] || { anime: 'unknown', label: `@${handle}`, subsource: '' };
        const tweet = entry?.tweet || { content: entry?.text || '', url: entry?.url || '', date: entry?.date || entry?.recordedAt || '', attachments: [] };
        const text = (tweet.content || '').toString();
        const hasAttachments = Array.isArray(tweet.attachments) && tweet.attachments.length > 0;
        const isSpoiler = detectSpoilerForAnime(text, meta.anime, { hasAttachments });
        return makeSiteItem(meta, handle, tweet, { isSpoiler });
      })
      .filter(Boolean);
    writeSiteSpoilersJson(fallback);
  } else {
    writeSiteSpoilersJson(Array.from(unique.values()));
  }

  if (!filtered.length) {
    console.log('No new spoilers found');
    saveLastNews(lastNewsCache);
    await saveSeen(Array.from(seenSet));
    return;
  }

  const grouped = {};
  for (const item of filtered) {
    grouped[item.anime] = grouped[item.anime] || [];
    grouped[item.anime].push(item);
    seenSet.add(item.id);
  }

  await notifyDiscordGrouped(webhook, grouped, {
    roleMentions: cfg.discordMentions || {},
    handleMentions: cfg.handleMentions || {},
    animeLabels: cfg.animeLabels || {}
  });

  await saveSeen(Array.from(seenSet));
  saveLastNews(lastNewsCache);
}

async function main() {
  if (process.argv.includes('--once')) {
    await scrapeOnce();
    process.exit(0);
  }
  // loop mode
  const minutes = cfg.pollIntervalMinutes || 10;
  while (true) {
    try {
      await scrapeOnce();
    } catch (e) {
      console.error('Error during scrape:', e);
    }
    await new Promise(r => setTimeout(r, minutes * 60 * 1000));
  }
}

main();
