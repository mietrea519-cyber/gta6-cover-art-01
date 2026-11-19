// Fixed scenes used to take the screenshots, driven by the query string.
//
//   ?shot=cover   — only the finished poster, nothing else on the page.
//   ?shot=editor  — the whole studio, with the scene loaded into it.
//
// Both modes understand the same parameters:
//   photo    sample id for the hero panel (neon-driver or sunset-pier)
//   photo2   sample id for the second panel, when a scene wants two photos
//   caption  the big title line
//   tagline  the smaller line under (or over) the title
//   grade    sunset, neon or classic
//   size     canvas size as WIDTHxHEIGHT, for example 1920x1080
//
// When the scene has painted, window.__shotReady is set to true so the
// screenshot tooling knows the frame is final, fonts included.

import { GRADE_IDS } from './grades.js';
import { SAMPLE_PHOTOS, loadSamplePhoto } from './photos.js';

export function readShotRequest() {
  const query = new URLSearchParams(window.location.search);
  const mode = query.get('shot');
  if (mode !== 'cover' && mode !== 'editor') return null;
  return { mode, query };
}

function parseSize(raw, fallback) {
  const match = /^(\d{3,4})x(\d{3,4})$/.exec(raw ?? '');
  if (!match) return fallback;
  return { w: Number(match[1]), h: Number(match[2]) };
}

function knownSampleId(raw) {
  return SAMPLE_PHOTOS.some((sample) => sample.id === raw) ? raw : SAMPLE_PHOTOS[0].id;
}

function knownGradeId(raw) {
  return GRADE_IDS.includes(raw) ? raw : 'sunset';
}

export async function applyShotScene(request, studio) {
  const { mode, query } = request;
  if (mode === 'cover') document.body.classList.add('shot-cover');

  const size = parseSize(query.get('size'), studio.state.size);
  studio.setSize(size.w, size.h, { silent: true });
  studio.setGrade(knownGradeId(query.get('grade')));
  studio.setCaption(query.get('caption') ?? studio.state.title, query.get('tagline') ?? studio.state.tagline);

  const heroPhoto = await loadSamplePhoto(knownSampleId(query.get('photo')));
  studio.placePhotoInPanel(0, heroPhoto);
  if (query.get('photo2')) {
    const secondPhoto = await loadSamplePhoto(knownSampleId(query.get('photo2')));
    studio.placePhotoInPanel(1, secondPhoto);
  }

  studio.selectPanel(0);
  studio.repaint();

  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // A font that failed to load must not hold the scene hostage.
    }
  }
  studio.repaint();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}
