// Vice Coast Cover Studio — the editor itself.
//
// This module owns the page: it builds the studio's state (five panels,
// one grade, one caption, one export size), wires every control in the
// sidebar to that state, handles pointing at the canvas (click to select
// a panel, drag to reposition its photo, wheel to zoom), and repaints
// through renderCover whenever anything changes. The canvas on the page
// is the export canvas, so what you see is exactly the PNG you get.

import { GRADES, GRADE_IDS } from './grades.js';
import { PANEL_COUNT, panelIndexAt, computePanels } from './panels.js';
import { SAMPLE_PHOTOS, clampFraming, emptyPanel, framedPhotoRect, loadPhotoFromFile, loadSamplePhoto } from './photos.js';
import { renderCover } from './render.js';
import { readShotRequest, applyShotScene } from './shots.js';

const POST_SIZES = [
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
];

const elements = {
  canvas: document.querySelector('#stage'),
  fileInput: document.querySelector('#photo-files'),
  dropZone: document.querySelector('#drop-zone'),
  sampleRow: document.querySelector('#sample-row'),
  fillAll: document.querySelector('#fill-all'),
  panelChips: document.querySelector('#panel-chips'),
  zoom: document.querySelector('#zoom'),
  panX: document.querySelector('#pan-x'),
  panY: document.querySelector('#pan-y'),
  resetFraming: document.querySelector('#reset-framing'),
  title: document.querySelector('#caption-title'),
  tagline: document.querySelector('#caption-tagline'),
  placement: document.querySelector('#caption-placement'),
  arc: document.querySelector('#caption-arc'),
  gradeRow: document.querySelector('#grade-row'),
  sizeRow: document.querySelector('#size-row'),
  exportButton: document.querySelector('#export-png'),
  status: document.querySelector('#status'),
};

const state = {
  size: { w: 1080, h: 1080 },
  grade: 'sunset',
  title: 'Vice Coast',
  tagline: 'One city, no rules',
  captionPlacement: 'bottom',
  captionArc: false,
  selected: 0,
  panels: Array.from({ length: PANEL_COUNT }, () => emptyPanel()),
};

let lastPanels = computePanels(state.size.w, state.size.h);

function setStatus(message) {
  elements.status.textContent = message;
}

function repaint() {
  lastPanels = renderCover(elements.canvas, state, {
    showSelection: !document.body.classList.contains('shot-cover'),
  });
  syncFramingControls();
  syncPanelChips();
}

function selectedPhoto() {
  return state.panels[state.selected]?.photo ?? null;
}

function syncFramingControls() {
  const photo = selectedPhoto();
  const enabled = Boolean(photo);
  for (const control of [elements.zoom, elements.panX, elements.panY, elements.resetFraming]) {
    control.disabled = !enabled;
  }
  if (photo) {
    elements.zoom.value = String(photo.zoom);
    elements.panX.value = String(photo.panX);
    elements.panY.value = String(photo.panY);
  }
}

function syncPanelChips() {
  [...elements.panelChips.children].forEach((chip, index) => {
    chip.classList.toggle('is-selected', index === state.selected);
    chip.classList.toggle('has-photo', Boolean(state.panels[index].photo));
  });
}

function selectPanel(index) {
  if (index < 0 || index >= PANEL_COUNT) return;
  state.selected = index;
  repaint();
}

function placePhotoInPanel(index, photo) {
  state.panels[index] = { photo };
}

function setSize(w, h, options = {}) {
  state.size = { w, h };
  elements.canvas.width = w;
  elements.canvas.height = h;
  [...elements.sizeRow.children].forEach((chip) => {
    chip.classList.toggle('is-selected', Number(chip.dataset.w) === w && Number(chip.dataset.h) === h);
  });
  if (!options.silent) repaint();
}

function setGrade(gradeId) {
  state.grade = gradeId;
  [...elements.gradeRow.children].forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.grade === gradeId);
  });
}

function setCaption(title, tagline) {
  state.title = title;
  state.tagline = tagline;
  elements.title.value = title;
  elements.tagline.value = tagline;
}

async function addFiles(fileList) {
  const files = [...fileList].filter((file) => file.type.startsWith('image/'));
  if (files.length === 0) {
    setStatus('No image files there — try a JPG or PNG photo.');
    return;
  }
  let target = state.selected;
  for (const file of files) {
    if (target >= PANEL_COUNT) break;
    const photo = await loadPhotoFromFile(file);
    placePhotoInPanel(target, photo);
    target += 1;
  }
  setStatus(files.length === 1 ? 'Photo placed. Drag it on the canvas to frame it.' : 'Photos placed across the panels.');
  repaint();
}

async function addSample(sampleId) {
  const photo = await loadSamplePhoto(sampleId);
  placePhotoInPanel(state.selected, photo);
  setStatus(`${photo.name} is in panel ${state.selected + 1}.`);
  repaint();
}

function fillEveryPanelFromSelected() {
  const source = selectedPhoto();
  if (!source) {
    setStatus('Pick a panel with a photo first, then fill the rest from it.');
    return;
  }
  state.panels = state.panels.map(() => ({
    photo: { image: source.image, name: source.name, zoom: source.zoom, panX: source.panX, panY: source.panY },
  }));
  setStatus('Every panel now shows that photo. Select a panel to frame it on its own.');
  repaint();
}

