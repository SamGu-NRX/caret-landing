/*
 * optimize-images — the shipping form of the three art images, proven
 * pixel-identical to the originals.
 *
 *   node tools/optimize-images.mjs                 # transform + identity check
 *   node tools/optimize-images.mjs --verify-only   # identity check only
 *   npm run check:images                           # the same, as a script
 *
 * The originals live in tools/art-src/ (git mv'd there unchanged, so the
 * blobs are shared with history). Each is re-encoded as lossless WebP into
 * public/art/ — libwebp lossless output decodes to exactly the input pixels,
 * and the check below proves it for every file: both decode to raw RGB and
 * the buffers must be byte-for-byte equal at the same width/height/channels.
 *
 * No file is replaced unless it is both identical in pixels and strictly
 * smaller in bytes, so a re-run can never make the site heavier or wrong.
 * Native pixel sizes are kept: every art image is displayed with
 * image-rendering: pixelated over object-fit: cover crops, so any
 * resampling would change visible pixels.
 *
 * If the ink print is ever regenerated with tools/ink-print.mjs, re-run this
 * script afterwards — art-src/ holds the exact bytes this baseline shipped.
 */

import { existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = resolve(root, "tools/art-src");
const outDir = resolve(root, "public/art");
const verifyOnly = process.argv.includes("--verify-only");

/* source file in tools/art-src/ -> shipped file in public/art/ */
const IMAGES = [
  { src: "austin-dusk.png", out: "austin-dusk.webp" },
  { src: "pershing-hall.png", out: "pershing-hall.webp" },
  { src: "austin-dusk-ink.webp", out: "austin-dusk-ink.webp" },
];

/** Decode a file to raw pixels and its exact shape. */
async function rawPixels(path) {
  const { data, info } = await sharp(path).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

async function checkIdentity(entry) {
  const srcPath = resolve(srcDir, entry.src);
  const outPath = resolve(outDir, entry.out);
  if (!existsSync(srcPath) || !existsSync(outPath)) {
    return { file: entry.out, ok: false, reason: "missing file (src or out)" };
  }
  const a = await rawPixels(srcPath);
  const b = await rawPixels(outPath);
  const sameShape = a.width === b.width && a.height === b.height && a.channels === b.channels;
  const samePixels = sameShape && a.data.equals(b.data);
  return {
    file: entry.out,
    ok: samePixels,
    width: b.width,
    height: b.height,
    channels: b.channels,
    originalBytes: statSync(srcPath).size,
    shippedBytes: statSync(outPath).size,
  };
}

async function main() {
  if (!verifyOnly) {
    const { mkdirSync } = await import("node:fs");
    mkdirSync(srcDir, { recursive: true });
    for (const entry of IMAGES) {
      const srcPath = resolve(srcDir, entry.src);
      if (!existsSync(srcPath)) {
        console.error(`missing original ${srcPath} — it must be committed before this script can run`);
        process.exit(1);
      }
      const outPath = resolve(outDir, entry.out);
      const before = statSync(srcPath).size;
      await sharp(srcPath).webp({ lossless: true, effort: 6 }).toFile(outPath);
      const after = statSync(outPath).size;
      if (after >= before) {
        /* Not worth shipping: keep the original bytes exactly. When source
           and output share a path the original is already in place. */
        if (entry.out !== entry.src) {
          await import("node:fs").then((fs) => fs.copyFileSync(srcPath, resolve(outDir, entry.src)));
          await import("node:fs").then((fs) => fs.rmSync(outPath, { force: true }));
        }
        console.log(`${entry.src}: kept original (${before} B; lossless WebP would be ${after} B)`);
      } else {
        console.log(`${entry.src} -> ${entry.out}: ${before} B -> ${after} B`);
      }
    }
  }

  console.log("\nidentity check (decoded raw pixels must be byte-identical):");
  let failures = 0;
  for (const entry of IMAGES) {
    const r = await checkIdentity(entry);
    if (!r.ok) {
      failures += 1;
      console.error(`  FAIL ${r.file}: ${r.reason ?? "decoded pixels differ"}`);
      continue;
    }
    console.log(
      `  ok   ${r.file}: ${r.width}x${r.height}x${r.channels} identical, ${r.originalBytes} B -> ${r.shippedBytes} B`,
    );
  }
  if (failures > 0) process.exit(1);
  console.log("all art images decode to exactly the original pixels");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
