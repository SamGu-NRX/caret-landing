/*
 * og:image — the share image for link previews.
 *
 *   npm run og:image
 *
 * Builds the site, serves dist/ with `vite preview` on :4174, and renders the
 * page's first screen at 1440 wide — headline, standfirst and the working
 * demo, the same frame `check:site` screenshots — into public/og.png at
 * 1200x630.
 *
 * The capture is 1440x756 — exactly the 1200x630 ratio at the page's design
 * width — so the scale down is uniform and nothing is distorted. The crop is
 * measured against the live layout: if the headline, standfirst, demo or
 * caption were to reach past the crop, the script fails instead of shipping
 * a cut element.
 *
 * Deterministic by construction:
 *   - fixed viewport (1440x900, the width the page is designed for);
 *   - waits for the webfonts, then for the composer autoplay to finish (the
 *     ghost suggestion is on screen), then a fixed settle for the last
 *     one-shot entrance animation (the latest ends 1860ms after mount);
 *   - the screenshot freezes CSS animations, so the composer caret cannot
 *     blink mid-capture.
 *
 * The 1440x756 frame is scaled to 1200x630 and encoded entirely in Node, with
 * no image dependency and no canvas resampler: the downscale is an exact box
 * (area-average) filter with integer weights — flat regions stay bit-exact
 * and the paper picks up none of the ±1 resampling noise that makes DEFLATE
 * give up. A lossless RGB encode of the averaged frame still lands at
 * ~395 KB — the painting in the demo is photographic, and its entropy is
 * real — so the frame is then quantized to a 256-colour median-cut palette
 * with Floyd-Steinberg diffusion: geometry untouched, flat regions still
 * bit-exact (they contribute zero error to diffuse), gradients spread across
 * the palette instead of banding. If even that is over budget the ladder
 * drops to a plain (undiffused) palette, then to 160 and 128 colours; the
 * first tier under 300 KB wins. The result is verified: PNG signature, IHDR
 * 1200x630, under 300 KB.
 */

import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { deflateSync, constants, inflateSync } from "node:zlib";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4174; /* check:site owns :4173; this runs alongside it. */
const BASE = `http://localhost:${PORT}/`;

const CAPTURE_WIDTH = 1440;
const VIEWPORT_HEIGHT = 900;
/* 1200x630 is the canonical share size; 1440x756 is the same ratio at the
   page's design width. */
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const CROP_HEIGHT = Math.round((CAPTURE_WIDTH * IMAGE_HEIGHT) / IMAGE_WIDTH); /* 756 */
const SIZE_BUDGET_BYTES = 300 * 1000;

/* What the image must show, fully inside the crop, with what it is for a
   reader. */
const REQUIRED = [
  [".hero-title", "the headline"],
  [".hero-standfirst", "the standfirst"],
  [".hero-stage", "the demo"],
  [".hero-caption", "the demo caption"],
];

/* First-screen neighbours the crop may drop entirely — but must never cut
   mid-element. */
const OPTIONAL = [
  [".site-header", "the wordmark and nav"],
  [".hero-context", "the context switch and its note"],
];

/* The crop starts just below the header. The nav is chrome, not share
   content, and dropping it buys the height that keeps the caption and the
   context note whole — a full-width 756px crop from the top measurably cuts
   the note's second line. */
const CROP_TOP_GAP = 2;

/* ------------------------------------------------------------- PNG codec */

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([head, body, crc]);
}

