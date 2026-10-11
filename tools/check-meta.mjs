#!/usr/bin/env node
/**
 * Assert the share-metadata contract of the BUILT page. Runs `npm run build`
 * itself — the source of truth is dist/index.html, the file a crawler
 * actually fetches, not the source index.html.
 *
 * Checks, in three groups:
 *  1. every required tag is present in dist/index.html with the right value;
 *  2. every file the tags reference exists in dist/, and the share image
 *     decodes as a 1200x630 PNG (IHDR only — no image dependency);
 *  3. the copy in the tags is verbatim from the page: og:title matches the
 *     <title>, and og:description matches the hero standfirst in
 *     src/components/hero/Hero.tsx — whitespace-collapsed comparison.
 *
 * Its own script so `check:site` and its budgets stay untouched.
 */
import { spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const failures = [];
const passes = [];

function check(name, ok, detail = "") {
  if (ok) passes.push(name);
  else failures.push(detail ? `${name}: ${detail}` : name);
}

/** Whitespace-collapsed comparison key. */
const collapsed = (s) => s.replace(/\s+/g, " ").trim();

/** All attributes of every tag of one kind, as plain objects. */
function tags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "g"))].map((m) =>
    Object.fromEntries([...m[0].matchAll(/([a-zA-Z-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]])),
  );
}

/** The declared pixel size of a PNG, read straight out of the IHDR chunk. */
async function pngIhdrSize(path) {
  const bytes = await readFile(path);
  const signatureOk = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!signatureOk) throw new Error(`${path} is not a PNG (bad signature)`);
  if (bytes.toString("ascii", 12, 16) !== "IHDR") throw new Error(`${path} has no IHDR first`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/* 0. Build, so the check cannot pass on a stale dist. */
const build = spawnSync("npm", ["run", "build"], { stdio: "inherit" });
if (build.status !== 0) {
  console.error("check:meta: npm run build failed");
  process.exit(build.status ?? 1);
}

/* 1. The tag values in the built page. */
const dist = await readFile(resolve(root, "dist", "index.html"), "utf8");
const metas = tags(dist, "meta");
const meta = (key) => metas.find((m) => m.property === key || m.name === key);
const links = tags(dist, "link");
const link = (rel) => links.find((l) => l.rel === rel);
const titleMatch = dist.match(/<title>([^<]*)<\/title>/);
const titleText = titleMatch ? titleMatch[1] : null;

const TITLE = "Caret: an assistant the size of an asterisk";
const OG_IMAGE = "/og.png";
const CANONICAL = "/";
const APPLE_ICON = "./apple-touch-icon.png";

check("title", titleText !== null && collapsed(titleText) === TITLE, `dist <title> is ${JSON.stringify(titleText)}`);
for (const [key, expected] of [
  ["og:title", TITLE],
  ["og:image:width", "1200"],
  ["og:image:height", "630"],
  ["og:type", "website"],
]) {
  const m = meta(key);
  check(key, m !== undefined && m.content === expected, m ? `content is ${JSON.stringify(m.content)}` : "tag missing");
}

/* vite:build-html normalizes og:image meta content to document-relative form,
   so the built page says "./og.png" where the source says "/og.png" — the
   same URL from the document root. Accept both spellings; the file and its
   dimensions are pinned separately below. */
const ogImage = meta("og:image");
check(
  "og:image",
  ogImage !== undefined && ["/og.png", "./og.png"].includes(ogImage.content),
  ogImage ? `content is ${JSON.stringify(ogImage.content)}` : "tag missing",
);

const twitterCard = meta("twitter:card");
check(
  "twitter:card",
  twitterCard !== undefined && twitterCard.name === "twitter:card" && twitterCard.content === "summary_large_image",
  twitterCard ? JSON.stringify(twitterCard) : "tag missing",
);

const canonical = link("canonical");
check("canonical", canonical !== undefined && canonical.href === CANONICAL, canonical ? `href is ${JSON.stringify(canonical.href)}` : "link missing");

const apple = link("apple-touch-icon");
check(
  "apple-touch-icon",
  apple !== undefined && apple.sizes === "180x180" && apple.href === APPLE_ICON,
  apple ? JSON.stringify(apple) : "link missing",
);

/* 2. Every referenced file exists in dist, and the images are the declared size. */
for (const [label, href, expectedSize] of [
  ["og:image", OG_IMAGE, { width: 1200, height: 630 }],
  ["apple-touch-icon", APPLE_ICON, { width: 180, height: 180 }],
  ["favicon", "./favicon.svg", null],
]) {
  if (!href) continue;
  const path = resolve(root, "dist", href.replace(/^\.\//, "").replace(/^\//, ""));
  let exists = false;
  try {
    exists = (await stat(path)).isFile();
  } catch {
    exists = false;
  }
  check(`${label} exists in dist`, exists, href);
  if (exists && expectedSize) {
    const size = await pngIhdrSize(path);
    check(
      `${label} is ${expectedSize.width}x${expectedSize.height}`,
      size.width === expectedSize.width && size.height === expectedSize.height,
      `IHDR says ${size.width}x${size.height}`,
    );
  }
}

/* 3. The copy is the page's own, verbatim. The standfirst and the h1 come
      from Hero.tsx; the title from the source index.html. */
const heroSource = await readFile(resolve(root, "src", "components", "hero", "Hero.tsx"), "utf8");
const standfirstMatch = heroSource.match(/<p className="hero-standfirst">([\s\S]*?)<\/p>/);
if (!standfirstMatch) {
  check("standfirst source", false, "could not find <p className=\"hero-standfirst\"> in Hero.tsx");
} else {
  const standfirst = collapsed(standfirstMatch[1].replace(/<[^>]+>/g, "").replace(/\{"[^"]*"\}/g, ""));
  const ogDescription = meta("og:description");
  check(
    "og:description matches Hero.tsx standfirst",
    ogDescription !== undefined && ogDescription.content === standfirst,
    ogDescription ? `tag is ${JSON.stringify(ogDescription.content)}, standfirst is ${JSON.stringify(standfirst)}` : "tag missing",
  );

  const h1Match = heroSource.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!h1Match) {
    check("h1 source", false, "could not find <h1> in Hero.tsx");
  } else {
    const h1 = collapsed(
      h1Match[1]
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "") // JSX comments
        .replace(/\{"[^"]*"\}/g, "") // JSX expressions, e.g. {" "}
        .replace(/<[^>]+>/g, ""),
    );
    const ogAlt = meta("og:image:alt");
    const expectedAlt = collapsed(`${h1} ${standfirst}`);
    check(
      "og:image:alt matches h1 + standfirst",
      ogAlt !== undefined && ogAlt.content === expectedAlt,
      ogAlt ? `tag is ${JSON.stringify(ogAlt.content)}, expected ${JSON.stringify(expectedAlt)}` : "tag missing",
    );
  }
}

console.log(`check:meta: ${passes.length} passed, ${failures.length} failed`);
for (const name of passes) console.log(`  ok: ${name}`);
for (const failure of failures) console.error(`  FAIL: ${failure}`);
if (failures.length > 0) process.exit(1);
