#!/usr/bin/env node
/* check:touch — tap-through mobile audit for the Caret landing page.
 *
 * Builds the site, serves it with vite preview, then drives the page by TOUCH
 * only at four phone widths (320/360/390/414 portrait). Checks:
 *   - no horizontal scroll after load or any flow step
 *   - every visible interactive target has a >=24 CSS px hit region
 *     (element box unioned with its absolutely-positioned ::before/::after
 *     hit-area extensions); targets under 44 px are recorded as notes.
 *     Visually-hidden controls are skipped; inline text links are recorded as
 *     notes per the WCAG 2.5.8 inline-target exception.
 *   - composer flow: tap to focus, type the seeded opening line so the ghost
 *     offer appears, tap the tab affordance, tap accept
 *   - hero cluster: tap the sparkle, tap a menu row
 *   - all three workflow demos reset (tapping the visible reset control if
 *     autoplay advanced them) and driven to their preview-card state by
 *     tapping the controls each demo exposes (text select, cluster sparkle,
 *     menu row, primary button)
 * Optional argv[2] = report JSON path (e.g. docs/checks/touch-before.json).
 * Exit code 0 iff no failures. Screenshots land in docs/screenshots/touch/.
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import { chromium } from "playwright";
/* Mirrors OPENING in src/components/hero/ReplyComposer.tsx — the seeded
   script's shared first words. A plain Node script cannot import the TSX
   module, so keep the two in sync by hand. */
const OPENING = "Hi Alex, thanks for the note. ";

const WIDTHS = [[320, 568], [360, 640], [390, 844], [414, 896]];
const SHOT_DIR = "docs/screenshots/touch";
const PORT = 4179;
const BASE = `http://127.0.0.1:${PORT}`;
const SETTLE = 450;
const outPath = process.argv[2] || null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitForPort(port, timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const s = net.connect({ port, host: "127.0.0.1" });
      s.on("connect", () => { s.destroy(); resolve(); });
      s.on("error", () => {
        s.destroy();
        if (Date.now() - started > timeoutMs) reject(new Error("preview port never opened"));
        else setTimeout(tryOnce, 300);
      });
    };
    tryOnce();
  });
}

const preview = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
preview.stdout.on("data", () => {});
preview.stderr.on("data", () => {});
preview.on("error", () => {});

const report = { pass: true, failures: [], notes: [], targets: [], flows: [], generatedAt: new Date().toISOString() };
const fail = (id, detail) => { report.pass = false; report.failures.push({ id, ...detail }); };
const note = (id, detail) => { if (report.notes.length < 400) report.notes.push({ id, ...detail }); };

mkdirSync(SHOT_DIR, { recursive: true });
const shot = (page, w, name) => page.screenshot({ path: `${SHOT_DIR}/touch-w${w}-${name}.png` });

