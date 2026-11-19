// Photo loading and cover-fit maths. Photos are read from the person's own machine and are never
// uploaded anywhere: file picks and drops become object URLs, samples load from this app's files.

/** Loads an image from a URL (an object URL or a path inside the app), resolving once it can be drawn. */
export function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Loads one picked or dropped file into an image, through an object URL that stays valid for the session. */
export function loadImageFromFile(file) {
  return loadImageFromUrl(URL.createObjectURL(file));
}

/** Loads one of the bundled sample photos by its file stem, for example "neon-driver". */
export function loadSamplePhoto(stem) {
  return loadImageFromUrl(`samples/${stem}.jpg`);
}

/**
 * The base cover fit: the scale at which an image exactly covers a rectangle, and the drawn size
 * at that scale. A panel's own zoom multiplies this scale.
 */
export function coverFit(imageWidth, imageHeight, rectWidth, rectHeight) {
  const scale = Math.max(rectWidth / imageWidth, rectHeight / imageHeight);
  return { scale, width: imageWidth * scale, height: imageHeight * scale };
}

/**
 * Clamps a panel's offsets (fractions of the panel's size) so the drawn image always covers the
 * whole panel: it may slide at most half the overflow on each axis.
 */
export function clampOffsets(panel, drawnWidth, drawnHeight, rectWidth, rectHeight) {
  const maxX = Math.max(0, (drawnWidth - rectWidth) / 2) / rectWidth;
  const maxY = Math.max(0, (drawnHeight - rectHeight) / 2) / rectHeight;
  panel.offsetX = Math.min(maxX, Math.max(-maxX, panel.offsetX));
  panel.offsetY = Math.min(maxY, Math.max(-maxY, panel.offsetY));
}
