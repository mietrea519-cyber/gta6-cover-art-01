// Draws the whole cover onto a canvas context at the canvas's full resolution: the five photo
// panels with the chosen grade, the poster's thin panel seams, and the caption lettering. The
// editor preview and the exported PNG are this same drawing, so what you see is what you share.

import { GRADE_PRESETS, paintGradeOverlay } from './grades.js';
import { panelRects } from './panels.js';
import { coverFit, clampOffsets } from './photos.js';

const DISPLAY_FONT = '"Anton", "Arial Black", sans-serif';

/** A fresh panel: no photo yet, centred, at the base cover-fit zoom. */
export function createPanelState() {
  return { photo: null, zoom: 1, offsetX: 0, offsetY: 0 };
}

/** Draws the cover described by `state` ({panels, grade, caption, tagline, captionPlace, arcTitle, selectedIndex}). */
export function drawCover(ctx, width, height, state, options = {}) {
  const grade = GRADE_PRESETS[state.grade] ?? GRADE_PRESETS.sunset;
  const rects = panelRects(width, height);
  ctx.fillStyle = '#171021';
  ctx.fillRect(0, 0, width, height);
  rects.forEach((rect, index) => {
    drawPanel(ctx, rect, state.panels[index], index, grade.filter);
  });
  paintGradeOverlay(ctx, width, height, grade);
  drawPanelSeams(ctx, rects, width);
  if (options.showSelection) drawSelectionOutline(ctx, rects[state.selectedIndex], width);
  drawCaptionBlock(ctx, width, height, state, grade);
}

/** Draws one panel: its photo (graded, cover-fitted, slid by the panel's offsets) or a placeholder scene. */
function drawPanel(ctx, rect, panel, index, filter) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (panel && panel.photo) {
    const fit = coverFit(panel.photo.naturalWidth, panel.photo.naturalHeight, rect.w, rect.h);
    const drawnWidth = fit.width * panel.zoom;
    const drawnHeight = fit.height * panel.zoom;
    clampOffsets(panel, drawnWidth, drawnHeight, rect.w, rect.h);
    const dx = rect.x + (rect.w - drawnWidth) / 2 + panel.offsetX * rect.w;
    const dy = rect.y + (rect.h - drawnHeight) / 2 + panel.offsetY * rect.h;
    ctx.filter = filter;
    ctx.drawImage(panel.photo, dx, dy, drawnWidth, drawnHeight);
    ctx.filter = 'none';
  } else {
    drawPlaceholderScene(ctx, rect, index);
  }
  ctx.restore();
}

