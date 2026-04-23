require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SCOPES = 'user-top-read';

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
}));

app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Landing Page.html'));
});

app.get('/auth/spotify', (req, res) => {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  req.session.codeVerifier = verifier;

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });

  res.redirect(`${SPOTIFY_AUTH_URL}?${params}`);
});

app.get('/auth/spotify/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect('/?error=auth_denied');
  }

  const verifier = req.session.codeVerifier;
  if (!verifier) {
    return res.redirect('/?error=session_expired');
  }

  try {
    const tokenRes = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        code_verifier: verifier,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      console.error('Spotify token error:', tokenRes.status, body);
      return res.redirect('/?error=token_failed');
    }

    const tokens = await tokenRes.json();
    req.session.accessToken = tokens.access_token;
    delete req.session.codeVerifier;

    res.redirect('/Connect%20Spotify.html?state=scanning');
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/?error=server_error');
  }
});

app.get('/api/me', (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Step 4: will return real Spotify data from session
  res.json({ status: 'placeholder', message: 'Real data coming in Step 4' });
});

app.get('/api/discover', (req, res) => {
  // Step 6: will return seed profiles from data/seed-profiles.json
  res.json({ status: 'placeholder', message: 'Seed profiles coming in Step 6' });
});

app.listen(PORT, () => {
  console.log(`Resonate running at http://localhost:${PORT}`);
});
