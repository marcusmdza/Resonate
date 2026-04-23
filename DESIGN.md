# Resonate — Dark Concert Glass

Reference DESIGN.md for high-contrast dark frosted surfaces, Spotify-green accents, and late-night concert atmospherics.

## 1. Visual Theme & Atmosphere

Dark concert glass. Deep charcoal stage, frosted panels floating in spotlight haze, a single vivid green pulse cutting through. Feels like the moment the lights drop at a venue — intimate, electric, a little reverent. Translucency is used for depth and breath, not decoration. Every surface is a pane of glass held up against the dark.

Mood: premium, nocturnal, immersive, sensual without being loud. The app should feel like headphones at 1am, not a billboard.

## 2. Color Palette & Roles

```
--bg:              #0a0a0d
--bg-elevated:     #111115
--bg-gradient:     radial-gradient(at 15% 0%, rgba(29, 185, 84, 0.12) 0%, transparent 55%),
                   radial-gradient(at 85% 20%, rgba(138, 43, 226, 0.10) 0%, transparent 50%),
                   radial-gradient(at 50% 90%, rgba(29, 185, 84, 0.08) 0%, transparent 60%);

--surface:         rgba(24, 24, 28, 0.55)    /* frosted dark glass */
--surface-strong:  rgba(28, 28, 34, 0.78)
--surface-raised:  rgba(34, 34, 40, 0.85)

--text:            #f4f4f6
--text-muted:      #a1a1aa
--text-dim:        #6b6b75

--border:          rgba(255, 255, 255, 0.08)
--border-strong:   rgba(255, 255, 255, 0.14)
--border-accent:   rgba(29, 185, 84, 0.40)

--accent:          #1DB954    /* Spotify Green — primary */
--accent-hover:    #1ED760    /* brighter on interaction */
--accent-soft:     rgba(29, 185, 84, 0.15)
--accent-glow:     rgba(29, 185, 84, 0.35)

--signal-warm:     #ff6b9d    /* secondary — match moments */
--signal-cool:     #8b5cf6    /* secondary — discovery */

```

Accent usage is deliberate and rare. Green is a signal — a match, a play state, a confirmed action — not a decorative color. If everything is green, nothing is.

## 3. Typography Rules

-   **Headlines:** `PP Neue Montreal` or `Söhne`, fallback `Inter`. Weight 500. Tight tracking (-0.02em) on display sizes.
-   **Body:** `Inter`, weight 400, 16px, line-height 1.6. Muted text at weight 400 in `--text-muted`.
-   **UI:** `Inter`, weight 500, 14–15px.
-   **Numerals / metadata** (BPM, match %, song duration): `JetBrains Mono` or Inter tabular-nums, weight 500, letter-spacing 0.02em, uppercase for labels.

Scale: 12 / 14 / 16 / 18 / 22 / 28 / 40 / 56 / 80.

Display sizes (40+) get slightly looser line-height (1.05) and are used sparingly — the dark background makes large type feel heavier than on light surfaces.

## 4. Component Stylings

**Buttons**

-   Primary: `--accent` fill, `#0a0a0d` text (dark text on green for contrast), radius 999px (pill). Hover lifts to `--accent-hover` with a 0 0 24px `--accent-glow` halo. Active state inset shadow.
-   Secondary: `--surface-strong` fill, 1px `--border-strong`, `--text` color, backdrop-filter `blur(24px)`, radius 999px.
-   Ghost: transparent, `--text-muted`, hovers to `--surface` with full blur.
-   Icon buttons: 40px circle, `--surface`, backdrop-blur, border `--border`.

**Cards**

-   `--surface` fill, 1px `--border`, radius 20px.
-   Backdrop-filter `blur(28px) saturate(140%)`.
-   Inner highlight: `inset 0 1px 0 rgba(255, 255, 255, 0.06)` — faint, just enough to catch the eye of the glass.
-   Match cards (the hero component): radius 24px, subtle `--border-accent` edge when a high-compatibility match is shown, with `--accent-glow` shadow bloom at the top edge.

**Inputs**

-   `--bg-elevated` fill (not frosted — inputs need certainty), 1px `--border`, radius 12px, 48px tall.
-   Focus: border shifts to `--accent`, 3px `--accent-soft` ring, no offset.
-   Placeholder in `--text-dim`.

**Navigation**

