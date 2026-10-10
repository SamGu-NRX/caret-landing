/*
 * check:site — the repeatable quality check for this page.
 *
 *   npm run check:site
 *
 * Builds the site, serves dist/ with `vite preview` on a fixed port, and for
 * each of the two viewports (1440x900, 390x844):
 *
 *   - saves docs/screenshots/<width>-first.png  (first screen at load)
 *   - saves docs/screenshots/<width>-full.png   (entire page)
 *   - runs axe and writes docs/checks/axe-<width>.json
 *   - measures cumulative layout shift from navigation until 3s after load
 *     (entries with hadRecentInput ignored) -> docs/checks/cls-<width>.json
 *   - collects every href on the page, requests each, and writes
 *     docs/checks/links.json with each URL and its final status
 *
 * It exits non-zero if axe reports any serious or critical violation, if CLS
 * is above 0.01 at either width, or if any link ends in a status of 400 or
 * above. All findings still land in docs/ so a failing run is a baseline.
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4173;
const BASE = `http://localhost:${PORT}/`;
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const CLS_BUDGET = 0.01;
const CLS_SETTLE_MS = 3000;
const FAILING_HTTP_STATUS = 400;

const shotsDir = resolve(root, "docs/screenshots");
const checksDir = resolve(root, "docs/checks");
mkdirSync(shotsDir, { recursive: true });
mkdirSync(checksDir, { recursive: true });

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
  const child = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
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

/* Runs in the page before any script: register the layout-shift observer so
   it sees everything from navigation on. */
const CLS_INIT = `
  window.__cls = 0;
  window.__clsEntries = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        window.__cls += entry.value;
        window.__clsEntries.push({
          value: entry.value,
          startTime: Math.round(entry.startTime),
          sources: entry.sources
            .map((s) => s.node && (s.node.nodeName + (s.node.className ? "." + String(s.node.className).split(" ").join(".") : "")))
            .filter(Boolean),
        });
      }
    }
  }).observe({ type: "layout-shift", buffered: true });
`;

async function main() {
  await run("npm", ["run", "build"]);
  const preview = await startPreview();

  const failures = [];
  const linkReport = [];

  try {
    for (const viewport of VIEWPORTS) {
      const { width } = viewport;
      const browser = await chromium.launch();
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();

      await page.addInitScript(CLS_INIT);
      await page.goto(BASE, { waitUntil: "networkidle" });
      await page.waitForLoadState("load");
      await page.waitForTimeout(CLS_SETTLE_MS);

      /* Screenshots: first screen, then the whole page. */
      await page.screenshot({ path: resolve(shotsDir, `${width}-first.png`) });
      await page.screenshot({ path: resolve(shotsDir, `${width}-full.png`), fullPage: true });

      /* axe. */
      const axeResults = await new AxeBuilder({ page }).analyze();
      writeFileSync(resolve(checksDir, `axe-${width}.json`), JSON.stringify(axeResults, null, 2) + "\n");
      const bad = axeResults.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      if (bad.length > 0) {
        failures.push(
          ...bad.map((v) => ({
            check: "axe",
            width,
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
          })),
        );
      }

      /* CLS: read the counter the init script has been accumulating. */
      const cls = await page.evaluate(() => window.__cls);
      const clsEntries = await page.evaluate(() => window.__clsEntries);
      writeFileSync(
        resolve(checksDir, `cls-${width}.json`),
        JSON.stringify({ cls, shifts: clsEntries }, null, 2) + "\n",
      );
      if (cls > CLS_BUDGET) {
        failures.push({ check: "cls", width, cls, budget: CLS_BUDGET });
      }

      /* Links: every href on the page, requested, with final status. */
      const hrefs = await page.evaluate(() =>
        Array.from(new Set(
          Array.from(document.querySelectorAll("a[href]"))
            .map((a) => a.href)
            .filter((href) => {
              const scheme = href.slice(0, href.indexOf(":")).toLowerCase();
              return scheme === "http" || scheme === "https";
            }),
        )),
      );
      for (const url of hrefs) {
        let status = null;
        /* Cold blob and rate-limited pages answer 429/503 on a first hit;
           try each URL up to five times before its status is final. */
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const res = await page.request.get(url, { maxRedirects: 10 });
            status = res.status();
          } catch (error) {
            status = `request-failed: ${String(error).split("\n")[0]}`;
          }
          if (typeof status !== "number" || status < 400) break;
          if (attempt < 4) await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        }
        linkReport.push({ url, status });
        const numeric = typeof status === "number" ? status : FAILING_HTTP_STATUS;
        if (numeric >= FAILING_HTTP_STATUS) {
          failures.push({ check: "link", url, status });
        }
      }

      await browser.close();
    }

    writeFileSync(resolve(checksDir, "links.json"), JSON.stringify(linkReport, null, 2) + "\n");

    if (failures.length > 0) {
      console.error("\ncheck:site FAILED — findings:");
      for (const f of failures) console.error(`  ${JSON.stringify(f)}`);
      process.exitCode = 1;
    } else {
      console.log("\ncheck:site passed: axe clean, CLS within budget, links resolve.");
    }
  } finally {
    preview.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
