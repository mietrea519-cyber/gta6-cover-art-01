// Vice Coast Cover Studio: wires the page together. A visitor adds photos, drops them into the
// five panels, frames each one, picks a grade and a size, and exports a PNG — all locally.

import { drawCover, createPanelState } from './render.js';
import { panelRects, panelIndexAt } from './panels.js';
import { loadImageFromFile, loadSamplePhoto } from './photos.js';
import { readShotConfig, signalShotReady } from './shots.js';

const POST_SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const canvas = document.getElementById('cover-canvas');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status-line');
const tray = document.getElementById('photo-tray');
const selectedLabel = document.getElementById('selected-panel-label');
const zoomSlider = document.getElementById('panel-zoom');
const xSlider = document.getElementById('panel-x');
const ySlider = document.getElementById('panel-y');

const state = {
  panels: Array.from({ length: 5 }, createPanelState),
  grade: 'sunset',
  caption: 'Neon Coast',
  tagline: 'One city, no rules',
  captionPlace: 'bottom',
  arcTitle: false,
  selectedIndex: 0,
};

const photos = []; // { name, img } — every photo the visitor has added, samples included
let currentRects = panelRects(canvas.width, canvas.height);
let shotMode = false;

function setStatus(message) {
  statusLine.textContent = message;
}

/** Repaints the cover (with the editor's selection outline, except in a screenshot scene). */
function redraw() {
  currentRects = panelRects(canvas.width, canvas.height);
  drawCover(ctx, canvas.width, canvas.height, state, { showSelection: !shotMode });
}

/** Marks one panel as the one being framed and syncs the framing controls to it. */
function selectPanel(index) {
  state.selectedIndex = index;
  const panel = state.panels[index];
  selectedLabel.textContent = `Panel ${index + 1} selected — drag it on the cover, scroll to zoom.`;
  zoomSlider.value = panel.zoom;
  xSlider.value = Math.round(panel.offsetX * 100);
  ySlider.value = Math.round(panel.offsetY * 100);
}

/** Puts a photo into a panel, keeping the panel's framing. */
function assignPhotoToPanel(panelIndex, photo) {
  state.panels[panelIndex].photo = photo.img;
  redraw();
}

/** Adds a loaded image to the tray and returns its photo record. */
function registerPhoto(name, img) {
  const photo = { name, img };
  photos.push(photo);
  const button = document.createElement('button');
  button.type = 'button';
  button.title = name;
  const thumb = document.createElement('img');
  thumb.src = img.src;
  thumb.alt = name;
  button.appendChild(thumb);
  button.addEventListener('click', () => {
    assignPhotoToPanel(state.selectedIndex, photo);
    setStatus(`Panel ${state.selectedIndex + 1} now shows ${name}.`);
  });
  tray.appendChild(button);
  return photo;
}

/** Loads a bundled sample into the tray (once) and returns its photo record. */
async function ensureSamplePhoto(stem) {
  const found = photos.find((p) => p.name === stem);
  if (found) return found;
  return registerPhoto(stem, await loadSamplePhoto(stem));
}

/**
 * The opening scene: the two samples woven through the panels at varied zooms, so the studio
 * opens on a finished-looking cover the visitor can pull apart.
 */
function applyOpeningScene(hero, second) {
  const plan = [
    { photo: hero, zoom: 1.0, offsetX: 0, offsetY: 0 },
    { photo: second, zoom: 1.3, offsetX: 0, offsetY: -0.2 },
    { photo: hero, zoom: 1.45, offsetX: 0.1, offsetY: 0.25 },
    { photo: second, zoom: 1.05, offsetX: 0, offsetY: 0.1 },
    { photo: hero, zoom: 1.2, offsetX: -0.15, offsetY: -0.3 },
  ];
  plan.forEach((step, index) => Object.assign(state.panels[index], step));
  redraw();
}

/** Adds every image file from a pick or a drop, filling empty panels in order. */
async function addPhotoFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  for (const file of images) {
    const photo = registerPhoto(file.name, await loadImageFromFile(file));
    const empty = state.panels.findIndex((p) => !p.photo);
    assignPhotoToPanel(empty >= 0 ? empty : state.selectedIndex, photo);
  }
  if (images.length) setStatus(`${images.length} photo${images.length > 1 ? 's' : ''} added. Click a panel, then drag to frame it.`);
}

/** Switches the canvas to one of the post sizes and repaints. */
function setPostSize(key) {
  const [w, h] = POST_SIZES[key] ?? POST_SIZES['1080x1080'];
  canvas.width = w;
  canvas.height = h;
  canvas.style.setProperty('--ar', String(w / h));
  document.querySelectorAll('.size-chip').forEach((chip) => {
    chip.setAttribute('aria-pressed', String(chip.dataset.size === key));
  });
  redraw();
}

/** Switches the colour grade and repaints. */
function setGrade(key) {
  state.grade = key;
  document.querySelectorAll('.grade-chip').forEach((chip) => {
    chip.setAttribute('aria-pressed', String(chip.dataset.grade === key));
  });
  redraw();
}

// --- Step 1: photos ---------------------------------------------------------

