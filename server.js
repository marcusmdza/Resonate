require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const ARTIST_MAPPING    = require('./data/artist-mappings.json');
const SEED_PROFILES     = require('./data/seed-profiles.json');

const SPOTIFY_AUTH_URL  = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API       = 'https://api.spotify.com/v1';
const SCOPES            = 'user-top-read';

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
}));

app.use(express.static(path.join(__dirname, 'public')));

// ─── Spotify API helper ───────────────────────────────────────────────────────

async function spotifyGet(endpoint, token) {
  const doFetch = () => fetch(`${SPOTIFY_API}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let res = await doFetch();

  // One retry on 429 after honouring Retry-After (default 2s)
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
    console.log(`[Spotify] Rate limited on ${endpoint}. Retry after ${retryAfter}s.`);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
    res = await doFetch();
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const retryAfter = res.status === 429
      ? parseInt(res.headers.get('Retry-After') || '2', 10)
      : null;
    if (res.status === 429) {
      console.log(`[Spotify] Rate limited on ${endpoint} (retry also failed). Retry-After: ${retryAfter}s.`);
    }
    const err = new Error(`Spotify ${endpoint} → ${res.status}`);
    err.status = res.status;
    err.responseBody = body;
    err.retryAfter = retryAfter;
    throw err;
  }

  return res.json();
}

// ─── Sonic signature + data fetch ────────────────────────────────────────────

async function fetchSpotifyData(token) {
  // Parallel fetch: profile, top artists, top tracks
  const [me, artistsRes, tracksRes] = await Promise.all([
    spotifyGet('/me', token),
    spotifyGet('/me/top/artists?limit=20&time_range=medium_term', token),
    spotifyGet('/me/top/tracks?limit=50&time_range=medium_term', token),
  ]);

  const artists = artistsRes.items ?? [];
  const tracks  = tracksRes.items ?? [];

  // Top genres from static mapping (Spotify deprecated genre data Feb 2026)
  const mappedArtists = artists.filter(a => ARTIST_MAPPING[a.name]);
  console.log(`[Mapping] Matched ${mappedArtists.length}/${artists.length} top artists`);

  const genreCounts = {};
  for (const artist of mappedArtists) {
    for (const genre of ARTIST_MAPPING[artist.name].genres) {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    }
  }
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  // ── Sonic signature via audio features, fallback to popularity estimates ──
  let sonicSignature;
  const trackIds = tracks.map(t => t.id);

  try {
    const ids = trackIds.slice(0, 100).join(',');
    const featuresRes = await spotifyGet(`/audio-features?ids=${ids}`, token);
    const valid = featuresRes.audio_features.filter(Boolean);

    if (valid.length === 0) throw new Error('No valid audio features returned');

    const avg = key => valid.reduce((s, f) => s + f[key], 0) / valid.length;

    sonicSignature = {
      energy:       +avg('energy').toFixed(3),
      danceability: +avg('danceability').toFixed(3),
      valence:      +avg('valence').toFixed(3),
      tempo:        +avg('tempo').toFixed(1),
      acousticness: +avg('acousticness').toFixed(3),
    };

    console.log('[Spotify] Audio features: ✓ real data');
  } catch (err) {
    if (err.status === 403 || err.status === 401) {
      console.log(`[Spotify] Audio features: ${err.status} — using artist mapping fallback`);

      if (mappedArtists.length === 0) {
        sonicSignature = { energy: 0.5, danceability: 0.5, valence: 0.5, tempo: 115.0, acousticness: 0.5 };
      } else {
        const avg = key =>
          mappedArtists.reduce((s, a) => s + ARTIST_MAPPING[a.name].audio[key], 0) / mappedArtists.length;
        sonicSignature = {
          energy:       +avg('energy').toFixed(3),
          danceability: +avg('danceability').toFixed(3),
          valence:      +avg('valence').toFixed(3),
          tempo:        +avg('tempo').toFixed(1),
          acousticness: +avg('acousticness').toFixed(3),
        };
      }
    } else {
      // Unexpected error — rethrow so caller can log it
      throw err;
    }
  }

  return {
    displayName:  me.display_name || me.id,
    profileImage: me.images?.[0]?.url ?? null,
    topArtists: artists.map(a => ({
      name:       a.name,
      id:         a.id,
      image:      a.images?.[0]?.url ?? null,
      genres:     a.genres ?? [],
      popularity: a.popularity,
    })),
    topTracks: tracks.map(t => ({
      name:       t.name,
      id:         t.id,
      artists:    (t.artists ?? []).map(a => a.name),
      albumName:  t.album?.name ?? null,
      albumImage: t.album?.images?.[0]?.url ?? null,
      durationMs: t.duration_ms,
    })),
    topGenres,
    sonicSignature,
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Landing Page.html'));
});

app.get('/auth/spotify', (req, res) => {
  const verifier  = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  req.session.codeVerifier = verifier;

  const params = new URLSearchParams({
    client_id:             process.env.SPOTIFY_CLIENT_ID,
    response_type:         'code',
    redirect_uri:          process.env.SPOTIFY_REDIRECT_URI,
    scope:                 SCOPES,
    code_challenge_method: 'S256',
    code_challenge:        challenge,
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

  // Exchange code for access token
  let accessToken;
  try {
    const tokenRes = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.SPOTIFY_REDIRECT_URI,
        client_id:     process.env.SPOTIFY_CLIENT_ID,
        code_verifier: verifier,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      console.error('[Spotify] Token exchange failed:', tokenRes.status, body);
      return res.redirect('/?error=token_failed');
    }

    const tokens = await tokenRes.json();
    accessToken = tokens.access_token;
    req.session.accessToken = accessToken;
    delete req.session.codeVerifier;
  } catch (err) {
    console.error('[Spotify] Token exchange error:', err.message);
    return res.redirect('/?error=server_error');
  }

  // Fetch all Spotify data and compute sonic signature
  try {
    const data = await fetchSpotifyData(accessToken);
    req.session.spotifyData = data;
    console.log(`[Spotify] Data ready for: ${data.displayName} | genres: ${data.topGenres.join(', ')}`);
  } catch (err) {
    console.error(`[Spotify] Data fetch failed: ${err.message}`);
    if (err.responseBody) console.error(`[Spotify] Response body: ${err.responseBody}`);
    if (err.status === 429) {
      console.error(`[Spotify] Rate limited. Retry after ${err.retryAfter ?? 2} seconds.`);
    }
    req.session.fetchError = { message: err.message, status: err.status ?? null };
    return res.redirect(`/Connect%20Spotify.html?state=error&msg=${encodeURIComponent(err.message)}`);
  }

  res.redirect('/Connect%20Spotify.html?state=scanning');
});

app.get('/api/me', (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (req.session.fetchError) {
    return res.status(500).json({ error: 'Data fetch failed', detail: req.session.fetchError });
  }
  if (!req.session.spotifyData) {
    return res.status(202).json({ status: 'pending', message: 'Data not yet fetched' });
  }
  res.json(req.session.spotifyData);
});

app.get('/api/debug/artist-genres', async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const token = req.session.accessToken;

  const makeCall = async (label, path) => {
    const url = `${SPOTIFY_API}${path}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`[debug] ${label} → ${response.status}`);
    const body = await response.json().catch(() => ({}));
    return { label, status: response.status, path, body };
  };

  const [single, batch, search] = await Promise.allSettled([
    makeCall('single artist', '/artists/20wkVLutqVOYrc0kxFs7rA'),
    makeCall('batch artists', '/artists?ids=20wkVLutqVOYrc0kxFs7rA,6mmSS7itNWKbapgG2eZbIg,0du5cEVh5yTK9QJze8zA0C'),
    makeCall('search',        '/search?q=Daniel+Caesar&type=artist&limit=1'),
  ]);

  const extract = (settled) => {
    if (settled.status === 'rejected') return { error: settled.reason?.message };
    const { label, status, path, body } = settled.value;
    // Pull just the genres fields from each response shape
    let genres;
    if (body.genres !== undefined) genres = body.genres;                        // single artist
    else if (body.artists?.length)  genres = body.artists.map(a => ({ name: a.name, genres: a.genres })); // batch
    else if (body.artists?.items)   genres = body.artists.items.map(a => ({ name: a.name, genres: a.genres })); // search
    return { label, status, path, genres };
  };

  res.json({
    single: extract(single),
    batch:  extract(batch),
    search: extract(search),
  });
});