/** Decode an 8-bit RGBA or RGB PNG into its raw pixels. */
function decodePng(bytes) {
  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("not a PNG");
  let width = 0;
  let height = 0;
  let bpp = 0;
  const idat = [];
  let pos = 8;
  while (pos < bytes.length) {
    const length = bytes.readUInt32BE(pos);
    const type = bytes.toString("ascii", pos + 4, pos + 8);
    const data = bytes.subarray(pos + 8, pos + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || (data[9] !== 2 && data[9] !== 6)) {
        throw new Error(`expected 8-bit RGB or RGBA, got depth ${data[8]} colour ${data[9]}`);
      }
      bpp = data[9] === 6 ? 4 : 3;
      if (data[12] !== 0) throw new Error("interlaced PNG");
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    pos += 12 + length;
  }
  if (!width || idat.length === 0) throw new Error("PNG has no IHDR or no IDAT");

  /* Undo the per-row filters into raw scanlines. */
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  if (raw.length !== height * (stride + 1)) throw new Error("PNG pixel stream is the wrong length");
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v = row[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) {
        throw new Error(`unknown row filter ${filter}`);
      }
      cur[x] = v & 255;
    }
  }
  return { width, height, pixels, bpp };
}

/** Re-filter with the min-sum heuristic and deflate; the smallest IDAT wins. */
function deflatePixels(pixels, width, height, bpp) {
  const stride = width * bpp;
  const rows = [];
  const prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const cur = pixels.subarray(y * stride, (y + 1) * stride);
    let best = null;
    for (let f = 0; f <= 4; f++) {
      const row = Buffer.alloc(stride + 1);
      row[0] = f;
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? cur[x - bpp] : 0;
        const b = prev[x];
        const c = x >= bpp ? prev[x - bpp] : 0;
        let v = cur[x];
        if (f === 1) v -= a;
        else if (f === 2) v -= b;
        else if (f === 3) v -= (a + b) >> 1;
        else if (f === 4) {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v -= pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        }
        v &= 255;
        row[x + 1] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (!best || score < best.score) best = { row, score };
    }
    rows.push(best.row);
    cur.copy(prev);
  }

  const filtered = Buffer.concat(rows);
  const candidates = [
    deflateSync(filtered, { level: 9 }),
    deflateSync(filtered, { level: 9, strategy: constants.Z_FILTERED }),
    deflateSync(filtered, { level: 9, memLevel: 9 }),
  ];
  return candidates.reduce((smallest, candidate) => (candidate.length < smallest.length ? candidate : smallest));
}

/** RGBA to RGB, verifying the image really is opaque throughout. */
function dropAlpha(width, height, rgba) {
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    if (rgba[i + 3] !== 255) throw new Error("the capture is not fully opaque");
    rgb[j] = rgba[i];
    rgb[j + 1] = rgba[i + 1];
    rgb[j + 2] = rgba[i + 2];
  }
  return rgb;
}

/* ------------------------- palette quantization ------------------------- */

/** Distinct colours of an RGB buffer with their pixel counts. */
function histogram(rgb) {
  const counts = new Map();
  for (let i = 0; i < rgb.length; i += 3) {
    const key = (rgb[i] << 16) | (rgb[i + 1] << 8) | rgb[i + 2];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([key, count]) => ({
    key,
    count,
    r: (key >> 16) & 255,
    g: (key >> 8) & 255,
    b: key & 255,
  }));
}

/**
 * Median-cut palette: repeatedly split the box holding the most pixels
 * (among boxes with more than one colour) along its widest channel, at the
 * pixel-count median. Sorting ties break on the packed colour, so the
 * palette is a pure function of the pixels.
 */
