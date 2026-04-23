# Resonate

Dating app MVP — matches made via Spotify music-taste compatibility.

## Setup

1. Copy `.env.example` to `.env` and fill in your Spotify app credentials.
2. `npm install`
3. `npm run dev`

## Spotify Developer Setup

- Create an app at [developer.spotify.com](https://developer.spotify.com).
- Add `http://localhost:3000/auth/spotify/callback` as a Redirect URI.
- Add the presenter's Spotify account to the app's user allowlist (Development Mode).
- Required scope: `user-top-read`.

## Project Structure

```
public/       Static files served directly (HTML pages, frontend JS)
public/js/    Frontend JavaScript (fetches API, populates DOM)
data/         Seed profiles JSON (fake match users)
server.js     Express backend entry point
```
