/*
 * check:weight — how heavy is the page, and how long does its largest
 * contentful paint take on a "Fast 4G" connection?
 *
 *   npm run check:weight -- docs/checks/weight-before.json
 *
 * Builds the site, serves dist/ with `vite preview` on a free port, then for
 * each of the two viewports the site is designed against (1440x900,
 * 390x844) runs RUNS fresh measurements plus one screenshot pass:
 *
 *   - a fresh browser context per run, with caching disabled twice over:
 *     nothing is reused between runs, and CDP Network.setCacheDisabled
 *     turns off the in-context HTTP cache as well;
 *   - "Fast 4G" network throttling over CDP Network.emulateNetworkConditions:
 *     download 9 Mbps  -> Math.round(9 * 1024 * 1024 / 8) = 1179648 bytes/s
 *     upload   1.5 Mbps -> Math.round(1.5 * 1024 * 1024 / 8) = 196608 bytes/s
 *     latency  150 ms
 *   - per run: total bytes transferred (sum of encodedDataLength over every
 *     finished response), bytes for each of the three art images, and the
 *     largest-contentful-paint time and element (PerformanceObserver,
 *     buffered, so nothing painted before registration is missed);
 *   - a full-page screenshot per width (no throttle, every image decoded
 *     first) written next to the output JSON as <stem>-<width>.png. These
 *     are the pixel baselines that tools/check-pixels.mjs diffs against.
 *
 * The output JSON holds every individual run plus a clearly marked median
 * per width. It exits non-zero only if the build, the preview server, or a
 * run fails; weight and LCP numbers are findings, not assertions.
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import net from "node:net";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = process.argv[2]
  ? resolve(root, process.argv[2])
  : resolve(root, "docs/checks/weight.json");
const stem = outPath.replace(/\.json$/, "");
const shotsDir = resolve(root, "docs/checks");
mkdirSync(shotsDir, { recursive: true });

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const RUNS = 5;
const SETTLE_MS = 1000;

/* Fast 4G, expressed the way CDP wants it. */
const NETWORK = {
  profile: "Fast 4G (CDP Network.emulateNetworkConditions)",
  latencyMs: 150,
  downloadThroughput: Math.round((9 * 1024 * 1024) / 8), // 1179648 bytes/s (9 Mbps)
  uploadThroughput: Math.round((1.5 * 1024 * 1024) / 8), // 196608 bytes/s (1.5 Mbps)
};

/* Art images, matched on the final path segment so the keys survive a
 * lossless re-encode that changes the extension (png -> webp). */
const ART_KEYS = {
  "austin-dusk": ["austin-dusk.png", "austin-dusk.webp"],
  "austin-dusk-ink": ["austin-dusk-ink.webp"],
  "pershing-hall": ["pershing-hall.png", "pershing-hall.webp"],
};

/** Runs in the page before any script: keep every LCP candidate. */
const LCP_INIT = `
  window.__lcpEntries = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const el = entry.element;
      window.__lcpEntries.push({
        startTime: entry.startTime,
        renderTime: entry.renderTime,
        loadTime: entry.loadTime,
        size: entry.size,
        id: entry.id || null,
        url: entry.url || null,
        element: el
          ? {
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              className: typeof el.className === "string" ? el.className : null,
              src: el.currentSrc || el.src || null,
            }
          : null,
      });
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });
`;

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

/** Grab a free TCP port from the kernel, then hand it to vite preview. */
function getFreePort() {
  return new Promise((resolvePromise, reject) => {
    const srv = net.createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolvePromise(port));
    });
  });
}

/** Start `vite preview` on the given port and wait until it answers. */
async function startPreview(port) {
  const child = spawn(
    "npx",
    ["vite", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) return child;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.error(`vite preview did not come up on :${port}\n${output}`);
  child.kill();
  process.exit(1);
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** One throttled measurement: fresh context, cold cache, Fast 4G. */
async function measureRun(browser, viewport, port) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.addInitScript(LCP_INIT);

  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: NETWORK.latencyMs,
    downloadThroughput: NETWORK.downloadThroughput,
    uploadThroughput: NETWORK.uploadThroughput,
  });

  const transfers = new Map(); // requestId -> { url, encodedDataLength }
  let failedRequests = 0;
  cdp.on("Network.responseReceived", (p) => {
    transfers.set(p.requestId, { url: p.response.url, encodedDataLength: 0 });
  });
  cdp.on("Network.loadingFinished", (p) => {
    const t = transfers.get(p.requestId);
    if (t) t.encodedDataLength = p.encodedDataLength ?? 0;
  });
  cdp.on("Network.loadingFailed", () => {
    failedRequests += 1;
  });

  try {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "load", timeout: 60_000 });
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
    await page.waitForTimeout(SETTLE_MS);

    const entries = await page.evaluate(() => window.__lcpEntries || []);
    const lcp = entries.at(-1) ?? null;

    const finished = [...transfers.values()];
    const totalBytes = finished.reduce((sum, t) => sum + t.encodedDataLength, 0);
    const artBytes = {};
    const artUrls = {};
    for (const [key, names] of Object.entries(ART_KEYS)) {
      const hits = finished.filter((t) => names.some((n) => t.url.endsWith(n)));
      artBytes[key] = hits.reduce((sum, t) => sum + t.encodedDataLength, 0);
      artUrls[key] = hits.map((t) => t.url);
    }

    return {
      totalBytes,
      artBytes,
      artUrls,
      totalArtBytes: Object.values(artBytes).reduce((a, b) => a + b, 0),
      requests: finished.length,
      failedRequests,
      lcpMs: lcp ? Math.round(lcp.startTime * 10) / 10 : null,
      lcpElement: lcp?.element ?? null,
    };
  } finally {
    await context.close();
  }
}