function buildPalette(entries, maxColors) {
  const boxes = [entries.slice()];
  while (boxes.length < maxColors) {
    let pick = -1;
    let pickCount = 0;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].length < 2) continue;
      let n = 0;
      for (const e of boxes[i]) n += e.count;
      if (n > pickCount) {
        pickCount = n;
        pick = i;
      }
    }
    if (pick < 0) break;
    const box = boxes[pick];
    let rMin = 255;
    let rMax = 0;
    let gMin = 255;
    let gMax = 0;
    let bMin = 255;
    let bMax = 0;
    for (const e of box) {
      rMin = Math.min(rMin, e.r);
      rMax = Math.max(rMax, e.r);
      gMin = Math.min(gMin, e.g);
      gMax = Math.max(gMax, e.g);
      bMin = Math.min(bMin, e.b);
      bMax = Math.max(bMax, e.b);
    }
    const rRange = rMax - rMin;
    const gRange = gMax - gMin;
    const bRange = bMax - bMin;
    const channel = rRange >= gRange && rRange >= bRange ? "r" : gRange >= bRange ? "g" : "b";
    box.sort((a, b) => a[channel] - b[channel] || a.key - b.key);
    let acc = 0;
    let cut = 0;
    for (let i = 0; i < box.length; i++) {
      acc += box[i].count;
      if (acc >= pickCount / 2) {
        cut = i + 1;
        break;
      }
    }
    if (cut <= 0) cut = 1;
    if (cut >= box.length) cut = box.length - 1;
    boxes.splice(pick, 1, box.slice(0, cut), box.slice(cut));
  }

  const seen = new Map();
  for (const box of boxes) {
    let n = 0;
    let r = 0;
    let g = 0;
    let b = 0;
    for (const e of box) {
      n += e.count;
      r += e.count * e.r;
      g += e.count * e.g;
      b += e.count * e.b;
    }
    const colour = [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
    const key = (colour[0] << 16) | (colour[1] << 8) | colour[2];
    if (!seen.has(key)) seen.set(key, colour);
  }
  return [...seen.values()];
}

/**
 * Map every pixel to its nearest palette index, with Floyd-Steinberg error
 * diffusion when `dither` is set. Diffusion is error-driven, so a flat
 * region whose colour is exactly in the palette diffuses nothing and stays
 * bit-exact. The traversal is fixed left-to-right, top-to-bottom, and the
 * nearest-colour search breaks ties toward the lower index — no randomness
 * anywhere.
 */
function quantize(rgb, width, height, palette, dither) {
  const indices = Buffer.alloc(width * height);
  const lookup = new Map();
  const nearest = (r, g, b) => {
    const key = (r << 16) | (g << 8) | b;
    let idx = lookup.get(key);
    if (idx !== undefined) return idx;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const dr = r - palette[i][0];
      const dg = g - palette[i][1];
      const db = b - palette[i][2];
      const d = dr * dr + dg * dg + db * db;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    lookup.set(key, best);
    return best;
  };

  const errCur = new Float32Array((width + 2) * 3);
  const errNext = new Float32Array((width + 2) * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const e = (x + 1) * 3;
      const vr = Math.max(0, Math.min(255, rgb[i] + (dither ? errCur[e] : 0)));
      const vg = Math.max(0, Math.min(255, rgb[i + 1] + (dither ? errCur[e + 1] : 0)));
      const vb = Math.max(0, Math.min(255, rgb[i + 2] + (dither ? errCur[e + 2] : 0)));
      const idx = nearest(Math.round(vr), Math.round(vg), Math.round(vb));
      indices[y * width + x] = idx;
      if (!dither) continue;
      const er = vr - palette[idx][0];
      const eg = vg - palette[idx][1];
      const eb = vb - palette[idx][2];
      for (let c = 0; c < 3; c++) {
        const err = [er, eg, eb][c];
        errCur[e + c + 3] += (err * 7) / 16; /* right */
        errNext[e + c - 3] += (err * 3) / 16; /* down-left */
        errNext[e + c] += (err * 5) / 16; /* down */
        errNext[e + c + 3] += (err * 1) / 16; /* down-right */
      }
    }
    errCur.set(errNext);
    errNext.fill(0);
  }
  return indices;
}

