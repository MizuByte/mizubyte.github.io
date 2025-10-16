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

function buildMessage(item) {
  // customize the message format here
  return `Neue Spoiler: ${item.title || item.text || ''}\n${item.url || ''}`;
}

async function notifyDiscord(webhook, items) {
  for (const it of items) {
    const content = buildMessage(it);
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
  }
}

async function scrapeOnce() {
  const url = cfg.url;
  const selector = cfg.selector;
  const idAttr = cfg.idAttr || null;
  const webhook = process.env.DISCORD_WEBHOOK || cfg.discordWebhook;
  if (!webhook) {
    console.error('No Discord webhook provided. Set DISCORD_WEBHOOK env or discordWebhook in config.json');
    process.exit(1);
  }

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Evaluate page and extract items
  const items = await page.$$eval(selector, (nodes, idAttr) => {
    return nodes.map(n => {
      const text = n.textContent.trim().slice(0,200);
      const url = (n.querySelector && n.querySelector('a')) ? (n.querySelector('a').href) : null;
      const id = idAttr ? (n.getAttribute(idAttr) || text) : text;
      const title = (n.querySelector && n.querySelector('h3')) ? n.querySelector('h3').innerText.trim() : null;
      return { id, text, url, title };
    });
  }, idAttr);

  await browser.close();

  const seen = await loadSeen();
  const seenSet = new Set(seen);
  const newItems = items.filter(it => !seenSet.has(it.id));
  if (newItems.length > 0) {
    console.log(`Found ${newItems.length} new items`);
    await notifyDiscord(webhook, newItems);
    const updated = seen.concat(newItems.map(it => it.id));
    await saveSeen(updated);
  } else {
    console.log('No new items');
  }
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
