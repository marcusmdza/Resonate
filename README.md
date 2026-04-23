# Resonate

A dating app MVP where matches are made via Spotify music-taste compatibility. The premise: your listening history is more revealing than any questionnaire.

**Core philosophy:** One feature is real. Everything else is theater. The real feature is Spotify OAuth + pulling the logged-in user's actual listening data and rendering it beautifully. The fake features (other users, compatibility scores, chat, match triggers) are faked convincingly enough that the demo viewer's brain fills in the rest.

---

## User Flow

### 1. Landing Page (`Landing Page.html`)
The entry point. Hero section shows example match cards with real album artwork, a compatibility breakdown teaser, and a beta testimonial. The "Get Started" CTA kicks off the Spotify OAuth flow.

### 2. Spotify Connect (`Connect Spotify.html`)
Three states driven by a `?state=` query param:

- **`idle`** — Default. Shows the connect prompt and a "Connect Spotify" button that redirects to `/auth/spotify`.
- **`scanning`** — Shown immediately after OAuth redirect. Plays an animated scanning sequence while the server fetches the user's Spotify data in the background. Auto-advances to `signature` when done.
- **`signature`** — The reveal. Populates the user's real top artists (with images), top genres as chips, sonic signature bars (energy, mood, danceability, acousticness, tempo), and a radar polygon — all from live Spotify API data. A "Continue" button advances to the discovery stack.
- **`error`** — Shown if the Spotify data fetch fails.

### 3. Match View (`Match View.html`)
The discovery card stack. Loads 8 seeded profiles from `/api/discover`, sorted by compatibility percentage descending (94% → 76%). Each card shows:
- Profile photo, name, age, pronouns
- Currently playing song with album art
- Compatibility ring (SVG animated dashoffset)
- Sonic signature strip (energy/mood/tempo bars)
- Shared artists + vibe territory chips
- A match blurb and shared playlist preview

The first "like" on any card triggers the match overlay — showing the user's Spotify avatar alongside the matched profile's photo. Subsequent likes pass through normally. Navigation tabs link to Shows, Messages, and the user's Profile.

### 4. Profile (`Profile.html`)
The logged-in user's own profile. Populated from `/api/me` with real Spotify data: avatar, display name, top genres as chips, sonic signature bars + radar, top artists grid (with real images), and top tracks list with album art and formatted duration.

### 5. Concert Match (`Concert Match.html`)
The "Shows" tab. A curated featured concert (Bruno Mars) with listener cards showing which matches are also going — Samantha (94%), Emily (87%), Emmy (76%). Static, but wired with a real Spotify avatar in the nav.

### 6. Chat (`Chat.html`)
A pre-populated song-sharing conversation with Samantha (94% match). The UI supports three-column layout: match list sidebar, conversation thread, and a shared vibe rail. The conversation demonstrates the core song-send mechanic:
- You send **Best Part** by Daniel Caesar → she replies "OMGGG i love that song 😭"
- She sends **WANTCHU** by keshi
- She sends **ONLY** by LEEHI
- Right rail shows songs exchanged, resonance score, and send-back suggestions (Soft Spot / pov)

---

## What's Real vs. Faked

| Feature | Status |
|---|---|
| Spotify OAuth 2.0 (PKCE) | **Real** |
| Top artists, top tracks from Spotify API | **Real** |
| Sonic signature (audio feature averages) | **Real** |
| User avatar + display name | **Real** |
| All other app users | Faked (seeded JSON) |
| Compatibility percentages | Hardcoded |
| Shared artists on match cards | Hand-picked + stretch-injected from real user data |
| Match trigger | First like always matches |
| Chat messages | Static, pre-populated |
| Phone / 2FA | Not implemented |

---

## Tech Stack

- **Backend:** Node.js + Express, single `server.js` file
- **Frontend:** Vanilla HTML/CSS/JS, no framework
- **Session storage:** `express-session` (in-memory, resets on restart)
- **No database**

### Key backend routes

| Route | Purpose |
|---|---|
| `GET /` | Serves Landing Page |
| `GET /auth/spotify` | Generates PKCE verifier/challenge, redirects to Spotify OAuth |
| `GET /auth/spotify/callback` | Exchanges code → token, fetches all Spotify data, stores in session |
| `GET /api/me` | Returns session Spotify data as JSON (401 if not authed, 202 if still loading) |
| `GET /api/discover` | Returns seeded profiles sorted by compatibility, with real user artists stretch-injected into shared artist lists |
| `GET /api/discover/:id` | Returns a single profile by ID |

### Key data files

- `data/seed-profiles.json` — 8 hand-crafted match profiles (Samantha 94% → Emmy 76%) with bios, prompts, top artists, top genres, sonic signatures, and playlist data
- `data/artist-mappings.json` — Static genre and audio-feature data for 40 popular artists, used as a fallback since Spotify deprecated genre data and audio features for new developer apps in early 2025

---

## Known API Workarounds

**Spotify deprecated two endpoints for new apps in early 2025:**

1. **Artist genre data** — `/artists` no longer returns genres for new app registrations. Workaround: `data/artist-mappings.json` maps 40 popular artists to hand-curated genres and audio features.

2. **Audio features** — `/audio-features` returns 403 for new apps. Workaround: when a 403 is hit, the server falls back to averaging the audio data from `artist-mappings.json` entries that match the user's top artists.

---

## Setup

### 1. Spotify Developer App

1. Go to [developer.spotify.com](https://developer.spotify.com) and create a new app.
2. Add `http://localhost:3000/auth/spotify/callback` as a Redirect URI.
3. In the app's user management, add the presenter's Spotify account to the allowlist (apps start in Development Mode, limited to 25 users).
4. Required OAuth scope: `user-top-read`.

### 2. Environment

```bash
cp .env.example .env
```

Fill in `.env`:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/spotify/callback
SESSION_SECRET=any_random_string
```

### 3. Install and run

```bash
npm install
npm run dev     # development (nodemon, auto-restarts)
npm start       # production
```

App runs at `http://localhost:3000`.

---

## Project Structure

```
server.js                   Express backend — all routes and Spotify logic
package.json
.env                        Secrets (not committed)
.env.example                Template for .env

data/
  seed-profiles.json        8 seeded match profiles
  artist-mappings.json      Static genre + audio-feature fallback for 40 artists

public/
  Landing Page.html         Entry point / marketing screen
  Connect Spotify.html      OAuth + scanning animation + signature reveal
  Match View.html           Discovery card stack
  Profile.html              Logged-in user's profile (real Spotify data)
  Concert Match.html        Shows tab — concerts + who's going
  Chat.html                 Song-sharing chat with Samantha
  Listening Room.html       Ambient listening room screen
  images/                   Profile photos, album art, tour poster
  js/                       Any shared frontend JS utilities
```
