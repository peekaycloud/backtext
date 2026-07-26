/**
 * Daily unique visitors by IP (hashed). Used on Vercel.
 * Marks each IP once per UTC day, then increments the day total.
 */
const { createHash } = require('crypto');

const NS = 'peekaycloud-backtext';
const SALT = 'backtext-visitor-v1';

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  if (Array.isArray(fwd) && fwd[0]) return String(fwd[0]).split(',')[0].trim();
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.trim()) return real.trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function counterGet(name) {
  const res = await fetch(`https://api.counterapi.dev/v1/${NS}/${encodeURIComponent(name)}/`);
  if (res.status === 400 || res.status === 404) return 0;
  if (!res.ok) throw new Error(`counter get ${res.status}`);
  const data = await res.json();
  return Number(data.count) || 0;
}

async function counterUp(name) {
  const res = await fetch(`https://api.counterapi.dev/v1/${NS}/${encodeURIComponent(name)}/up`);
  if (!res.ok) throw new Error(`counter up ${res.status}`);
  const data = await res.json();
  return Number(data.count) || 0;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const ip = clientIp(req);
    const day = new Date().toISOString().slice(0, 10);
    const hash = createHash('sha256').update(`${SALT}|${ip}`).digest('hex').slice(0, 20);
    const mark = `uip-${day}-${hash}`;
    const total = `unique-${day}`;

    const seen = await counterGet(mark);
    let count;
    if (seen < 1) {
      await counterUp(mark);
      count = await counterUp(total);
    } else {
      count = await counterGet(total);
      // Repair: IP was marked but the day total never landed.
      if (count < 1) count = await counterUp(total);
    }

    res.status(200).json({ count, day });
  } catch (err) {
    console.error('visit counter failed:', err);
    res.status(502).json({ error: 'Counter unavailable' });
  }
};
