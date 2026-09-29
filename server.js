const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ extended: true, limit: '150mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const coversDir = path.join(__dirname, 'covers');
const audioDir = path.join(__dirname, 'audio');
const dataFile = path.join(__dirname, 'data.json');

fs.mkdirSync(coversDir, { recursive: true });
fs.mkdirSync(audioDir, { recursive: true });

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, '[]', 'utf-8');
}

app.use(express.static(__dirname));

// Helper to determine extension from Content-Type header or fallback
function getExtensionFromMime(mime, fallback) {
  if (!mime) return fallback;
  const lower = mime.toLowerCase();
  if (lower.includes('image/jpeg')) return 'jpg';
  if (lower.includes('image/png')) return 'png';
  if (lower.includes('image/webp')) return 'webp';
  if (lower.includes('image/gif')) return 'gif';
  if (lower.includes('audio/mpeg') || lower.includes('audio/mp3')) return 'mp3';
  if (lower.includes('audio/wav') || lower.includes('audio/x-wav')) return 'wav';
  if (lower.includes('audio/ogg')) return 'ogg';
  if (lower.includes('audio/mp4') || lower.includes('audio/m4a')) return 'm4a';
  return fallback;
}

// 1. INGEST FROM REMOTE WEB URL
app.post('/api/fetch-url', async (req, res) => {
  const { url, type, uuid, extension } = req.body;

  if (!url || !type || !uuid) {
    return res.status(400).json({ error: 'Missing parameters (url, type, or uuid required)' });
  }

  const folder = type === 'cover' ? 'covers' : 'audio';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Remote host HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    let ext = extension ? extension.replace(/^\./, '') : null;

    if (!ext || ext.length > 5) {
      ext = getExtensionFromMime(contentType, type === 'cover' ? 'jpg' : 'mp3');
    }

    const fileName = `${uuid}.${ext}`;
    const targetPath = path.join(__dirname, folder, fileName);

    const arrayBuffer = await response.arrayBuffer();
    await fs.promises.writeFile(targetPath, Buffer.from(arrayBuffer));

    console.log(`[INGEST SUCCESS] ${url} -> ${folder}/${fileName}`);
    res.json({ success: true, path: `${folder}/${fileName}` });
  } catch (err) {
    console.error(`[FETCH FAILED for ${url}]:`, err.message);
    res.status(500).json({ error: 'Failed to download remote file', details: err.message });
  }
});

// 2. DIRECT LOCAL FILE UPLOAD (Base64)
app.post('/api/upload', async (req, res) => {
  const { type, uuid, extension, data } = req.body;

  if (!type || !uuid || !data) {
    return res.status(400).json({ error: 'Missing parameters (type, uuid, data)' });
  }

  const folder = type === 'cover' ? 'covers' : 'audio';
  const cleanExt = (extension || (type === 'cover' ? 'png' : 'mp3')).replace(/^\./, '');
  const fileName = `${uuid}.${cleanExt}`;
  const targetPath = path.join(__dirname, folder, fileName);

  try {
    const base64Content = data.includes(';base64,') ? data.split(';base64,').pop() : data;
    await fs.promises.writeFile(targetPath, Buffer.from(base64Content, 'base64'));

    console.log(`[FILE UPLOAD] Saved -> ${folder}/${fileName}`);
    res.json({ success: true, path: `${folder}/${fileName}` });
  } catch (err) {
    console.error('[UPLOAD ERROR]', err.message);
    res.status(500).json({ error: 'Failed to save uploaded file', details: err.message });
  }
});

// 3. COMMIT UPDATES TO DATA.JSON
app.post('/api/save', async (req, res) => {
  try {
    await fs.promises.writeFile(dataFile, JSON.stringify(req.body, null, 2), 'utf-8');
    console.log(`[COMMIT] data.json updated (${req.body.length} records)`);
    res.json({ success: true });
  } catch (err) {
    console.error('[SAVE ERROR]', err.message);
    res.status(500).json({ error: 'Failed to write data.json', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  CYBER.EROS ROOT ADMIN SERVER ACTIVE`);
  console.log(`  Open Console: http://localhost:${PORT}/server.html`);
  console.log(`  Storage: ./covers/ and ./audio/`);
  console.log(`======================================================\n`);
});