-   Floating pill, bottom-anchored on mobile, top-center on desktop. `--surface-strong`, backdrop-filter `blur(32px) saturate(180%)`, 1px `--border`, shadow `0 8px 40px rgba(0, 0, 0, 0.6)`.
-   Active item: `--accent-soft` pill background, `--accent` icon/text.

**Now Playing / Audio elements**

-   Thin `--accent` progress bar with a soft glow underneath.
-   Waveforms rendered in `--accent` at 60% opacity, peaks at full.
-   Album artwork cards: radius 12px, subtle 1px `--border`, and on hover a `--accent-glow` spill beneath.

## 5. Layout Principles

-   1240px max content width, 32px gutter, 24px on mobile.
-   Background: fixed `--bg` base with `--bg-gradient` layered on top, also fixed-position. Content scrolls over this static atmosphere — the "stage" doesn't move.
-   Generous vertical rhythm: 96px between major sections on desktop, 64px mobile.
-   Corner radii: 12px (small UI), 20px (cards), 24px (hero surfaces), 999px (pills and buttons).
-   Profile and match views favor single-column, centered, max 640px content — intimacy over density.

## 6. Depth & Elevation

Depth is built from darkness, blur, and a single light source (the green accent, when present). Three z-layers:

1.  **Stage** — the `--bg` plus `--bg-gradient` haze. Never interactive.
2.  **Glass** — frosted surfaces floating above the stage. Backdrop-blur 24–32px, saturate 140–180%, 1px light border, faint inner top highlight.
3.  **Spotlight** — the element with focus or importance. Gets the green accent, a soft glow (`0 0 40px var(--accent-glow)`), or a slight scale on hover (1.01).

Shadows are deep and warm: `0 12px 48px rgba(0, 0, 0, 0.5)` for elevated surfaces, `0 4px 16px rgba(0, 0, 0, 0.3)` for cards at rest. No neutral gray shadows — they flatten the mood.

## 7. Do's and Don'ts

**Do**

-   Use `backdrop-filter: blur(24px+) saturate(140%+)` on every glass surface.
-   Treat Spotify Green as a signal color — earned, not sprinkled.
-   Let the dark gradient background breathe; give it room.
-   Pair green glows with warm deep shadows — that's the "concert lighting" trick.
-   Use motion sparingly: fade-ins, gentle scale on hover, audio-reactive pulses on match moments.

**Don't**

-   Use pure `#000` — it reads as OLED-off, not atmospheric. Always `#0a0a0d` or warmer.
-   Put green on green-adjacent backgrounds, or use it for body text.
-   Stack more than two frosted layers — blur-on-blur turns to mud.
-   Add light-mode pastels, glossy gradients, or skeuomorphic textures.
-   Use hard 1px white borders — keep borders at 6–14% opacity so glass reads as glass.
-   Default to purple/pink gradients — this is Spotify's universe, not Instagram's.

## 8. Responsive Behavior

-   Below 768px: gradient simplifies to one green radial at top and one faint purple at bottom. Performance first.
-   Blur intensity drops to `blur(16px)` on mobile to protect frame rate; saturate drops to 120%.
-   Top pill nav becomes a bottom tab bar with the same frosted treatment — thumbs live at the bottom.
-   Match cards become full-bleed with 16px outer margin; album art scales to viewport width.
-   Hero typography scales from 80px → 44px; tracking loosens slightly.
-   Any `--accent-glow` effects reduce radius by 40% on mobile to avoid banding on lower-end displays.

## 9. Agent Prompt Guide

Bias: deep charcoal background (`#0a0a0d`, never black), faint green and violet radial gradients fixed on the body, frosted dark surfaces with `backdrop-filter: blur(24px+) saturate(140%+)`, Spotify Green (`#1DB954`) used sparingly as a signal, pill-shaped primary buttons with dark text on green, 12/20/24px radii, thin light borders at 8–14% opacity, deep warm shadows, soft green glows on focused or matched elements, late-night concert energy.

Reject: pure black backgrounds, light mode, opaque flat surfaces, neon-saturated palettes, green used as a decorative fill, purple-first color stories, hard borders at full white, busy gradients, glassmorphism applied without dark atmosphere underneath, generic "modern SaaS" cleanliness. This is a dating app for people who care about music at 1am — it should feel like that, not like a fintech dashboard.
