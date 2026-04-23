# Resonate — MVP Build Plan

> **For Claude Code:** Read this entire document before writing any code. This project is being built **incrementally, step by step.** Do NOT run ahead. At the end of this document there is a list of steps — complete ONLY the step the user explicitly asks for, then stop and wait for the next instruction. Do not chain steps together. Do not scaffold future features in advance. If a step is ambiguous, ask before acting.
>
> **Always reference `DESIGN.md`** before modifying any HTML, CSS, or visual component. The design system (dark concert glass, frosted surfaces, Spotify green as signal, late-night energy) is already established and non-negotiable. Any new UI you create must match it.

---

## 1. Project Context

**Resonate** is a dating app MVP where matches are made via Spotify music-taste compatibility. This is a **2-hour build window**, so scope is aggressively limited.

The HTML pages for all screens already exist in this project folder and were designed against `DESIGN.md`. They currently have placeholder data. Our job is to wire up the one real feature and fake the rest convincingly.

## 2. The Core Principle

**One feature is real. Everything else is theater.**

- **Real:** Spotify OAuth + pulling the logged-in user's actual listening data (top artists, top tracks, top genres, audio features) and rendering it in the UI.
- **Faked:** Every other user in the app, compatibility scores, match triggers, chat messages, phone verification, profile persistence.

The demo's magic comes from the viewer seeing **their own real Spotify data** rendered beautifully. Their brain then fills in that everyone else's data must also be real. Do not try to build real matching logic. Do not try to build a real user database. Do not add features not in this plan.

## 3. What's Real vs. Faked

### Real (must actually work)
- Spotify OAuth 2.0 flow (authorization code with PKCE)
- Fetching `/me/top/artists`, `/me/top/tracks`, and audio features from the Spotify Web API
- Computing the user's "sonic signature" (averages of energy, danceability, valence, tempo, acousticness across their top tracks)
- Rendering all of the above on the sonic signature reveal screen and the user's own profile card

### Faked (hardcoded or stubbed)
- All other users — seeded as a static JSON file (8–10 profiles with hand-picked artists, stock photos, pre-written bios and prompts)
- Compatibility percentages — hardcoded per seed user, picked to look impressive (94%, 89%, 87%, etc.)
- Shared artists on match cards — hand-picked to include popular artists that most demo viewers will have in their top 50 (Taylor Swift, The Weeknd, Kendrick, Drake, etc.)
- **Stretch goal if time permits:** dynamically inject 2–3 of the logged-in user's actual top artists into seed profiles' "shared artists" lists at render time, to make the illusion uncanny
- Match trigger — the first "like" always results in a match
- Chat — pre-populated static messages, no real messaging backend
- Phone / 2FA — any 6-digit code works, or skip the screen entirely
- Profile creation — fields accept input but do not need to persist across sessions
- Photo upload — use stock images or URL input, no real file upload

## 4. Tech Stack (keep it minimal)