const photoInput = document.getElementById('photo-input');
document.getElementById('add-photos').addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', () => addPhotoFiles(photoInput.files));
document.getElementById('sample-driver').addEventListener('click', async () => {
  assignPhotoToPanel(state.selectedIndex, await ensureSamplePhoto('neon-driver'));
});
document.getElementById('sample-pier').addEventListener('click', async () => {
  assignPhotoToPanel(state.selectedIndex, await ensureSamplePhoto('sunset-pier'));
});
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  document.body.classList.add('dragging');
});
window.addEventListener('dragleave', (e) => {
  if (!e.relatedTarget) document.body.classList.remove('dragging');
});
window.addEventListener('drop', (e) => {
  e.preventDefault();
  document.body.classList.remove('dragging');
  addPhotoFiles(e.dataTransfer.files);
});

// --- Step 2: framing --------------------------------------------------------

function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return [
    (event.clientX - box.left) * (canvas.width / box.width),
    (event.clientY - box.top) * (canvas.height / box.height),
  ];
}

let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  const [x, y] = canvasPoint(event);
  const index = panelIndexAt(currentRects, x, y);
  if (index < 0) return;
  selectPanel(index);
  const panel = state.panels[index];
  drag = { index, startX: x, startY: y, offsetX: panel.offsetX, offsetY: panel.offsetY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const [x, y] = canvasPoint(event);
  const rect = currentRects[drag.index];
  const panel = state.panels[drag.index];
  panel.offsetX = drag.offsetX + (x - drag.startX) / rect.w;
  panel.offsetY = drag.offsetY + (y - drag.startY) / rect.h;
  xSlider.value = Math.round(panel.offsetX * 100);
  ySlider.value = Math.round(panel.offsetY * 100);
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const [x, y] = canvasPoint(event);
  const index = panelIndexAt(currentRects, x, y);
  if (index < 0) return;
  selectPanel(index);
  const panel = state.panels[index];
  panel.zoom = Math.min(4, Math.max(1, panel.zoom * (event.deltaY < 0 ? 1.07 : 0.93)));
  zoomSlider.value = panel.zoom;
  redraw();
}, { passive: false });

zoomSlider.addEventListener('input', () => {
  state.panels[state.selectedIndex].zoom = Number(zoomSlider.value);
  redraw();
});
xSlider.addEventListener('input', () => {
  state.panels[state.selectedIndex].offsetX = Number(xSlider.value) / 100;
  redraw();
});
ySlider.addEventListener('input', () => {
  state.panels[state.selectedIndex].offsetY = Number(ySlider.value) / 100;
  redraw();
});
document.getElementById('reset-framing').addEventListener('click', () => {
  Object.assign(state.panels[state.selectedIndex], { zoom: 1, offsetX: 0, offsetY: 0 });
  selectPanel(state.selectedIndex);
  redraw();
});
document.getElementById('fill-all').addEventListener('click', () => {
  const { photo } = state.panels[state.selectedIndex];
  if (!photo) {
    setStatus('The selected panel has no photo yet — add one first.');
    return;
  }
  state.panels.forEach((panel) => { panel.photo = photo; });
  redraw();
  setStatus('Every panel now shows the same photo, each framed its own way.');
});

// --- Steps 3 to 5: caption, grade, size, export ------------------------------

document.getElementById('caption-input').addEventListener('input', (e) => {
  state.caption = e.target.value;
  redraw();
});
document.getElementById('tagline-input').addEventListener('input', (e) => {
  state.tagline = e.target.value;
  redraw();
});
document.getElementById('caption-place').addEventListener('change', (e) => {
  state.captionPlace = e.target.value;
  redraw();
});
document.getElementById('caption-arc').addEventListener('change', (e) => {
  state.arcTitle = e.target.checked;
  redraw();
});
document.querySelectorAll('.grade-chip').forEach((chip) => {
  chip.addEventListener('click', () => setGrade(chip.dataset.grade));
});
document.querySelectorAll('.size-chip').forEach((chip) => {
  chip.addEventListener('click', () => setPostSize(chip.dataset.size));
});
document.getElementById('export-png').addEventListener('click', () => {
  drawCover(ctx, canvas.width, canvas.height, state, { showSelection: false });
  canvas.toBlob((blob) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vice-coast-cover-${canvas.width}x${canvas.height}.png`;
    link.click();
    setStatus(`Saved ${link.download} — post it anywhere.`);
    redraw();
  }, 'image/png');
});

// --- Opening -----------------------------------------------------------------

async function init() {
  const shot = readShotConfig();
  shotMode = Boolean(shot);
  if (shot) {
    document.getElementById('caption-input').value = shot.caption;
    document.getElementById('tagline-input').value = shot.tagline;
    state.caption = shot.caption;
    state.tagline = shot.tagline;
    if (shot.mode === 'cover') document.body.classList.add('shot-cover');
  }
  const hero = await ensureSamplePhoto(shot ? shot.photo : 'neon-driver');
  const second = await ensureSamplePhoto(shot ? shot.photo2 : 'sunset-pier');
  applyOpeningScene(hero.img, second.img);
  setGrade(shot ? shot.grade : 'sunset');
  setPostSize(shot ? shot.size : '1080x1080');
  selectPanel(0);
  await document.fonts.load('80px Anton');
  await document.fonts.ready;
  redraw();
  if (shot) signalShotReady();
}

init();