app.get('/api/discover/:id', (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const profile = SEED_PROFILES.find(p => p.id === req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

app.get('/api/discover', (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Deep-copy so we can mutate sharedArtists without touching the source
  const profiles = JSON.parse(JSON.stringify(SEED_PROFILES));
  profiles.sort((a, b) => b.compatibility - a.compatibility);

  // STRETCH: prepend up to 2 of the user's real top artists into each
  // profile's sharedArtists when that artist also appears in the profile's
  // topArtists — makes the "you both spin" section feel uncanny during demo
  const userTopArtists = (req.session.spotifyData?.topArtists ?? [])
    .slice(0, 10)
    .map(a => a.name);

  if (userTopArtists.length > 0) {
    for (const profile of profiles) {
      const inject = userTopArtists
        .filter(name => profile.topArtists.includes(name) && !profile.sharedArtists.includes(name))
        .slice(0, 2);
      if (inject.length > 0) {
        profile.sharedArtists = [...inject, ...profile.sharedArtists].slice(0, 5);
      }
    }
    console.log(`[Discover] Injected real top artists for ${userTopArtists.slice(0, 3).join(', ')}…`);
  }

  res.json(profiles);
});

app.listen(PORT, () => {
  console.log(`Resonate running at http://localhost:${PORT}`);
});