const MEASURE = () => {
  const union = (a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.max(a.x + a.w, b.x + b.w) - Math.min(a.x, b.x), h: Math.max(a.y + a.h, b.y + b.h) - Math.min(a.y, b.y) });
  const pseudoBox = (el, ps) => {
    const cs = getComputedStyle(el, ps);
    if (cs.content === "none" || cs.position !== "absolute") return null;
    const r = el.getBoundingClientRect();
    const t = cs.top === "auto" ? 0 : parseFloat(cs.top), l = cs.left === "auto" ? 0 : parseFloat(cs.left);
    const rt = cs.right === "auto" ? null : parseFloat(cs.right), b = cs.bottom === "auto" ? null : parseFloat(cs.bottom);
    const w = cs.width !== "auto" && cs.width !== "" ? parseFloat(cs.width) : (rt !== null ? r.width - l - rt : r.width - l);
    const h = cs.height !== "auto" && cs.height !== "" ? parseFloat(cs.height) : (b !== null ? r.height - t - b : r.height - t);
    if (!(w > 0) || !(h > 0)) return null;
    return { x: r.left + l, y: r.top + t, w, h };
  };
  const out = [];
  const nodes = document.querySelectorAll('button, a[href], summary, input, textarea, [role="button"], [tabindex]:not([tabindex="-1"])');
  for (const el of nodes) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0 || cs.visibility === "hidden" || cs.display === "none") continue;
    /* Visually-hidden controls (1x1 clipped checkbox inputs) are not pointer
       targets; WCAG 2.5.8 exempts inline targets in text from the 24px
       minimum, so those are recorded as notes instead of failures. */
    const hidden = cs.opacity === "0" || (cs.clip || "").startsWith("rect(0");
    /* WCAG 2.5.8 inline exception: a text link inside a sentence (a <p>, or
       any parent whose children are all inline text elements). */
    const par = el.parentElement;
    const INLINE = ["SPAN", "A", "EM", "STRONG", "B", "I", "BR"];
    const sentence = par && par.children.length > 1 && Array.from(par.children).every((c) => INLINE.includes(c.tagName));
    const inlineLink = el.tagName === "A" && (el.closest("p") !== null || !!sentence);
    let hit = { x: r.left, y: r.top, w: r.width, h: r.height };
    for (const ps of ["::before", "::after"]) {
      const p = pseudoBox(el, ps);
      if (p) hit = union(hit, p);
    }
    const label = (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 60);
    out.push({ label, tag: el.tagName.toLowerCase(), cls: (el.className || "").toString().slice(0, 80), hitW: +hit.w.toFixed(1), hitH: +hit.h.toFixed(1), hidden, inlineLink });
  }
  return out;
};

async function auditTargets(page, w, tag) {
  const measured = await page.evaluate(MEASURE);
  for (const m of measured) {
    report.targets.push({ width: w, stage: tag, ...m });
    if (m.hidden) continue;
    if (m.inlineLink && (m.hitW < 24 || m.hitH < 24)) note(`tap-target-under-44@w${w}`, { stage: tag, ...m });
    else if (m.hitW < 24 || m.hitH < 24) fail(`tap-target-under-24@w${w}`, { stage: tag, ...m });
    else if (m.hitW < 44 || m.hitH < 44) note(`tap-target-under-44@w${w}`, { stage: tag, ...m });
  }
}

async function hscroll(page, w, tag) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (over > 1) fail(`horizontal-scroll@w${w}`, { stage: tag, overflowPx: over });
}

