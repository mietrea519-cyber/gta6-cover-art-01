// Panel geometry for the five-panel cover collage.
//
// A cover here is always one wide hero panel plus four smaller satellite
// panels. Where the satellites sit depends on the shape of the canvas:
//   - landscape: the hero owns the left, the satellites form a 2 x 2 block
//     on the right;
//   - portrait: the hero owns the top, the satellites form a 2 x 2 block
//     underneath it;
//   - square: the hero owns the top-left, two satellites stack on its right
//     and two more run along the bottom.
// Every rectangle this module returns is in canvas pixels, already inset by
// half the gutter, so the renderer can clip and paint without extra maths.

export const PANEL_COUNT = 5;
export const HERO_INDEX = 0;

function rectFromFractions(fx, fy, fw, fh, width, height, gutter) {
  return {
    x: fx * width + gutter / 2,
    y: fy * height + gutter / 2,
    w: fw * width - gutter,
    h: fh * height - gutter,
  };
}

const LAYOUT_FRACTIONS = {
  landscape: [
    [0, 0, 0.56, 1],
    [0.56, 0, 0.22, 0.5],
    [0.78, 0, 0.22, 0.5],
    [0.56, 0.5, 0.22, 0.5],
    [0.78, 0.5, 0.22, 0.5],
  ],
  portrait: [
    [0, 0, 1, 0.54],
    [0, 0.54, 0.5, 0.23],
    [0.5, 0.54, 0.5, 0.23],
    [0, 0.77, 0.5, 0.23],
    [0.5, 0.77, 0.5, 0.23],
  ],
  square: [
    [0, 0, 0.64, 0.66],
    [0.64, 0, 0.36, 0.33],
    [0.64, 0.33, 0.36, 0.33],
    [0, 0.66, 0.5, 0.34],
    [0.5, 0.66, 0.5, 0.34],
  ],
};

export function layoutNameFor(width, height) {
  const ratio = width / height;
  if (ratio > 1.12) return 'landscape';
  if (ratio < 0.9) return 'portrait';
  return 'square';
}

export function computePanels(width, height) {
  const gutter = Math.max(6, Math.round(Math.min(width, height) * 0.012));
  const fractions = LAYOUT_FRACTIONS[layoutNameFor(width, height)];
  return fractions.map(([fx, fy, fw, fh]) => rectFromFractions(fx, fy, fw, fh, width, height, gutter));
}

export function panelIndexAt(panels, px, py) {
  for (let i = panels.length - 1; i >= 0; i -= 1) {
    const r = panels[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}