- **Backend:** Node.js + Express (or Python + Flask if the user prefers — ask if unclear). Single server file if possible.
- **Frontend:** The existing static HTML/CSS files. Add vanilla JS (or minimal framework) only as needed to fetch data from the backend and populate the DOM.
- **Storage:** In-memory session or signed cookie. **No database.** When the server restarts, sessions reset — this is acceptable for a demo.
- **Env vars:** `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `SESSION_SECRET`.

## 5. Minimum Backend Surface

Only these routes. Do not add others without asking.

- `GET /` — serves the landing page
- `GET /auth/spotify` — redirects to Spotify's authorization URL with `user-top-read` scope
- `GET /auth/spotify/callback` — exchanges the code for an access token, fetches top artists/tracks/audio features, computes the sonic signature, stores everything in the session, redirects to the loading/reveal screen
- `GET /api/me` — returns the session's Spotify data as JSON for the frontend to consume
- `GET /api/discover` — returns the seeded match profiles (from the static JSON file) as JSON
- Static file serving for all HTML, CSS, JS, and image assets

That's it. ~6 routes total.

## 6. Spotify API Notes (read before starting)

- New Spotify developer apps are in **Development Mode** by default. Only Spotify accounts explicitly added to the app's user allowlist can authenticate. For the demo, add only the presenter's account. Do not apply for Extended Quota Mode — it takes days.
- Required OAuth scope: `user-top-read`. Without it, `/me/top/*` endpoints return nothing useful.
- The audio features endpoint is `/audio-features?ids=...` — batch up to 100 track IDs per call.
- Token refresh is not needed for a demo (access tokens live for ~1 hour, longer than any demo).

## 7. Demo Screen Flow (for reference — this is what exists in HTML)

1. Landing page → Get Started button → Spotify OAuth
2. Spotify connect screen (real OAuth)
3. Loading / sonic signature analysis (real API calls happen here, animation provides cover)
4. Sonic signature reveal (real data — top artists, genres, signature bars)
5. Onboarding basics + phone 2FA (fake, skip or stub)
6. Profile creation (fake persistence)
7. Discovery card stack (seeded JSON + fake compatibility %)
8. Match profile detail (seeded JSON)
9. "It's a match" screen (triggered on first like)
10. Chat with song-send (static, pre-populated)
11. Empty/error states (static HTML)

## 8. Design System Rules (non-negotiable)

Before modifying any HTML or CSS, **read `DESIGN.md`**. Key rules that must be preserved:

- Deep charcoal backgrounds, never pure `#000`
- Every surface uses `backdrop-filter: blur(24px+) saturate(140%+)`
- Spotify Green (`#1DB954`) used sparingly as a signal, never as decoration
- Borders at 8–14% white opacity
- Deep warm shadows, no gray flat shadows
- Pill-shaped primary buttons, 12/20/24px radii elsewhere
- Typography: `PP Neue Montreal` / `Inter` / `JetBrains Mono` for numerals

Any new UI (loading animations, data renders, card components) must match these rules. If you're unsure whether a design choice fits, ask before implementing.

---

## 9. Incremental Build Steps

**Do not do all of these at once. The user will tell you which step to work on. Complete it, stop, and wait.**

### Step 1 — Project structure (START HERE)
- Inventory the existing HTML files in the folder.
- Propose a clean folder structure for a Node/Express (or Flask, if user prefers) project that serves the existing HTML, has a backend entry point, a place for the seed data JSON, a place for frontend JS, and a place for static assets.
- Create the folders and move the existing HTML into the appropriate location.
- Add a `README.md` stub, `.gitignore`, `.env.example`, and `package.json` (or equivalent).
- **Do not write any backend code yet. Do not touch the HTML contents. Do not install OAuth libraries.** Just structure.
- Report what you did and wait for the next instruction.

### Step 2 — Backend skeleton
- Set up the Express server (or Flask app).
- Static file serving for the HTML pages.
- Empty route handlers for the 6 routes listed in Section 5 (return placeholder responses).
- Confirm the existing HTML pages load correctly in the browser.

### Step 3 — Spotify OAuth flow
- Implement `/auth/spotify` and `/auth/spotify/callback`.
- Session storage for the access token and user ID.
- Test end-to-end: click Get Started → Spotify auth → redirected back with a valid token stored.

### Step 4 — Spotify data fetch + sonic signature
- On callback, fetch top artists, top tracks, and audio features.
- Compute the sonic signature (averages).
- Store in session.
- Implement `/api/me` to return this data.

### Step 5 — Wire the sonic signature reveal screen
- Frontend JS fetches `/api/me` on the reveal screen.
- Populate top artists (with images), top genres, and the signature bars with real data.
- Match the design system exactly.

### Step 6 — Seeded match profiles
- Create the seed data JSON (8–10 profiles).
- Implement `/api/discover` to return them.
- Wire the discovery card stack and match profile detail screens to real seed data.
- **Stretch:** dynamically inject the logged-in user's actual top artists into seed profiles' shared-artist lists.

### Step 7 — Fake the rest
- Like button → match screen on first click.
- Chat screen stays static.
- Onboarding and 2FA stay as-is or get lightly stubbed.

### Step 8 — Polish + demo rehearsal
- Run through the full flow.
- Fix visual glitches.
- Confirm the presenter's Spotify account is on the developer app allowlist.

---

**Again: do only the step the user asks for. Stop. Wait. Do not improvise additional features.**