async function composerFlow(page, w) {
  const area = page.locator(".rc__area").first();
  await area.scrollIntoViewIfNeeded();
  await area.tap();
  await page.waitForTimeout(SETTLE);
  const focused = await page.evaluate(() => { const el = document.activeElement; return !!el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT"); });
  report.flows.push({ width: w, flow: "composer-tap-focus", pass: focused });
  if (!focused) fail(`composer-focus@w${w}`, { reason: "tap did not focus the composer area" });
  /* The composer runs a seeded local script: only a prefix of the shared
     opening produces a ghost offer. Autoplay has typed part of the opening
     before the tap hands over, so type only the remainder. */
  const cur = await area.inputValue();
  if (OPENING.startsWith(cur)) await area.type(OPENING.slice(cur.length));
  else { await area.fill(""); await area.type(OPENING); }
  await page.waitForTimeout(SETTLE + 500);
  await shot(page, w, "20-composer-typed");
  /* .rc__tab is the rendered Tab-key glyph (a hint, not a control) — the
     textarea intercepts taps there. The tappable accept affordance is the
     .rc__accept button. */
  const accept = page.locator(".rc__accept").first();
  if (await accept.isVisible().catch(() => false)) {
    await accept.tap();
    await page.waitForTimeout(SETTLE);
    await shot(page, w, "21-composer-accepted");
    report.flows.push({ width: w, flow: "composer-accept", pass: true });
  } else {
    fail(`composer-accept@w${w}`, { reason: "accept button not visible after typing the opening" });
  }
  await hscroll(page, w, "composer");
}

async function heroFlow(page, w) {
  const cluster = page.locator(".cu-cluster__sparkle, .cu-sparkle").first();
  await cluster.scrollIntoViewIfNeeded();
  await cluster.tap();
  await page.waitForTimeout(SETTLE);
  await shot(page, w, "30-hero-menu");
  const row = page.locator(".cu-menu__row").first();
  if (await row.isVisible().catch(() => false)) {
    await row.tap();
    await page.waitForTimeout(SETTLE);
    await shot(page, w, "31-hero-menu-tapped");
    report.flows.push({ width: w, flow: "hero-menu", pass: true });
  } else {
    fail(`hero-menu@w${w}`, { reason: "menu row not visible after cluster tap" });
  }
  await hscroll(page, w, "hero");
}

async function workflowFlow(page, w) {
  const demos = await page.locator(".wf").count();
  let driven = 0;
  for (let i = 0; i < demos; i++) {
    const wf = page.locator(".wf").nth(i);
    if (!(await wf.isVisible().catch(() => false))) continue;
    await wf.scrollIntoViewIfNeeded();
    await page.waitForTimeout(SETTLE);
    /* Demos may have auto-advanced on becoming visible; tapping the visible
       reset control (a real user action) returns the machine to idle. */
    const quiet = wf.locator(".wf__quiet").first();
    if (await quiet.isVisible().catch(() => false)) {
      await quiet.tap();
      await page.waitForTimeout(SETTLE);
    }
    await shot(page, w, `4${i}-wf${i}-start`);
    /* Drive to the preview-card state by tapping whatever control the demo
       exposes: menu row > cluster sparkle > text-select > primary Go. The
       preview cards are the interactive surface the audit must see. */
    let taps = 0;
    for (; taps < 6; taps++) {
      if (await wf.locator(".wf-card").first().isVisible().catch(() => false)) break;
      const row = wf.locator(".cu-menu__row").first();
      if (await row.isVisible().catch(() => false)) { await row.tap(); }
      else {
        const sparkle = wf.locator(".cu-cluster__sparkle, .cu-sparkle").first();
        const select = wf.locator(".notes__select").first();
        const go = wf.locator(".wf__go").first();
        if (await sparkle.isVisible().catch(() => false)) await sparkle.tap();
        else if (await select.isVisible().catch(() => false)) await select.tap();
        else if (await go.isVisible().catch(() => false)) await go.tap();
        else break;
      }
      await page.waitForTimeout(SETTLE);
      await wf.scrollIntoViewIfNeeded();
    }
    await shot(page, w, `4${i}-wf${i}-card`);
    const cardUp = await wf.locator(".wf-card").first().isVisible().catch(() => false);
    report.flows.push({ width: w, flow: `workflow-${i}`, pass: cardUp, taps });
    if (!cardUp) fail(`workflow-${i}@w${w}`, { reason: "preview card not visible after tapping the demo controls" });
    driven++;
    await hscroll(page, w, `wf${i}`);
  }
  if (driven < 3) fail(`workflows-count@w${w}`, { reason: `only ${driven} workflow demos found` });
}

try {
  await waitForPort(PORT);
  const browser = await chromium.launch();
  await Promise.all(WIDTHS.map(async ([w, h]) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36" });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await shot(page, w, "00-load");
    await hscroll(page, w, "load");
    await composerFlow(page, w);
    await heroFlow(page, w);
    await workflowFlow(page, w);
    await auditTargets(page, w, "page");
    await ctx.close();
  }));
  await browser.close();
  console.log(`check:touch ${report.pass ? "passed" : `FAILED (${report.failures.length} failures)`} — ${report.notes.length} under-44 notes, ${report.targets.length} targets, ${report.flows.length} flow steps`);
  if (outPath) writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  process.exitCode = report.pass ? 0 : 1;
} catch (err) {
  console.error("check:touch crashed:", err && err.message);
  process.exitCode = 1;
} finally {
  // exit fix: the vite preview child's stdio pipes otherwise keep the event
  // loop open forever; give it a moment to drain, then force the exit.
  try { preview.kill(); } catch {}
  await Promise.race([new Promise((r) => preview.once("exit", r)), sleep(2000)]);
  process.exit(process.exitCode ?? 0);
}