/** Encode palette indices as an 8-bit indexed PNG. */
function encodeIndexedPng(width, height, indices, palette) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; /* bit depth */
  ihdr[9] = 3; /* indexed colour */
  const plte = Buffer.alloc(palette.length * 3);
  palette.forEach(([r, g, b], i) => {
    plte[i * 3] = r;
    plte[i * 3 + 1] = g;
    plte[i * 3 + 2] = b;
  });
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("PLTE", plte),
    chunk("IDAT", deflatePixels(indices, width, height, 1)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Exact box downscale from RGB to dstW x dstH: each destination pixel is the
 * area-weighted average of the source pixels it covers, with integer overlap
 * weights (no floating point, so runs are reproducible and flat source
 * regions stay exactly flat). 1440x756 -> 1200x630 is an exact 6:5.
 */
function boxDownscale(rgb, srcW, srcH, dstW, dstH) {
  const out = Buffer.alloc(dstW * dstH * 3);
  const total = srcW * srcH;
  for (let dy = 0; dy < dstH; dy++) {
    const y0 = dy * srcH; /* source span in 1/dstH units */
    const y1 = (dy + 1) * srcH;
    for (let dx = 0; dx < dstW; dx++) {
      const x0 = dx * srcW; /* source span in 1/dstW units */
      const x1 = (dx + 1) * srcW;
      let r = 0;
      let g = 0;
      let b = 0;
      for (let y = Math.floor(y0 / dstH); y * dstH < y1; y++) {
        const wy = Math.min((y + 1) * dstH, y1) - Math.max(y * dstH, y0);
        for (let x = Math.floor(x0 / dstW); x * dstW < x1; x++) {
          const wx = Math.min((x + 1) * dstW, x1) - Math.max(x * dstW, x0);
          const w = wx * wy;
          const i = (y * srcW + x) * 3;
          r += w * rgb[i];
          g += w * rgb[i + 1];
          b += w * rgb[i + 2];
        }
      }
      const o = (dy * dstW + dx) * 3;
      out[o] = Math.round(r / total);
      out[o + 1] = Math.round(g / total);
      out[o + 2] = Math.round(b / total);
    }
  }
  return out;
}

/* ------------------------------------------------------------- pipeline */

/** Run a command, streaming its output, and reject on failure. */
function run(cmd, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, { cwd: root, stdio: "inherit" });
    child.on("exit", (code, signal) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with ${code ?? signal}`));
    });
  });
}

/** Start `vite preview` on the fixed port and wait until it answers. */
async function startPreview() {
  /* Spawn vite's own bin with node directly: killing an `npx` wrapper
     orphans the actual server, and the port then leaks to the next run. */
  const viteBin = resolve(root, "node_modules", "vite", "bin", "vite.js");
  const child = spawn(process.execPath, [viteBin, "preview", "--port", String(PORT), "--strictPort"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return child;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.error(`vite preview did not come up on :${PORT}\n${output}`);
  child.kill();
  process.exit(1);
}

async function main() {
  await run("npm", ["run", "build"]);
  const preview = await startPreview();

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: CAPTURE_WIDTH, height: VIEWPORT_HEIGHT },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    /* The composer autoplay types its opening one character per 55ms and then
       leaves the ghost suggestion up; that is the demo at rest. */
    await page.locator(".rc__accept").first().waitFor({ state: "visible", timeout: 15_000 });
    await page.waitForTimeout(500);

    /* Measure the first screen, then place the crop: everything REQUIRED
       fully inside; every OPTIONAL element fully in or fully out — one
       straddling the edge would be cut mid-element, and the script fails
       instead of shipping that. The measured rects go to the log so a
       failure names the element and the number. */
    const rects = await page.evaluate(
      (pairs) =>
        Object.fromEntries(
          pairs.map(([selector, label]) => {
            const el = document.querySelector(selector);
            if (!el) throw new Error(`${selector} (${label}) is not on the page`);
            const r = el.getBoundingClientRect();
            return [selector, { label, top: r.top, bottom: r.bottom, left: r.left, right: r.right }];
          }),
        ),
      [...REQUIRED, ...OPTIONAL],
    );
    for (const [selector, r] of Object.entries(rects)) {
      console.error(`og:image: ${selector} (${r.label}) top ${r.top.toFixed(0)} bottom ${r.bottom.toFixed(0)} left ${r.left.toFixed(0)} right ${r.right.toFixed(0)}`);
    }

    const header = rects[".site-header"];
    const cropTop = Math.ceil(header.bottom) + CROP_TOP_GAP;
    const cropBottom = cropTop + CROP_HEIGHT;
    if (cropBottom > VIEWPORT_HEIGHT) {
      throw new Error(`the crop [${cropTop}, ${cropBottom}] runs past the ${VIEWPORT_HEIGHT}px viewport`);
    }
    for (const [selector, r] of Object.entries(rects)) {
      const required = REQUIRED.some(([s]) => s === selector);
      const inside = r.top >= cropTop && r.bottom <= cropBottom;
      const above = r.bottom <= cropTop;
      const below = r.top >= cropBottom;
      if (required && !inside) {
        throw new Error(`${selector} (${r.label}) must be fully inside the crop [${cropTop}, ${cropBottom}] but spans [${r.top.toFixed(0)}, ${r.bottom.toFixed(0)}]`);
      }
      if (!required && !inside && !above && !below) {
        throw new Error(`${selector} (${r.label}) straddles the crop edge: spans [${r.top.toFixed(0)}, ${r.bottom.toFixed(0)}] against crop [${cropTop}, ${cropBottom}]`);
      }
    }

    const shot = await page.screenshot({
      clip: { x: 0, y: cropTop, width: CAPTURE_WIDTH, height: CROP_HEIGHT },
      animations: "disabled",
    });

    await browser.close();

    /* Downscale and encode in Node, per the header comment: exact box
       average, then the first quantization tier that fits the budget. */
    const decoded = decodePng(shot);
    if (decoded.width !== CAPTURE_WIDTH || decoded.height !== CROP_HEIGHT) {
      throw new Error(
        `the capture decoded to ${decoded.width}x${decoded.height}, expected ${CAPTURE_WIDTH}x${CROP_HEIGHT}`,
      );
    }
    const source = decoded.bpp === 4 ? dropAlpha(decoded.width, decoded.height, decoded.pixels) : decoded.pixels;
    const frame = boxDownscale(source, CAPTURE_WIDTH, CROP_HEIGHT, IMAGE_WIDTH, IMAGE_HEIGHT);

    /* The ladder is fixed and deterministic: 256 diffused colours first,
       then plain 256, then diffused 160 and 128. Flat paper and ink survive
       every tier exactly; only the painting gives up gradations. */
    const TIERS = [
      { colors: 256, dither: true },
      { colors: 256, dither: false },
      { colors: 160, dither: true },
      { colors: 128, dither: true },
    ];
    let png = null;
    let tier = null;
    for (const attempt of TIERS) {
      const palette = buildPalette(histogram(frame), attempt.colors);
      const indices = quantize(frame, IMAGE_WIDTH, IMAGE_HEIGHT, palette, attempt.dither);
      const candidate = encodeIndexedPng(IMAGE_WIDTH, IMAGE_HEIGHT, indices, palette);
      if (candidate.length < SIZE_BUDGET_BYTES) {
        png = candidate;
        tier = { ...attempt, used: palette.length };
        break;
      }
      console.error(
        `og:image: tier ${attempt.colors} colours${attempt.dither ? " with diffusion" : ""} is ${(candidate.length / 1000).toFixed(0)} KB; trying a smaller tier`,
      );
    }
    if (!png) {
      throw new Error(`every quantization tier is over the ${(SIZE_BUDGET_BYTES / 1000).toFixed(0)} KB budget`);
    }

    writeFileSync(resolve(root, "public", "og.png"), png);
    console.log(
      `og:image wrote public/og.png — ${IMAGE_WIDTH}x${IMAGE_HEIGHT}, ${(png.length / 1000).toFixed(1)} KB, ` +
        `${tier.used} colours${tier.dither ? " with Floyd-Steinberg diffusion" : ", no diffusion"} ` +
        `(capture ${CAPTURE_WIDTH}x${CROP_HEIGHT} at ${CAPTURE_WIDTH} wide, scaled to ${IMAGE_WIDTH}x${IMAGE_HEIGHT})`,
    );
  } finally {
    preview.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
