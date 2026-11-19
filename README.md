# gta6-cover-art-01 — Vice Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/mietrea519-cyber/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/mietrea519-cyber/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Coast Cover Studio** turns your own photos into multi-panel, GTA-poster-style cover art and exports it as a PNG in the sizes posts actually use. Everything runs locally in the browser — photos never leave your machine.

## What it does

- **Five-panel collage** — one hero panel plus four supporting panels with thin poster seams, in layouts tuned for square, portrait and landscape posts.
- **Your photos, your framing** — add photos by picking, dragging and dropping, or start from the two bundled AI-made samples. Click a panel, drag its photo into place, scroll to zoom, or use the framing sliders. One photo can fill every panel, each framed differently.
- **Poster lettering** — an editable title and tagline in a bold condensed display face (Anton, SIL Open Font License, vendored under `app/fonts/`), with a thick outline, an accent drop shadow, top or bottom placement, and an optional arc.
- **Three colour grades** — Vice Sunset, Neon Night and Classic Poster, each a photo filter plus gradient glows, film grain and a vignette painted over the collage.
- **Export at full resolution** — 1080 × 1080, 1080 × 1350 or 1920 × 1080 PNG, drawn on canvas at the exact size. The preview is the export: what you see is what you share.
- **Fully offline** — static files under `app/`, no build step, no network request; empty panels show a drawn sunset placeholder scene instead of borrowed art. Everything is original: no Rockstar logos, artwork, characters or fonts.

## Run it

Serve `app/` with any static file server, or use the bundled one (Node, standard library only):

```sh
node serve.ts   # then open http://localhost:8080
```

The entry program hands the app in: `MAKEFUN_OUTPUT_DIR=out node main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored library (`vendor/makefun-app.ts`, unchanged).

`screenshots/` holds the maker's screenshots (the first by name is the cover); `shots.json` lists the fixed scenes used to take them through the app's `?shot=` mode.

## Layout

- `main.ts` — the hand-in program · `serve.ts` — local preview server
- `app/index.html`, `app/style.css` — the page and its styling
- `app/src/main.js` — UI wiring and state · `app/src/render.js` — the cover renderer · `app/src/panels.js` — collage layouts · `app/src/grades.js` — colour grades · `app/src/photos.js` — photo loading and cover-fit maths · `app/src/shots.js` — screenshot scenes
- `app/fonts/` — Anton (OFL) · `app/samples/` — two AI-generated sample photos

---

<sub>Entered on [make.fun](https://make.fun/?ref=1e3qpbvy&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
