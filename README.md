# Vice Coast Cover Studio

[![make.fun — Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![make.fun rank](https://make.fun/badge/gta6-cover-art-01/mietrea519-cyber/gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![make.fun reward](https://make.fun/badge/gta6-cover-art-01/mietrea519-cyber/gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An offline web app that turns a photo and a caption into multi-panel,
GTA-style cover art — a big hero panel with four satellite panels, bold
Anton lettering, and a Vice City sunset or neon grade — and exports it as
a PNG in the sizes people actually post: 1080 × 1080, 1080 × 1350 and
1920 × 1080.

It is an entry in the [Make GTA 6 Cover Art](https://make.fun/c/gta6-cover-art-01)
competition on make.fun. Everything is original work for this entry: no
Rockstar Games logos, artwork or fonts are used anywhere.

## What it does

- **Five-panel collage.** One hero panel plus four smaller panels, with
  the layout adapting to the chosen aspect — satellites stack on the
  right for landscape, underneath for portrait, and wrap the corner for
  square.
- **Any photo, framed your way.** Load photos with the file picker
  (several at once) or by drag and drop. Click a panel to select it,
  drag on the canvas to reposition its photo, scroll to zoom, or use the
  zoom / X / Y sliders. One photo can fill every panel, or each panel
  can hold a different one. Two AI-generated sample photos are bundled
  for a one-click start.
- **Caption lettering.** An editable title and tagline drawn in the
  bundled Anton typeface (SIL Open Font License, see
  `app/fonts/OFL.txt`), with a thick black outline and an accent drop
  shadow, placed at the top or bottom of the cover, with an optional
  gentle arc on the title.
- **Three colour grades.** Vice Sunset, Neon Night and Classic Poster —
  each a canvas filter over the photos plus gradient glows, a vignette
  and film grain generated at run time.
- **Placeholder art.** Empty panels show a sunset-and-palms scene the
  app draws itself, so a cover still reads as a cover before you add
  photos.
- **One-step export.** The preview canvas is the export canvas: pick a
  size chip, press Export PNG, done.

## Run it locally

```sh
node serve.ts            # then open the printed address, port 8080
```

There is no build step and no network use: serve the `app/` folder with
any static file server and open `app/index.html` in a desktop browser.
Photos are read on your own machine and never uploaded.

## Hand it in

```sh
MAKEFUN_OUTPUT_DIR=/tmp/coverout node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and
`screenshots/` into the output directory and writes `dossier.json` there
using `buildDossier` from the untouched kit library in
`vendor/makefun-app.ts`.

## Layout of this repository

| Path | What it is |
| --- | --- |
| `main.ts` | The hand-in program described above. |
| `serve.ts` | A tiny static server for trying the app locally. |
| `app/index.html` | The studio page: controls sidebar plus the cover canvas. |
| `app/style.css` | The editor's styling, including the Anton `@font-face`. |
| `app/src/main.js` | Editor state, controls, drag / zoom framing, export. |
| `app/src/render.js` | The cover painter: panels, grades, grain, lettering. |
| `app/src/panels.js` | Five-panel layout geometry per aspect. |
| `app/src/grades.js` | The three colour grades and generated film grain. |
| `app/src/photos.js` | Photo loading and per-panel framing maths. |
| `app/src/shots.js` | `?shot=cover` / `?shot=editor` scenes for screenshots. |
| `app/fonts/` | Anton (SIL OFL 1.1) and its license text. |
| `app/samples/` | Two AI-generated sample photos, free to use. |
| `screenshots/` | Captures of the covers and the editor; see `shots.json`. |
| `shots.json` | The exact shot scenes the screenshots were taken from. |
| `vendor/makefun-app.ts` | The kit's dossier library, byte-identical. |

## Screenshot scenes

Open the app with a `?shot=` query to reproduce a screenshot scene, for
example `?shot=cover&photo=neon-driver&caption=Neon%20Coast&grade=neon&size=1920x1080`.
Cover mode shows only the finished poster; editor mode shows the full
studio with the scene loaded. Both set `window.__shotReady` once the
scene has painted. `shots.json` lists the four scenes in `screenshots/`.

## License

MIT — see `LICENSE`. The Anton font is under the SIL Open Font License
1.1 (`app/fonts/OFL.txt`).

---

Built for [make.fun](https://make.fun/?ref=1e3qpbvy) — try the platform
through my referral link: https://make.fun/?ref=1e3qpbvy
