#!/usr/bin/env node
// Simple Node script to fetch APOD JSON and download a few image files
// Beginner-friendly and dependency-free.

const fs = require('fs');
const path = require('path');
const https = require('https');

const API = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';
const OUT_DIR = path.join(__dirname, '..', 'img', 'apod');
const MAX_DOWNLOAD = 6; // how many images to download

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchJson(res.headers.location));
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (err) { reject(err); }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadFile(res.headers.location, dest));
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(dest)));
    }).on('error', err => {
      try { fs.unlinkSync(dest); } catch(e){}
      reject(err);
    });
  });
}

async function main() {
  console.log('Fetching APOD JSON from', API);
  ensureDir(OUT_DIR);
  let data;
  try {
    data = await fetchJson(API);
  } catch (err) {
    console.error('Failed to fetch JSON:', err.message || err);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error('Unexpected JSON shape: expected an array');
    process.exit(1);
  }

  const images = data.filter(i => i.media_type === 'image' && (i.hdurl || i.url));
  console.log(`Found ${images.length} image entries; will download up to ${MAX_DOWNLOAD}.`);

  let count = 0;
  for (const item of images) {
    if (count >= MAX_DOWNLOAD) break;
    const url = item.hdurl || item.url;
    if (!url || !/^https?:\/\//i.test(url)) continue;

    // create a safe filename: date-title.ext
    const ext = path.extname(new URL(url).pathname) || '.jpg';
    const safeTitle = (item.title || 'apod').replace(/[^a-z0-9\-_. ]/gi, '').replace(/\s+/g, '_').slice(0,40);
    const filename = `${item.date || 'unknown'}_${safeTitle}${ext}`;
    const dest = path.join(OUT_DIR, filename);

    try {
      console.log(`Downloading (${count+1}) ${url} -> ${dest}`);
      await downloadFile(url, dest);
      count++;
    } catch (err) {
      console.error('  Failed to download:', err.message || err);
    }
  }

  console.log(`Done. Downloaded ${count} files into ${OUT_DIR}`);
}

main();
