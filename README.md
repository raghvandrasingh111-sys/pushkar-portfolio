# Pushkar Raj Singh — video editor portfolio

Plain HTML / CSS / JS. No build step, no framework, no external requests (fonts are self-hosted in `assets/fonts`).

## Run locally
```
python tools/serve.py          # then open http://localhost:8000
```
Use this server (or any host with HTTP Range support) — opening `index.html` straight from disk breaks video seeking.

## Deploy
Upload the whole folder (`index.html`, `styles.css`, `main.js`, `assets/`, `media/`) to any static host — Netlify (drag-and-drop), Vercel, Cloudflare Pages, GitHub Pages. Change `og:image` in `index.html` to an absolute URL once you have a domain.

## Design system
Black / white / signal-red poster system. Bricolage Grotesque (headlines) + Figtree (text). Rectangular buttons, a "project bin + monitor" for the work, a clapper-stripe divider above the contact block. Every video is shown at its true aspect ratio — the monitor morphs between ratios instead of cropping.

## Motion
Full motion is the default: word-by-word headline reveals, curtain reveal of the hero, scroll-scrubbed About text, count-up numbers, a drawing timeline, accordion, hover/selection transitions, moving divider.
Visitors can switch everything off with **Motion: On/Off** in the footer (remembered in localStorage).
By default the site does **not** follow the OS "reduce motion" setting (many Windows machines have animations switched off by default or by battery saver, which made the first version look static). To follow the OS setting, set `HONOR_OS_REDUCED_MOTION = true` at the top of `main.js`. The hero preview always has a visible pause button.

## Things to edit
- Availability line: `<p class="avail">` in `index.html` (delete to hide).
- Experience dates/detail: the `#timeline` block.
- Project copy: the `#projData` block (card text) and the `#acc` accordion (breakdowns).
- No social handles/links anywhere; contact is `mailto:` + `tel:` only (no form — there is nowhere to submit one).

## Rebuilding the media (`tools/`)
Needs Python 3 and `pip install imageio-ffmpeg pillow`. Sources are read from `C:\Users\pushk\OneDrive\Desktop\Portfolio` (edit `SRC` in `tools/common.py`); originals are never modified.
```
python tools/build_media.py       # web copies, WebP posters, hover previews  -> media/pNN.*
python tools/make_overlays.py     # showreel labels + end card
python tools/build_reel.py        # showreel (media/showreel*.mp4, hero-loop.mp4)
```

## Showreel (44.6 s, 1920×1080 / 30 fps)
Single grammar for every clip: the picture is shown at its **true aspect ratio, full height, centred over a darkened blurred copy of itself** — nothing rotated, stretched or re-cropped. Audio is each clip's own sound, loudness-matched; the only synthesized sounds are a riser into the end card and a low impact on it. No music was added. Cuts are taken from existing cut points in the sources — it is **not** beat-synced (I measured and found no reliable alignment).

| Seg | Source | In → Out (s) | Notes | Join into next |
|---|---|---|---|---|
| A | 0719 | 5.30 → 6.95 | Blast as first frame, label 01 | hard cut |
| B | 0719 | 11.0 → 12.2 | Red close-up | hard cut |
| C | 0719 | 15.05 → 16.15 | The source's own rapid-cut flurry | hard cut |
| D | 0719 | 18.7 → 20.7 | Inferno, left to breathe | dip to black 0.16 |
| E | 0719 | 23.0 → 24.9 | Scream | dissolve 0.5 |
| F | chan kita final 2 | 6.2 → 10.2 | Slow hold, label 02 | dissolve 0.3 |
| G | chan kita final 2 | 12.13 → 15.13 | Teal night | hard cut |
| H | chan kita final 2 | 25.0 → 26.6 | Close-up | flash-white 0.2 |
| I1–I3 | complete4 | 0.2 / 37.0 / 70.5 (3.2 / 3.0 / 2.6 s) | Doorway, couple, sangeet, label 03 | hard, hard, dip 0.2 |
| J1–J2 | SHOWSHABAAZ | 20.0 (3.6 s) / 38.0 (2.4 s) | Keyword titles, label 04 | hard, flash 0.1 |
| K1–K2 | WhatsApp …10.13.30 | 0.0 (2.6 s) / 17.6 (2.4 s) | Kinetic type + counters, label 05 | hard, dip 0.2 |
| L1–L2 | WhatsApp …10.22.52 | 0.0 (2.6 s) / 47.0 (2.2 s) | Headline + group moment, label 06 | hard, dip 0.15 |
| R | all six | 6 × 0.42 s | One-shot-per-project recap, riser | dip 0.25 |
| Z | — | 3.4 s | Name card "Pushkar Raj Singh — Video Editor", impact | end |

## Notes on the source files
1. `0719.mp4` and `chan kita final 2.mp4` are landscape edits stored rotated 90° clockwise inside a 1440×2560 frame. The site/reel use them rotated upright (captions intact). The handle burned in at the bottom of those frames is cropped away (`UPRIGHT_FILTER` in `tools/common.py`), and `0719` is trimmed at 0:25 to drop its "Follow @…" end card. Originals are untouched.
2. `complete4.mp4` shows the family's phone numbers/address in its closing cards (after ~1:32). The web copy is trimmed to 1:30 — change `-t 90` in `tools/build_media.py` if you have permission to show them.
3. Rights: the cinematic edits use film footage/music and the other pieces use third-party artwork, logos and faces. The reel contains that audio — confirm you're comfortable publishing it, or swap in licensed music.
4. Descriptions only state what is visible on screen; no clients, dates, results or proficiency levels were invented.
