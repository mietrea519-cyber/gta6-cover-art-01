// The colour grades. Each preset pairs a canvas filter (applied to every panel photo as it is
// drawn) with a set of gradient overlays and a vignette painted over the whole collage, plus the
// accent colour the caption's drop shadow uses. Three looks: a Vice City sunset, a neon night,
// and the warm classic poster.

export const GRADE_PRESETS = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.38) contrast(1.08) brightness(1.06) sepia(0.22) hue-rotate(-10deg)',
    topGlow: 'rgba(255, 94, 120, 0.20)',
    horizonGlow: 'rgba(255, 138, 61, 0.30)',
    bottomShade: 'rgba(46, 10, 74, 0.34)',
    vignette: 0.30,
    accent: '#ffcf5c',
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.55) contrast(1.22) brightness(0.95) hue-rotate(8deg)',
    topGlow: 'rgba(0, 229, 255, 0.17)',
    horizonGlow: 'rgba(255, 0, 128, 0.26)',
    bottomShade: 'rgba(4, 0, 32, 0.42)',
    vignette: 0.44,
    accent: '#4de8ff',
  },
  classic: {
    label: 'Classic Poster',
    filter: 'saturate(1.12) contrast(1.16) brightness(1.03) sepia(0.14)',
    topGlow: 'rgba(255, 190, 90, 0.10)',
    horizonGlow: 'rgba(255, 160, 60, 0.16)',
    bottomShade: 'rgba(70, 22, 4, 0.30)',
    vignette: 0.36,
    accent: '#ffffff',
  },
};

let grainPattern = null;

/** Builds (once) a small tile of film grain, drawn at runtime so no asset file is needed. */
function getGrainPattern(ctx) {
  if (grainPattern) return grainPattern;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tileCtx = tile.getContext('2d');
  const image = tileCtx.createImageData(128, 128);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 118 + Math.floor(Math.random() * 60);
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  tileCtx.putImageData(image, 0, 0);
  grainPattern = ctx.createPattern(tile, 'repeat');
  return grainPattern;
}

/** Paints a grade's overlays over the finished collage: glows, a bottom shade, grain, vignette. */
export function paintGradeOverlay(ctx, width, height, grade) {
  const glow = ctx.createLinearGradient(0, 0, 0, height);
  glow.addColorStop(0, grade.topGlow);
  glow.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
  glow.addColorStop(0.78, grade.horizonGlow);
  glow.addColorStop(1, grade.bottomShade);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = getGrainPattern(ctx);
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.78,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, `rgba(0, 0, 0, ${grade.vignette})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}
