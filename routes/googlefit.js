const express = require('express');
const https = require('https');
const resolveUser = require('../middleware/resolveUser');
const db = require('../db/pool');

const router = express.Router();
router.use(resolveUser);

// ─── Config (set these in your .env) ────────────────────────────────────────
const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI  = process.env.GOOGLE_REDIRECT_URI ||
  'https://fittrack-t4iu.onrender.com/api/googlefit/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
].join(' ');

// ─── Helpers ────────────────────────────────────────────────────────────────

// Minimal promise-based HTTPS POST (avoids adding axios as a dep)
function httpsPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = typeof body === 'string' ? body : new URLSearchParams(body).toString();
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Minimal HTTPS GET
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Ensure the google_fit_tokens table exists
async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS google_fit_tokens (
      user_id        INT PRIMARY KEY,
      access_token   TEXT NOT NULL,
      refresh_token  TEXT NOT NULL,
      expires_at     BIGINT NOT NULL,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

// Refresh an expired access token using the stored refresh token
async function refreshAccessToken(userId, refreshToken) {
  const result = await httpsPost('https://oauth2.googleapis.com/token', {
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type:    'refresh_token',
  });

  if (result.status !== 200 || !result.body.access_token) {
    throw new Error('Failed to refresh Google access token');
  }

  const { access_token, expires_in } = result.body;
  const expiresAt = Date.now() + (expires_in - 60) * 1000; // 60-second buffer

  await db.execute(
    `UPDATE google_fit_tokens
     SET access_token = ?, expires_at = ?, updated_at = NOW()
     WHERE user_id = ?`,
    [access_token, expiresAt, userId]
  );

  return access_token;
}

// Get a valid access token — refreshes if expired
async function getValidAccessToken(userId) {
  const [[row]] = await db.execute(
    'SELECT access_token, refresh_token, expires_at FROM google_fit_tokens WHERE user_id = ?',
    [userId]
  );
  if (!row) return null;

  if (Date.now() >= row.expires_at) {
    return refreshAccessToken(userId, row.refresh_token);
  }
  return row.access_token;
}

// Fetch today's step count from Google Fit Aggregate API
async function fetchTodaySteps(accessToken) {
  const now        = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startMs = startOfDay.getTime();

  // Google Fit aggregation endpoint
  const url = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';
  const body = JSON.stringify({
    aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
    bucketByTime: { durationMillis: 86400000 }, // 1 day bucket
    startTimeMillis: startMs,
    endTimeMillis: now,
  });

  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // Walk the bucket → dataset → point structure
          let steps = 0;
          for (const bucket of json.bucket || []) {
            for (const dataset of bucket.dataset || []) {
              for (const point of dataset.point || []) {
                for (const value of point.value || []) {
                  steps += value.intVal || 0;
                }
              }
            }
          }
          resolve(steps);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// Step 1 — frontend redirects to this to start the OAuth flow
router.get('/auth-url', (req, res) => {
  if (!req.fittrackUserId) {
    return res.status(401).json({ success: false, message: 'Login required to connect Google Fit' });
  }

  // Encode user id in state so we can recover it in the callback
  const state = Buffer.from(JSON.stringify({ userId: req.fittrackUserId })).toString('base64url');

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id',     CLIENT_ID);
  url.searchParams.set('redirect_uri',  REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope',         SCOPES);
  url.searchParams.set('access_type',   'offline');  // needed for refresh token
  url.searchParams.set('prompt',        'consent');   // always show consent to get refresh_token
  url.searchParams.set('state',         state);

  res.json({ success: true, url: url.toString() });
});

// Step 2 — Google redirects here with ?code=...&state=...
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://fittrack-t4iu.onrender.com';

  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/dashboard?googlefit=error`);
  }

  try {
    // Decode user id from state
    const { userId } = JSON.parse(Buffer.from(state, 'base64url').toString());

    // Exchange code for tokens
    const result = await httpsPost('https://oauth2.googleapis.com/token', {
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    'authorization_code',
    });

    if (result.status !== 200 || !result.body.access_token) {
      throw new Error('Token exchange failed');
    }

    const { access_token, refresh_token, expires_in } = result.body;
    const expiresAt = Date.now() + (expires_in - 60) * 1000;

    await ensureTable();

    // Upsert tokens for this user
    await db.execute(
      `INSERT INTO google_fit_tokens (user_id, access_token, refresh_token, expires_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         access_token  = VALUES(access_token),
         refresh_token = COALESCE(VALUES(refresh_token), refresh_token),
         expires_at    = VALUES(expires_at),
         updated_at    = NOW()`,
      [userId, access_token, refresh_token || '', expiresAt]
    );

    // Immediately sync today's steps
    const steps = await fetchTodaySteps(access_token);
    const today = new Date().toISOString().split('T')[0];
    await db.execute(
      `INSERT INTO user_daily_metrics (user_id, metric_date, steps_taken)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE steps_taken = VALUES(steps_taken)`,
      [userId, today, steps]
    );

    res.redirect(`${FRONTEND_URL}/dashboard?googlefit=connected`);
  } catch (err) {
    console.error('Google Fit callback error:', err);
    res.redirect(`${FRONTEND_URL}/dashboard?googlefit=error`);
  }
});

// Step 3 — frontend calls this to get the latest step count
// Also called on page load if the user is connected
router.post('/sync', async (req, res) => {
  const userId = req.fittrackUserId;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Login required' });
  }

  try {
    await ensureTable();
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      return res.status(404).json({ success: false, message: 'Google Fit not connected', connected: false });
    }

    const steps = await fetchTodaySteps(accessToken);
    const today = new Date().toISOString().split('T')[0];

    // Save to user_daily_metrics (same table the homepage already reads)
    await db.execute(
      `INSERT INTO user_daily_metrics (user_id, metric_date, steps_taken)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE steps_taken = VALUES(steps_taken)`,
      [userId, today, steps]
    );

    res.json({ success: true, steps, date: today, connected: true });
  } catch (err) {
    console.error('Google Fit sync error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Check connection status
router.get('/status', async (req, res) => {
  const userId = req.fittrackUserId;
  if (!userId) {
    return res.json({ success: true, connected: false });
  }

  try {
    await ensureTable();
    const [[row]] = await db.execute(
      'SELECT user_id FROM google_fit_tokens WHERE user_id = ?',
      [userId]
    );
    res.json({ success: true, connected: Boolean(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Disconnect — delete stored tokens
router.delete('/disconnect', async (req, res) => {
  const userId = req.fittrackUserId;
  if (!userId) return res.status(401).json({ success: false, message: 'Login required' });

  try {
    await ensureTable();
    await db.execute('DELETE FROM google_fit_tokens WHERE user_id = ?', [userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
