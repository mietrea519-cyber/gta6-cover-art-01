// Photo loading and per-panel framing.
//
// A panel's photo is kept as a plain record:
//   { image, name, zoom, panX, panY }
// zoom is 1 or more (1 means the plain cover-fit), and panX / panY range
// from -0.5 to 0.5, where 0 centres the overflow and the extremes push the
// photo fully to one side. Keeping the framing as fractions means the same
// record works unchanged at preview size and at export size, because the
// preview canvas IS the export canvas in this app.
//
// Photos are only ever read on this machine: files come in through an
// object URL created in the browser, and the bundled samples are plain
// files that sit next to the app. Nothing is uploaded anywhere.

export const SAMPLE_PHOTOS = [
  { id: 'neon-driver', label: 'Neon Driver', src: 'samples/neon-driver.jpg' },
  { id: 'sunset-pier', label: 'Sunset Pier', src: 'samples/sunset-pier.jpg' },
];

export function freshFraming(image, name) {
  return { image, name, zoom: 1, panX: 0, panY: 0 };
}

export function emptyPanel() {
  return { photo: null };
}

export function loadImageFromSource(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`could not load image ${src}`));
    image.src = src;
  });
}

export async function loadSamplePhoto(sampleId) {
  const sample = SAMPLE_PHOTOS.find((entry) => entry.id === sampleId) ?? SAMPLE_PHOTOS[0];
  const image = await loadImageFromSource(sample.src);
  return freshFraming(image, sample.label);
}

export async function loadPhotoFromFile(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageFromSource(objectUrl);
    return freshFraming(image, file.name);
  } finally {
    // The decoded image keeps its pixels after the URL is revoked.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
  }
}

// The rectangle a framed photo occupies inside a panel, in canvas pixels.
// Cover-fit first (fill the panel, crop the overflow), then the zoom, then
// the pan across whatever overflow remains.
export function framedPhotoRect(photo, panel) {
  const image = photo.image;
  const coverScale = Math.max(panel.w / image.naturalWidth, panel.h / image.naturalHeight);
  const scale = coverScale * photo.zoom;
  const drawnW = image.naturalWidth * scale;
  const drawnH = image.naturalHeight * scale;
  const spareX = panel.w - drawnW;
  const spareY = panel.h - drawnH;
  return {
    x: panel.x + spareX * (0.5 + photo.panX),
    y: panel.y + spareY * (0.5 + photo.panY),
    w: drawnW,
    h: drawnH,
    spareX,
    spareY,
  };
}

export function clampFraming(photo) {
  photo.zoom = Math.min(4, Math.max(1, photo.zoom));
  photo.panX = Math.min(0.5, Math.max(-0.5, photo.panX));
  photo.panY = Math.min(0.5, Math.max(-0.5, photo.panY));
}
