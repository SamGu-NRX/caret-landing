// Reads the colour original from tools/art-src/ (moved there unchanged by the
// weight task; tools/optimize-images.mjs re-encodes its output from the same
// pixels). Writes public/art/austin-dusk-ink.webp, the ink print of the wallpaper that every desktop after the hero uses.
//
// Each pixel's luminance is mapped onto a ramp from #1b2750 (ink-blue night) to #d9d6ea (pale lavender), with
// gamma 0.8 to open the shadows a little. Nothing is resampled, so the pixel-art dithering stays crisp; the page
// still draws it with `image-rendering: pixelated`. Lossless WebP keeps every pixel exact.
// The recipe is the kgu.one design handoff's (design/p18/sites/tools/duotone.mjs); nobody has tested other ramps.
//
// sharp is not a dependency of this site. Point SHARP_MODULE at any installed copy:
//   SHARP_MODULE=/path/to/node_modules/sharp/dist/index.mjs node tools/ink-print.mjs
import { fileURLToPath } from "node:url";

const sharp = (await import(process.env.SHARP_MODULE ?? "sharp")).default;
const root = fileURLToPath(new URL("..", import.meta.url));
const SRC = `${root}tools/art-src/austin-dusk.png`;
const OUT = `${root}public/art/austin-dusk-ink.webp`;
const DARK = "#1b2750";
const LIGHT = "#d9d6ea";
const GAMMA = 0.8;

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const a = rgb(DARK);
const b = rgb(LIGHT);

const { data, info } = await sharp(SRC).greyscale().raw().toBuffer({ resolveWithObject: true });
const out = Buffer.alloc(info.width * info.height * 3);
for (let i = 0; i < info.width * info.height; i++) {
  const t = Math.pow(data[i] / 255, GAMMA);
  for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(a[c] + (b[c] - a[c]) * t);
}
await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
  .webp({ lossless: true })
  .toFile(OUT);
console.log(`${OUT} (${info.width}x${info.height})`);
