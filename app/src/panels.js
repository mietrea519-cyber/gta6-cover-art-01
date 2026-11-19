// The collage layouts: one hero panel plus four supporting panels, as fractions of the canvas
// (x, y, width, height from the top-left). Portrait and square posts share one layout, landscape
// posts get a wide one with a full-height hero on the left. The caption is drawn over the collage,
// poster-style, so the panels always fill the whole cover.

const PORTRAIT_PANELS = [
  { x: 0.000, y: 0.000, w: 0.598, h: 0.618 }, // hero, top left
  { x: 0.613, y: 0.000, w: 0.387, h: 0.300 }, // right, top
  { x: 0.613, y: 0.315, w: 0.387, h: 0.303 }, // right, middle
  { x: 0.000, y: 0.633, w: 0.490, h: 0.367 }, // bottom left
  { x: 0.505, y: 0.633, w: 0.495, h: 0.367 }, // bottom right
];

const LANDSCAPE_PANELS = [
  { x: 0.000, y: 0.000, w: 0.418, h: 1.000 }, // hero, full height at the left
  { x: 0.433, y: 0.000, w: 0.272, h: 0.488 }, // middle, top
  { x: 0.433, y: 0.512, w: 0.272, h: 0.488 }, // middle, bottom
  { x: 0.720, y: 0.000, w: 0.280, h: 0.488 }, // right, top
  { x: 0.720, y: 0.512, w: 0.280, h: 0.488 }, // right, bottom
];

/** The five panel rectangles, in pixels, for a canvas of the given size. */
export function panelRects(canvasWidth, canvasHeight) {
  const layout = canvasWidth > canvasHeight ? LANDSCAPE_PANELS : PORTRAIT_PANELS;
  return layout.map((p) => ({
    x: p.x * canvasWidth,
    y: p.y * canvasHeight,
    w: p.w * canvasWidth,
    h: p.h * canvasHeight,
  }));
}

/** The index of the panel under a point in canvas coordinates, or -1 when the point is on a seam. */
export function panelIndexAt(rects, px, py) {
  return rects.findIndex((r) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h);
}
