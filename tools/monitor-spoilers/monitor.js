#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const ROOT = path.resolve(__dirname);
const SEEN_FILE = path.join(ROOT, 'seen.json');

const cfgPath = path.join(ROOT, 'config.json');
if (!fs.existsSync(cfgPath)) {
  console.error('Missing config.json — copy config.example.json to config.json and edit it.');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

const crypto = require('crypto');

async function loadSeen() {
  try {
    return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')) || [];
  } catch (e) {
    return [];
  }
}

async function saveSeen(list) {
  fs.writeFileSync(SEEN_FILE, JSON.stringify(list, null, 2));
}

function isBerserkSpoiler(text) {
  if (!text || typeof text !== 'string') return false;
  const chapterOut = /\bCHAPTER\b[\s\S]{0,120}?\bOUT\b/i;
  return chapterOut.test(text) || /spoil/i.test(text);
}

function detectSpoilerForAnime(text, animeKey) {
  if (!text || typeof text !== 'string') return false;
  const up = text.toUpperCase();
  if ((animeKey || '').toLowerCase() === 'berserk' || up.includes('BERSERK')) {
    return isBerserkSpoiler(text);
  }
  return /spoil/i.test(text);
}

function makeIdForItem(anime, text, url) {
  const s = `${anime}||${(text||'').trim().slice(0,300)}||${url||''}`;
  return crypto.createHash('sha256').update(s).digest('hex');
}

async function notifyDiscordGrouped(webhook, grouped) {
  // grouped is { animeKey: [items] }
  for (const animeKey of Object.keys(grouped)) {
    const items = grouped[animeKey];
    const lines = items.map(it => {
      const title = (it.title || it.text || '').replace(/\s+/g, ' ').trim().slice(0,200);
      const url = it.url || '';
      return url ? `- ${title}\n  ${url}` : `- ${title}`;
    });
    const header = `Neue Spoiler für **${animeKey}** (${items.length}):`;
    const content = header + '\n' + lines.join('\n');
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      // small delay to be nicer to Discord
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error('Failed to send Discord message for', animeKey, e.message || e);
    }
  }
}

async function scrapeOnce() {
  const url = cfg.url;
  // selector should match the rendered tweet elements (default to .nitter-tweet)
  const selector = cfg.selector || '.nitter-tweet';
  const idAttr = cfg.idAttr || null;
  const webhook = process.env.DISCORD_WEBHOOK || cfg.discordWebhook;
  if (!webhook) {
    console.error('No Discord webhook provided. Set DISCORD_WEBHOOK env or discordWebhook in config.json');
    process.exit(1);
  }

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector(selector, { timeout: 30000 });

  // Evaluate page and extract items including anime key from data attributes
  const items = await page.$$eval(selector, (nodes, idAttr) => {
    return nodes.map(n => {
      const text = (n.querySelector('.nitter-content .text-part')?.innerText || n.textContent || '').trim();
      const urlEl = n.querySelector('.tweet-date a') || n.querySelector('a');
      const url = urlEl ? (urlEl.href || urlEl.getAttribute('href')) : null;
      const anime = n.getAttribute('data-anime') || (n.dataset && n.dataset.anime) || '';
      const subsource = n.getAttribute('data-subsource') || (n.dataset && n.dataset.subsource) || '';
      const idFromAttr = idAttr ? (n.getAttribute(idAttr) || null) : null;
      const titleEl = n.querySelector('h3') || n.querySelector('.tweet-content');
      const title = titleEl ? (titleEl.innerText || titleEl.textContent || '').trim() : null;
      return { idFromAttr, text, url, title, anime, subsource };
    });
  }, idAttr);

  await browser.close();

  const seen = await loadSeen();
  const seenSet = new Set(seen);

  // Build items with stable ids and filter spoilers per-anime
  const filtered = [];
  for (const it of items) {
    const animeKey = (it.anime || 'unknown').toLowerCase() || 'unknown';
    const id = it.idFromAttr || makeIdForItem(animeKey, it.text, it.url);
    if (seenSet.has(id)) continue;
    // detect spoiler using series-aware logic
    if (!detectSpoilerForAnime(it.text, animeKey)) continue;
    filtered.push({ id, anime: animeKey, title: it.title, text: it.text, url: it.url });
  }

  if (filtered.length === 0) {
    console.log('No new spoilers found');
    return;
  }

  // Group by anime
  const grouped = {};
  for (const it of filtered) {
    grouped[it.anime] = grouped[it.anime] || [];
    grouped[it.anime].push(it);
    seenSet.add(it.id);
  }

  // Notify per-anime
  await notifyDiscordGrouped(webhook, grouped);

  // Persist seen IDs
  await saveSeen(Array.from(seenSet));
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
