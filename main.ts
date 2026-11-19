// Vice Coast Cover Studio — the hand-in program for make.fun's gta6-cover-art-01 bounty.
//
// The app itself is the app/ folder beside this file: plain static files (index.html, ES modules,
// a vendored OFL font and two sample photos) that a desktop browser runs fully offline. This
// program copies app/ and screenshots/ into the output directory and writes dossier.json there
// with the kit's vendored library, exactly the summary the bounty judge reads.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Preview the app first with: node serve.ts  (then open the printed address)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below are the gate's own limits, passed so a hand-in this program writes is never one
// the scorer would refuse: at most 4 screenshots of 256 KiB each, at most 993 files and 48 MiB
// under app/, no app path over 1,000 bytes, and the dossier's source text capped at 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