/** An empty panel's stand-in scene: a little sunset with palms, drawn, never a borrowed image. */
function drawPlaceholderScene(ctx, rect, index) {
  const skies = [
    ['#2b1055', '#7597de', '#ff7e5f'],
    ['#0f2027', '#2c5364', '#f9a826'],
    ['#3a1c71', '#d76d77', '#ffaf7b'],
    ['#141e30', '#cb3066', '#ffb75e'],
    ['#1a2a6c', '#b21f1f', '#fdbb2d'],
  ];
  const [top, mid, low] = skies[index % skies.length];
  const sky = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  sky.addColorStop(0, top);
  sky.addColorStop(0.55, mid);
  sky.addColorStop(1, low);
  ctx.fillStyle = sky;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  const sunX = rect.x + rect.w * (0.32 + 0.14 * (index % 3));
  const sunY = rect.y + rect.h * 0.58;
  const sunR = Math.min(rect.w, rect.h) * 0.16;
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 3.2);
  glow.addColorStop(0, 'rgba(255, 220, 130, 0.85)');
  glow.addColorStop(0.35, 'rgba(255, 160, 80, 0.35)');
  glow.addColorStop(1, 'rgba(255, 160, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = '#ffd97a';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(10, 8, 26, 0.55)';
  ctx.fillRect(rect.x, rect.y + rect.h * 0.8, rect.w, rect.h * 0.2);
  drawPalmSilhouette(ctx, rect.x + rect.w * 0.16, rect.y + rect.h, rect.h * 0.52, 1);
  drawPalmSilhouette(ctx, rect.x + rect.w * 0.88, rect.y + rect.h, rect.h * 0.4, -1);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.font = `400 ${Math.max(13, rect.h * 0.055)}px ${DISPLAY_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h * 0.14);
}

/** A palm in silhouette: a curved trunk and six fronds, leaning with `lean` (-1 or 1). */
function drawPalmSilhouette(ctx, baseX, baseY, size, lean) {
  const crownX = baseX + lean * size * 0.22;
  const crownY = baseY - size;
  ctx.strokeStyle = 'rgba(12, 5, 20, 0.95)';
  ctx.lineCap = 'round';
  ctx.lineWidth = size * 0.055;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + lean * size * 0.05, baseY - size * 0.6, crownX, crownY);
  ctx.stroke();
  ctx.lineWidth = size * 0.028;
  for (let i = 0; i < 6; i++) {
    // Fronds fan from straight up-right (spread 0) over the crown to straight up-left (spread PI),
    // bowed upward at the root and drooping at the tip.
    const spread = Math.PI * (i / 5);
    const reach = size * (0.4 + 0.08 * ((i * 7) % 3));
    const endX = crownX + Math.cos(spread) * reach;
    const endY = crownY - Math.sin(spread) * reach * 0.38 + reach * 0.3;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(
      crownX + Math.cos(spread) * reach * 0.55,
      crownY - Math.sin(spread) * reach * 0.62,
      endX, endY,
    );
    ctx.stroke();
  }
}

/** The poster's thin off-white seams between panels, and its outer frame line. */
function drawPanelSeams(ctx, rects, width) {
  ctx.strokeStyle = 'rgba(248, 244, 232, 0.95)';
  ctx.lineWidth = Math.max(3, width * 0.0032);
  for (const rect of rects) ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

/** A gold outline on the panel being framed, editor only — never on an export. */
function drawSelectionOutline(ctx, rect, width) {
  if (!rect) return;
  ctx.save();
  ctx.strokeStyle = '#ffcf5c';
  ctx.lineWidth = Math.max(4, width * 0.005);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = width * 0.01;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** The caption: a scrim for legibility, the tagline small and letterspaced, the title huge. */
function drawCaptionBlock(ctx, width, height, state, grade) {
  const title = (state.caption ?? '').trim().toUpperCase();
  const tagline = (state.tagline ?? '').trim().toUpperCase();
  if (!title && !tagline) return;
  const atTop = state.captionPlace === 'top';
  const band = height * 0.34;
  const scrim = atTop
    ? ctx.createLinearGradient(0, 0, 0, band)
    : ctx.createLinearGradient(0, height, 0, height - band);
  scrim.addColorStop(0, 'rgba(8, 3, 18, 0.62)');
  scrim.addColorStop(1, 'rgba(8, 3, 18, 0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, atTop ? 0 : height - band, width, band);

  const centreX = width / 2;
  if (atTop) {
    if (tagline) drawTagline(ctx, tagline, centreX, height * 0.055, width);
    if (title) drawTitleText(ctx, title, centreX, height * 0.075, width, height, grade.accent, state.arcTitle);
  } else {
    if (title) drawTitleText(ctx, title, centreX, height * 0.795, width, height, grade.accent, state.arcTitle);
    if (tagline) drawTagline(ctx, tagline, centreX, height * 0.955, width);
  }
}

/** The tagline: small, white, letterspaced capitals with a soft shadow. */
function drawTagline(ctx, text, centreX, baselineY, width) {
  let size = width * 0.026;
  ctx.textAlign = 'center';
  ctx.letterSpacing = `${size * 0.42}px`;
  ctx.font = `400 ${size}px ${DISPLAY_FONT}`;
  while (ctx.measureText(text).width > width * 0.9 && size > 10) {
    size -= 1;
    ctx.font = `400 ${size}px ${DISPLAY_FONT}`;
    ctx.letterSpacing = `${size * 0.42}px`;
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = size * 0.35;
  ctx.fillText(text, centreX, baselineY);
  ctx.shadowBlur = 0;
  ctx.letterSpacing = '0px';
}

/**
 * The title in poster lettering: an accent-coloured offset copy, a thick black outline and a
 * white fill, straight or bent along a shallow arc. `topY` is the top of the lettering band.
 */
function drawTitleText(ctx, text, centreX, topY, width, height, accent, arc) {
  let size = Math.min(height * 0.145, width * 0.16);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const setFont = () => { ctx.font = `400 ${size}px ${DISPLAY_FONT}`; };
  setFont();
  ctx.letterSpacing = `${size * 0.03}px`;
  while (ctx.measureText(text).width > width * 0.92 && size > 14) {
    size *= 0.94;
    setFont();
  }
  const baselineY = topY + size;
  const paint = (draw) => {
    ctx.save();
    ctx.lineJoin = 'round';
    draw();
    ctx.restore();
  };
  const drawAll = (offsetX, offsetY, mode) => {
    ctx.save();
    ctx.translate(offsetX, offsetY);
    if (mode === 'shadow') {
      ctx.fillStyle = accent;
      paintLetters(ctx, text, centreX, baselineY, size, arc, width, 'fill');
    } else {
      ctx.strokeStyle = '#0a0512';
      ctx.lineWidth = size * 0.17;
      paintLetters(ctx, text, centreX, baselineY, size, arc, width, 'stroke');
      ctx.fillStyle = '#ffffff';
      paintLetters(ctx, text, centreX, baselineY, size, arc, width, 'fill');
    }
    ctx.restore();
  };
  drawAll(size * 0.05, size * 0.06, 'shadow');
  drawAll(0, 0, 'main');
  ctx.letterSpacing = '0px';
}

/** Paints the title once, either straight on its baseline or letter by letter along an arc. */
function paintLetters(ctx, text, centreX, baselineY, size, arc, width, mode) {
  const paintOne = (ch, x, y, angle) => {
    ctx.save();
    ctx.translate(x, y);
    if (angle) ctx.rotate(angle);
    if (mode === 'stroke') ctx.strokeText(ch, 0, 0);
    else ctx.fillText(ch, 0, 0);
    ctx.restore();
  };
  if (!arc) {
    if (mode === 'stroke') ctx.strokeText(text, centreX, baselineY);
    else ctx.fillText(text, centreX, baselineY);
    return;
  }
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + size * 0.03 * (chars.length - 1);
  const radius = width * 1.5;
  let walked = -total / 2;
  chars.forEach((ch, i) => {
    const centre = walked + widths[i] / 2;
    const angle = centre / radius;
    paintOne(ch, centreX + Math.sin(angle) * radius, baselineY + (1 - Math.cos(angle)) * radius - size * 0.1, angle);
    walked += widths[i] + size * 0.03;
  });
}
