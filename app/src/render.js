// Painting the cover: panels, photographs, grade, lettering.
//
// renderCover is the single painter every part of the app uses. It draws,
// in order: the black poster ground, each panel (its photograph under the
// grade's filter, or the placeholder scene when the panel is empty), the
// grade's wash and glows, a vignette, runtime-generated grain, bright
// panel dividers, the selection outline in editor mode, and finally the
// caption lettering in the bundled Anton face with a heavy black outline
// and an accent-coloured offset shadow.
//
// The placeholder scene is drawn from scratch here — a graded sky, a low
// sun, a band of sea, a beach strip and two palm silhouettes built from
// curved trunks and arcing fronds. No picture file is involved.

import { gradeById, grainCanvas } from './grades.js';
import { framedPhotoRect } from './photos.js';
import { computePanels } from './panels.js';

function paintPlaceholder(ctx, panel, grade, variant) {
  const sky = ctx.createLinearGradient(panel.x, panel.y, panel.x, panel.y + panel.h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(1, grade.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);

  const horizon = panel.y + panel.h * 0.68;
  const sunX = panel.x + panel.w * (variant % 2 === 0 ? 0.68 : 0.34);
  const sunY = panel.y + panel.h * 0.46;
  const sunR = Math.min(panel.w, panel.h) * 0.16;

  ctx.fillStyle = 'rgba(255, 244, 196, 0.95)';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Sun stripes: the retro banded sun, cut by a few sky-coloured bars.
  ctx.fillStyle = grade.sky[1];
  for (let i = 0; i < 3; i += 1) {
    const barY = sunY + sunR * (0.08 + i * 0.3);
    ctx.fillRect(sunX - sunR, barY, sunR * 2, sunR * 0.1);
  }

  ctx.fillStyle = 'rgba(23, 96, 120, 0.85)';
  ctx.fillRect(panel.x, horizon, panel.w, panel.h * 0.2);
  ctx.fillStyle = 'rgba(247, 205, 140, 0.95)';
  ctx.fillRect(panel.x, panel.y + panel.h * 0.88, panel.w, panel.h * 0.12);

  paintPalm(ctx, panel.x + panel.w * 0.18, panel.y + panel.h, panel.h * 0.52);
  paintPalm(ctx, panel.x + panel.w * 0.88, panel.y + panel.h, panel.h * 0.38);
}

function paintPalm(ctx, baseX, baseY, height) {
  const topX = baseX + height * 0.14;
  const topY = baseY - height;
  ctx.strokeStyle = 'rgba(24, 26, 32, 0.92)';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(3, height * 0.045);
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + height * 0.02, baseY - height * 0.55, topX, topY);
  ctx.stroke();

  ctx.lineWidth = Math.max(2, height * 0.03);
  const fronds = 7;
  for (let i = 0; i < fronds; i += 1) {
    const angle = Math.PI * (0.08 + (i / (fronds - 1)) * 0.84);
    const reach = height * 0.42;
    const endX = topX - Math.cos(angle) * reach;
    const endY = topY - Math.sin(angle) * reach * 0.55 + reach * 0.18;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX - Math.cos(angle) * reach * 0.55,
      topY - Math.sin(angle) * reach * 0.6,
      endX,
      endY,
    );
    ctx.stroke();
  }
}

function paintPanelPhoto(ctx, state, panelState, panel, grade, index) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(panel.x, panel.y, panel.w, panel.h);
  ctx.clip();
  if (panelState.photo) {
    const rect = framedPhotoRect(panelState.photo, panel);
    ctx.filter = grade.filter;
    ctx.drawImage(panelState.photo.image, rect.x, rect.y, rect.w, rect.h);
    ctx.filter = 'none';
  } else {
    paintPlaceholder(ctx, panel, grade, index);
  }
  ctx.fillStyle = grade.wash;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.restore();
}

