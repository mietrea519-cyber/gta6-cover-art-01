// The three colour grades and the helpers that support them.
//
// A grade is a small bundle of decisions:
//   filter    — the CSS-style canvas filter string applied while a photo is
//               drawn, so the grade touches the photograph itself;
//   wash      — a translucent colour laid over every panel afterwards;
//   glowTop / glowBottom — the two ends of the gradient glow that frames
//               the whole poster;
//   accent    — the colour used for the caption's drop shadow and for the
//               selected-panel outline;
//   sky       — the two colours the empty-panel placeholder sky blends
//               between, so placeholders sit comfortably in the grade.
// Film grain is generated at run time on a small off-screen canvas and then
// tiled; nothing about it is a shipped image asset.

export const GRADE_IDS = ['sunset', 'neon', 'classic'];

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.32) contrast(1.07) brightness(1.06) sepia(0.18)',
    wash: 'rgba(255, 122, 61, 0.14)',
    glowTop: 'rgba(255, 176, 92, 0.34)',
    glowBottom: 'rgba(214, 51, 132, 0.30)',
    accent: '#ffb347',
    shadow: '#ff2e88',
    sky: ['#ffd98a', '#ff5e7a'],
    grainAlpha: 0.05,
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.45) contrast(1.16) brightness(0.98) hue-rotate(-10deg)',
    wash: 'rgba(38, 24, 92, 0.18)',
    glowTop: 'rgba(0, 229, 255, 0.26)',
    glowBottom: 'rgba(255, 43, 214, 0.34)',
    accent: '#00e5ff',
    shadow: '#ff2bd6',
    sky: ['#2b1a5e', '#0d2b52'],
    grainAlpha: 0.07,
  },
  classic: {
    label: 'Classic Poster',
    filter: 'saturate(1.08) contrast(1.12) brightness(1.03) sepia(0.28)',
    wash: 'rgba(214, 164, 65, 0.12)',
    glowTop: 'rgba(255, 226, 150, 0.22)',
    glowBottom: 'rgba(120, 72, 20, 0.26)',
    accent: '#f5c542',
    shadow: '#20222b',
    sky: ['#f2d492', '#c97b4a'],
    grainAlpha: 0.09,
  },
};

export function gradeById(id) {
  return GRADES[id] ?? GRADES.sunset;
}

let cachedGrain = null;

export function grainCanvas() {
  if (cachedGrain) return cachedGrain;
  const side = 160;
  const tile = document.createElement('canvas');
  tile.width = side;
  tile.height = side;
  const ctx = tile.getContext('2d');
  const pixels = ctx.createImageData(side, side);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const shade = Math.floor(Math.random() * 256);
    pixels.data[i] = shade;
    pixels.data[i + 1] = shade;
    pixels.data[i + 2] = shade;
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  cachedGrain = tile;
  return tile;
}