/** Full-page screenshot for the pixel baseline: no throttle, but every image
 * is scrolled into the load distance and decoded before the capture.
 *
 * Runs in its own browser (a stalled capture once hung the measurement
 * browser) with prefers-reduced-motion: reduce and animations disabled, so
 * the capture is deterministic: the Austin section's note bubble stops
 * rotating, and infinite animations freeze at their initial state. The
 * capture also awaits document.fonts.ready, so text is never caught
 * mid webfont swap (a fallback-font render changes text wrap and
 * antialiasing without changing layout heights). Applied
 * identically to the before and after screenshots, so the pixel diff stays
 * a fair comparison. Every step has a hard timeout — a stall must fail
 * loudly, not hang the harness. */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms} ms`)), ms)),
  ]);
}

async function screenshotPage(browser, viewport, port, path) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await context.newPage();
  try {
    await withTimeout(page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle", timeout: 60_000 }), 70_000, "goto");
    await withTimeout(
      page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
        window.scrollTo(0, 0);
      }),
      30_000,
      "scroll walk",
    );
    await withTimeout(
      page.evaluate(() =>
        Promise.all(Array.from(document.images).map((img) => img.decode().catch(() => {}))),
      ),
      30_000,
      "image decode",
    );
    await withTimeout(
      page.evaluate(() => document.fonts.ready.then(() => document.fonts.status)),
      30_000,
      "font ready",
    );
    await page.waitForTimeout(300);
    await withTimeout(page.screenshot({ path, fullPage: true, animations: "disabled" }), 120_000, "screenshot");
  } finally {
    await context.close();
  }
}

async function main() {
  await run("npm", ["run", "build"]);
  const port = await getFreePort();
  const preview = await startPreview(port);

  try {
    const result = {
      generatedAt: new Date().toISOString(),
      tool: "tools/check-weight.mjs",
      network: NETWORK,
      browser: "playwright chromium, fresh context per run, cache disabled (CDP Network.setCacheDisabled)",
      deviceScaleFactor: 1,
      runsPerWidth: RUNS,
      settleMsAfterLoad: SETTLE_MS,
      note: "totalBytes is the sum of encodedDataLength over every finished response; art bytes are matched on the response URL's file name. Screenshots for the pixel baseline were taken in a separate, unthrottled pass with prefers-reduced-motion: reduce, every image decoded, and animations disabled (deterministic state; identical settings for before and after).",
      viewports: {},
    };

    for (const viewport of VIEWPORTS) {
      const { width, height } = viewport;
      const browser = await chromium.launch();
      const runs = [];
      try {
        for (let i = 0; i < RUNS; i++) {
          const r = await measureRun(browser, viewport, port);
          r.run = i + 1;
          runs.push(r);
          console.log(
            `${width}x${height} run ${i + 1}/${RUNS}: total ${r.totalBytes} B, art ${r.totalArtBytes} B, LCP ${r.lcpMs} ms`,
          );
        }

        const shotBrowser = await chromium.launch();
        try {
          const shotPath = resolve(shotsDir, `${stem.split("/").pop()}-${width}.png`);
          await screenshotPage(shotBrowser, viewport, port, shotPath);
        } finally {
          await shotBrowser.close();
        }

        const sorted = [...runs].sort((a, b) => a.lcpMs - b.lcpMs);
        result.viewports[`${width}x${height}`] = {
          runs,
          median: {
            isMedian: true,
            note: "median of the runs above; each figure is the median of its own samples, and lcpElement comes from the run whose LCP is the median",
            totalBytes: median(runs.map((r) => r.totalBytes)),
            totalArtBytes: median(runs.map((r) => r.totalArtBytes)),
            artBytes: Object.fromEntries(
              Object.keys(ART_KEYS).map((k) => [k, median(runs.map((r) => r.artBytes[k]))]),
            ),
            lcpMs: median(runs.map((r) => r.lcpMs)),
            lcpElement: sorted[Math.floor(sorted.length / 2)]?.lcpElement ?? null,
          },
          screenshot: `docs/checks/${stem.split("/").pop()}-${width}.png`,
        };
      } finally {
        await browser.close();
      }
    }

    writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
    console.log(`wrote ${outPath}`);
  } finally {
    preview.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
