/*
 * check:pixels — the full-page screenshots must not differ by a single pixel.
 *
 *   npm run check:pixels
 *   node tools/check-pixels.mjs docs/checks/weight-before docs/checks/weight-after
 *
 * For each design width it decodes the before and after full-page
 * screenshots (docs/checks/<stem>-<width>.png) to raw pixels and compares
 * them exactly. Any difference in dimensions or in a single channel of a
 * single pixel fails the check; the details land in
 * docs/checks/pixel-diff.json either way.
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checksDir = resolve(root, "docs/checks");
const beforeStem = process.argv[2] ?? "weight-before";
const afterStem = process.argv[3] ?? "weight-after";
const WIDTHS = [1440, 390];

async function rawPixels(path) {
  const { data, info } = await sharp(path).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

const report = { beforeStem, afterStem, widths: {}, allIdentical: true };

let failures = 0;
for (const width of WIDTHS) {
  const beforePath = resolve(checksDir, `${beforeStem}-${width}.png`);
  const afterPath = resolve(checksDir, `${afterStem}-${width}.png`);
  const a = await rawPixels(beforePath);
  const b = await rawPixels(afterPath);

  const entry = {
    before: `${beforeStem}-${width}.png`,
    after: `${afterStem}-${width}.png`,
    dimensions: `${a.width}x${a.height}x${a.channels} vs ${b.width}x${b.height}x${b.channels}`,
  };

  if (a.width !== b.width || a.height !== b.height || a.channels !== b.channels) {
    entry.identical = false;
    entry.reason = "screenshot dimensions or channel count differ";
    failures += 1;
  } else if (a.data.equals(b.data)) {
    entry.identical = true;
    entry.differingPixels = 0;
  } else {
    let differing = 0;
    let maxDelta = 0;
    let first = null;
    const px = a.channels;
    for (let i = 0; i < a.data.length; i += px) {
      let diffed = false;
      for (let c = 0; c < px; c++) {
        const d = Math.abs(a.data[i + c] - b.data[i + c]);
        if (d > 0) {
          diffed = true;
          if (d > maxDelta) maxDelta = d;
        }
      }
      if (diffed) {
        differing += 1;
        if (!first) {
          const index = i / px;
          first = {
            x: index % a.width,
            y: Math.floor(index / a.width),
            before: [...a.data.subarray(i, i + px)],
            after: [...b.data.subarray(i, i + px)],
          };
        }
      }
    }
    entry.identical = differing === 0;
    entry.differingPixels = differing;
    entry.maxChannelDelta = maxDelta;
    entry.firstDifferingPixel = first;
    if (differing > 0) failures += 1;
  }

  entry.identical ? console.log(`${width}px: identical (${a.width}x${a.height})`) : console.error(`${width}px: DIFFERS — ${JSON.stringify(entry)}`);
  report.widths[width] = entry;
  report.allIdentical = report.allIdentical && entry.identical;
}

writeFileSync(resolve(checksDir, "pixel-diff.json"), JSON.stringify(report, null, 2) + "\n");
console.log("wrote docs/checks/pixel-diff.json");
if (failures > 0) process.exit(1);