function paintAtmosphere(ctx, width, height, grade) {
  const glow = ctx.createLinearGradient(0, 0, 0, height);
  glow.addColorStop(0, grade.glowTop);
  glow.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  glow.addColorStop(1, grade.glowBottom);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const centreX = width / 2;
  const centreY = height / 2;
  const radius = Math.max(width, height) * 0.78;
  const vignette = ctx.createRadialGradient(centreX, centreY, radius * 0.45, centreX, centreY, radius);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(5, 4, 12, 0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = grade.grainAlpha;
  const tile = grainCanvas();
  const pattern = ctx.createPattern(tile, 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

function fitFontSize(ctx, text, weight, maxWidth, startSize) {
  let size = startSize;
  while (size > 12) {
    ctx.font = `${weight} ${size}px Anton, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  }
  return size;
}

function strokeAndFill(ctx, draw) {
  ctx.lineJoin = 'round';
  draw();
}

function paintCaption(ctx, state, width, height, grade) {
  const title = (state.title || '').trim();
  const tagline = (state.tagline || '').trim();
  if (!title && !tagline) return;

  const nearBottom = state.captionPlacement !== 'top';
  const margin = width * 0.055;
  const maxWidth = width - margin * 2;
  const titleSize = fitFontSize(ctx, title.toUpperCase(), 400, maxWidth, Math.round(height * 0.135));
  const tagSize = Math.max(16, Math.round(titleSize * 0.34));
  const blockH = titleSize + (tagline ? tagSize + titleSize * 0.22 : 0);
  const baseY = nearBottom ? height - height * 0.045 : height * 0.045 + blockH;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (title) {
    ctx.font = `400 ${titleSize}px Anton, sans-serif`;
    const titleY = baseY - (tagline ? tagSize + titleSize * 0.22 : 0);
    if (state.captionArc) {
      paintArcedTitle(ctx, title.toUpperCase(), width / 2, titleY, titleSize, grade);
    } else {
      paintOneLine(ctx, title.toUpperCase(), width / 2, titleY, grade, titleSize * 0.09);
    }
  }
  if (tagline) {
    ctx.font = `400 ${tagSize}px Anton, sans-serif`;
    paintOneLine(ctx, tagline.toUpperCase(), width / 2, baseY, grade, tagSize * 0.1);
  }
}

function paintOneLine(ctx, text, x, y, grade, shadowDrop) {
  strokeAndFill(ctx, () => {
    ctx.strokeStyle = '#0b0b10';
    ctx.lineWidth = Math.max(3, shadowDrop * 1.5);
    ctx.fillStyle = grade.shadow;
    ctx.fillText(text, x + shadowDrop, y + shadowDrop);
    ctx.strokeText(text, x, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y);
  });
}

function paintArcedTitle(ctx, text, centreX, baseY, size, grade) {
  // Letters ride a shallow arc: each glyph is rotated a little around a
  // centre far below the baseline, so the middle sits highest.
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((sum, w) => sum + w, 0);
  const radius = Math.max(total * 1.15, size * 6);
  let cursor = -total / 2;
  [...text].forEach((ch, i) => {
    const glyphCentre = cursor + widths[i] / 2;
    const angle = glyphCentre / radius;
    ctx.save();
    ctx.translate(centreX + Math.sin(angle) * radius, baseY - (1 - Math.cos(angle)) * radius);
    ctx.rotate(angle);
    ctx.strokeStyle = '#0b0b10';
    ctx.lineWidth = Math.max(3, size * 0.12);
    ctx.lineJoin = 'round';
    ctx.fillStyle = grade.shadow;
    ctx.fillText(ch, size * 0.02, size * 0.03);
    ctx.strokeText(ch, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    cursor += widths[i];
  });
}

export function renderCover(canvas, state, options = {}) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const grade = gradeById(state.grade);
  const panels = computePanels(width, height);

  ctx.fillStyle = '#0b0b10';
  ctx.fillRect(0, 0, width, height);

  panels.forEach((panel, index) => {
    paintPanelPhoto(ctx, state, state.panels[index], panel, grade, index);
  });

  paintAtmosphere(ctx, width, height, grade);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = Math.max(2, Math.min(width, height) * 0.004);
  panels.forEach((panel) => {
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
  });

  if (options.showSelection && state.selected >= 0) {
    const chosen = panels[state.selected];
    ctx.strokeStyle = grade.accent;
    ctx.lineWidth = Math.max(3, Math.min(width, height) * 0.008);
    ctx.strokeRect(chosen.x, chosen.y, chosen.w, chosen.h);
  }

  paintCaption(ctx, state, width, height, grade);
  return panels;
}
