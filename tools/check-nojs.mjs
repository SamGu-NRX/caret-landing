#!/usr/bin/env node
/**
 * Verify the <noscript> fallback in the BUILT page:
 *   (a) with JavaScript disabled, the first screen shows the h1 and the
 *       standfirst (verbatim from Hero.tsx) and a working "See the code"
 *       link whose href is REPO_URL;
 *   (b) with JavaScript enabled, the noscript content is not rendered;
 *   (c) `npm run check:site` still passes unchanged.
 *
 * Its own script so `check:site` and its budgets stay untouched.
 */
import { spawn, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const PORT = 4175; /* 4173 is check:site's, 4174 og:image's. */
const failures = [];
const check = (name, ok, detail = "") => {
  if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
};
const collapsed = (s) => s.replace(/\s+/g, " ").trim();

/* REPO_URL from the source, so the check breaks if the link drifts. */
const site = await readFile(resolve(root, "src/lib/site.ts"), "utf8");
const repoUrl = site.match(/REPO_URL = "([^"]+)"/)?.[1];
if (!repoUrl) {
  console.error("check:nojs: could not read REPO_URL from src/lib/site.ts");
  process.exit(1);
}

/* The hero copy, the same way check-meta.mjs reads it out of Hero.tsx. */
const hero = await readFile(resolve(root, "src/components/hero/Hero.tsx"), "utf8");
const h1Source = hero.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
const standfirstSource = hero.match(/<p className="hero-standfirst">([\s\S]*?)<\/p>/);
if (!h1Source || !standfirstSource) {
  console.error("check:nojs: could not read the h1/standfirst out of Hero.tsx");
  process.exit(1);
}
const h1Text = collapsed(
  h1Source[1].replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\{"[^"]*"\}/g, "").replace(/<[^>]+>/g, ""),
);
const standfirstText = collapsed(
  standfirstSource[1].replace(/<[^>]+>/g, "").replace(/\{"[^"]*"\}/g, ""),
);

/* The fallback must be there after a real build. */
const build = spawnSync("npm", ["run", "build"], { stdio: "inherit" });
if (build.status !== 0) {
  console.error("check:nojs: npm run build failed");
  process.exit(build.status ?? 1);
}

/* vite's own bin, spawned directly: an npx wrapper orphans the server. */
const viteBin = resolve(root, "node_modules", "vite", "bin", "vite.js");
const child = spawn(process.execPath, [viteBin, "preview", "--port", String(PORT), "--strictPort"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
child.stdout.on("data", (c) => (output += c));
child.stderr.on("data", (c) => (output += c));

try {
  /* Vite binds "localhost", which on this box may be ::1 only — poll both
     stacks and keep whichever answers. */
  const deadline = Date.now() + 30_000;
  let base = null;
  while (Date.now() < deadline && base === null) {
    for (const candidate of [`http://localhost:${PORT}/`, `http://127.0.0.1:${PORT}/`]) {
      try {
        if ((await fetch(candidate)).ok) {
          base = candidate;
          break;
        }
      } catch {
        /* not up yet */
      }
    }
    if (base === null) await new Promise((r) => setTimeout(r, 250));
  }
  if (base === null) {
    console.error(`check:nojs: vite preview did not come up on :${PORT}\n${output}`);
    process.exit(1);
  }

  const browser = await chromium.launch();

  /* (a) JavaScript disabled: the fallback IS the page. */
  {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "load" });

    const h1 = page.locator("noscript h1");
    const h1Actual = await h1.textContent();
    check("no-js: h1 visible", await h1.isVisible());
    check("no-js: h1 is the page's own", collapsed(h1Actual ?? "") === h1Text, JSON.stringify(h1Actual));

    const standfirst = page.locator("noscript p");
    const standfirstActual = await standfirst.textContent();
    check("no-js: standfirst is the page's own", collapsed(standfirstActual ?? "") === standfirstText, JSON.stringify(standfirstActual));

    const link = page.locator("noscript a");
    const href = await link.getAttribute("href");
    check("no-js: link visible", await link.isVisible());
    check("no-js: link label", collapsed((await link.textContent()) ?? "") === "See the code");
    check("no-js: link href is REPO_URL", href === repoUrl, String(href));

    const rootChildren = await page.evaluate(() => document.getElementById("root").children.length);
    check("no-js: the app did not render", rootChildren === 0, `#root has ${rootChildren} children`);

    await context.close();
  }

  /* (b) JavaScript enabled: the fallback stays out of the way. */
  {
    const context = await browser.newContext({ javaScriptEnabled: true, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "load" });

    const noscriptChildren = await page.evaluate(() => document.querySelector("noscript")?.children.length ?? null);
    check("js-on: noscript not rendered", noscriptChildren === 0, `noscript has ${noscriptChildren} element children`);

    await context.close();
  }

  await browser.close();
} finally {
  child.kill();
}

console.log(`check:nojs: ${failures.length === 0 ? "passed" : `FAILED (${failures.length})`}`);
for (const f of failures) console.error(`  FAIL: ${f}`);
if (failures.length > 0) process.exit(1);

/* (c) The unchanged site check, over the build the fallback landed in. */
const siteCheck = spawnSync("npm", ["run", "check:site"], { stdio: "inherit" });
if (siteCheck.status !== 0) {
  console.error("check:nojs: check:site failed after the noscript change");
  process.exit(siteCheck.status ?? 1);
}
console.log("check:nojs: check:site still passes (axe clean, CLS within budget)");