function buildControls() {
  for (const sample of SAMPLE_PHOTOS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = sample.label;
    button.addEventListener('click', () => addSample(sample.id));
    elements.sampleRow.appendChild(button);
  }

  for (let i = 0; i < PANEL_COUNT; i += 1) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.textContent = i === 0 ? 'Hero' : `Panel ${i + 1}`;
    chip.addEventListener('click', () => selectPanel(i));
    elements.panelChips.appendChild(chip);
  }

  for (const gradeId of GRADE_IDS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.grade = gradeId;
    button.textContent = GRADES[gradeId].label;
    button.addEventListener('click', () => {
      setGrade(gradeId);
      repaint();
    });
    elements.gradeRow.appendChild(button);
  }

  for (const size of POST_SIZES) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.dataset.w = String(size.w);
    chip.dataset.h = String(size.h);
    chip.textContent = size.label;
    chip.addEventListener('click', () => setSize(size.w, size.h));
    elements.sizeRow.appendChild(chip);
  }
}

function canvasPoint(event) {
  const box = elements.canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) / box.width) * elements.canvas.width,
    y: ((event.clientY - box.top) / box.height) * elements.canvas.height,
  };
}

function wireCanvas() {
  let drag = null;
  elements.canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const index = panelIndexAt(lastPanels, point.x, point.y);
    if (index >= 0) selectPanel(index);
    const photo = selectedPhoto();
    if (!photo) return;
    drag = { x: point.x, y: point.y };
    elements.canvas.setPointerCapture(event.pointerId);
  });
  elements.canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const photo = selectedPhoto();
    if (!photo) return;
    const point = canvasPoint(event);
    const panel = lastPanels[state.selected];
    // Pan is a fraction of the cover-fit overflow, so dividing the pointer
    // movement by that overflow (the spare width and height of the framed
    // rectangle) makes the photo track the pointer exactly, at any zoom.
    const framed = framedPhotoRect(photo, panel);
    if (framed.spareX !== 0) photo.panX += (point.x - drag.x) / framed.spareX;
    if (framed.spareY !== 0) photo.panY += (point.y - drag.y) / framed.spareY;
    clampFraming(photo);
    drag = point;
    repaint();
  });
  const endDrag = () => {
    drag = null;
  };
  elements.canvas.addEventListener('pointerup', endDrag);
  elements.canvas.addEventListener('pointercancel', endDrag);
  elements.canvas.addEventListener(
    'wheel',
    (event) => {
      const photo = selectedPhoto();
      if (!photo) return;
      event.preventDefault();
      photo.zoom *= event.deltaY < 0 ? 1.08 : 0.93;
      clampFraming(photo);
      repaint();
    },
    { passive: false },
  );
}

function wireControls() {
  elements.fileInput.addEventListener('change', () => {
    addFiles(elements.fileInput.files ?? []);
    elements.fileInput.value = '';
  });
  elements.dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    elements.dropZone.classList.add('is-dragging');
  });
  elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('is-dragging'));
  elements.dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove('is-dragging');
    addFiles(event.dataTransfer?.files ?? []);
  });

  elements.fillAll.addEventListener('click', fillEveryPanelFromSelected);
  elements.resetFraming.addEventListener('click', () => {
    const photo = selectedPhoto();
    if (!photo) return;
    photo.zoom = 1;
    photo.panX = 0;
    photo.panY = 0;
    repaint();
  });

  const bindSlider = (control, key) => {
    control.addEventListener('input', () => {
      const photo = selectedPhoto();
      if (!photo) return;
      photo[key] = Number(control.value);
      clampFraming(photo);
      repaint();
    });
  };
  bindSlider(elements.zoom, 'zoom');
  bindSlider(elements.panX, 'panX');
  bindSlider(elements.panY, 'panY');

  elements.title.addEventListener('input', () => {
    state.title = elements.title.value;
    repaint();
  });
  elements.tagline.addEventListener('input', () => {
    state.tagline = elements.tagline.value;
    repaint();
  });
  elements.placement.addEventListener('change', () => {
    state.captionPlacement = elements.placement.value;
    repaint();
  });
  elements.arc.addEventListener('change', () => {
    state.captionArc = elements.arc.checked;
    repaint();
  });

  elements.exportButton.addEventListener('click', () => {
    renderCover(elements.canvas, state, { showSelection: false });
    elements.canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `vice-coast-cover-${state.size.w}x${state.size.h}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 4000);
      setStatus(`Exported a ${state.size.w} × ${state.size.h} PNG.`);
      repaint();
    }, 'image/png');
  });
}

const studio = { state, setSize, setGrade, setCaption, placePhotoInPanel, selectPanel, repaint };

buildControls();
wireControls();
wireCanvas();
setSize(state.size.w, state.size.h, { silent: true });
setGrade(state.grade);
setCaption(state.title, state.tagline);
repaint();

if (document.fonts && document.fonts.load) {
  document.fonts.load('80px Anton').then(() => repaint()).catch(() => {});
}

const shotRequest = readShotRequest();
if (shotRequest) {
  applyShotScene(shotRequest, studio).catch(() => {
    window.__shotReady = true;
  });
}
