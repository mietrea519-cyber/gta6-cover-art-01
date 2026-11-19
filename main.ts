// Vice Coast Cover Studio — hand-in program for the gta6-cover-art-01 entry.
//
// What this file does, in plain terms: it takes the finished web app that
// lives in the app/ folder next to this file, plus the screenshots/ folder,
// copies both of them into the output directory, and then asks the vendored
// make.fun library to summarise everything into dossier.json. That dossier
// is the one document the grader and the judge read, so it has to be built
// with the kit's own buildDossier and with the gate's own limits — nothing
// here invents its own format.
//
// Run it locally like this:
//   MAKEFUN_OUTPUT_DIR=/tmp/coverout node main.ts
// When MAKEFUN_OUTPUT_DIR is not set the output directory is /output, which
// is where the grading container expects the hand-in to land.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate limits, copied from the competition's gate configuration. Only
// the text cap changes the dossier bytes; the rest make this program refuse
// a tree the scorer would refuse anyway, which is kinder than failing late.
const GATE_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyTreeIntoOutput(folderName: string): void {
  const from = join(repoRoot, folderName);
  const into = join(outputDir, folderName);
  mkdirSync(into, { recursive: true });
  if (existsSync(from)) {
    cpSync(from, into, { recursive: true });
  }
}

mkdirSync(outputDir, { recursive: true });
copyTreeIntoOutput('app');
copyTreeIntoOutput('screenshots');

const dossierBytes = buildDossier(outputDir, GATE_LIMITS);
writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
