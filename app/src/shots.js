// Fixed scenes for the maker's screenshots, in the starter's convention: the page is opened with
// a query such as ?shot=cover&photo=neon-driver&photo2=sunset-pier&caption=Neon%20Coast&grade=neon
// &size=1920x1080, the app sets that scene up, and window.__shotReady is set once it has painted.
// shots.json at the repository root lists the scenes and the size each is captured at.

const SHOT_PARAM_DEFAULTS = {
  photo: 'neon-driver',
  photo2: 'sunset-pier',
  caption: 'Neon Coast',
  tagline: 'One city, no rules',
  grade: 'sunset',
  size: '1080x1080',
};

/** Reads the shot configuration from the page's query string, or returns null for a normal visit. */
export function readShotConfig() {
  const query = new URLSearchParams(location.search);
  const mode = query.get('shot');
  if (mode !== 'cover' && mode !== 'editor') return null;
  const config = { mode };
  for (const [key, fallback] of Object.entries(SHOT_PARAM_DEFAULTS)) {
    config[key] = query.get(key) ?? fallback;
  }
  return config;
}

/** Tells the screenshot tool the scene is fully painted: two frames after this is called. */
export function signalShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
