#!/usr/bin/env node
/**
 * Rasterize public/favicon.svg to public/apple-touch-icon.png at 180x180 —
 * the size iOS asks for via <link rel="apple-touch-icon" sizes="180x180">.
 * Playwright renders the SVG exactly like a browser; the SVG itself stays
 * untouched as the site icon. Deterministic: fixed viewport, no animations.
 */
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { resolve } from "node:path";

const root = process.cwd();
const svg = await readFile(resolve(root, "public", "favicon.svg"));
const outPath = resolve(root, "public", "apple-touch-icon.png");

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 180, height: 180 }, deviceScaleFactor: 1 });
  await page.goto(`data:image/svg+xml;base64,${svg.toString("base64")}`);
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 180, height: 180 }, omitBackground: true });
  await page.close();
} finally {
  await browser.close();
}

const out = await readFile(outPath);
if (out.toString("ascii", 12, 16) !== "IHDR") throw new Error("apple-touch-icon.png has no IHDR first");
const width = out.readUInt32BE(16);
const height = out.readUInt32BE(20);
if (width !== 180 || height !== 180) {
  throw new Error(`apple-touch-icon.png is ${width}x${height}, expected 180x180`);
}
console.log(`icon:touch wrote public/apple-touch-icon.png — ${width}x${height}, ${(out.length / 1024).toFixed(1)} KB, from favicon.svg (${svg.length} bytes, untouched)`);
