/*
 * Keyboard and motion checks, run by `npm run check:site` after the per-
 * viewport checks. Every result lands in docs/checks/keyboard-motion.json;
 * failures are appended to the shared failures list.
 *
 * What is checked:
 *
 *   - The composer demo's keyboard contract (ReplyComposer.tsx): Tab belongs
 *     to Caret only while there is something to accept. With no suggestion
 *     showing, Tab moves focus out of the field to the next control; with a
 *     suggestion showing, Tab accepts it and focus stays; Escape dismisses a
 *     suggestion, and the next Tab leaves the field.
 *   - Every interactive element on the page can be reached with Tab alone and
 *     shows a visible focus indicator while focused.
 *   - With prefers-reduced-motion: reduce, document.getAnimations() reports
 *     no animation still running 1 second after load.
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const checksDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "docs", "checks");
const AREA = 'textarea[aria-label="Reply to Alex Rivera"]';
const ACCEPT = ".rc__accept";
const TABBABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Wait until the composer's suggestion button is on screen. */
async function waitForOffer(page, timeout = 10_000) {
  await page.locator(ACCEPT).first().waitFor({ state: "visible", timeout });
}

/** A fresh page of the site, with context options applied. */
async function freshPage(browser, options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  return { context, page };
}

/* Read the style properties a visible focus indicator could plausibly
   change, for one element. */
function probeStyles(elHandle) {
  return elHandle.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      boxShadow: cs.boxShadow,
      borderColor: cs.borderTopColor,
      borderWidth: cs.borderTopWidth,
      backgroundColor: cs.backgroundColor,
      textDecorationLine: cs.textDecorationLine,
      opacity: cs.opacity,
    };
  });
}

function styleDelta(focused, baseline) {
  const changed = [];
  for (const key of Object.keys(focused)) {
    if (focused[key] !== baseline[key]) changed.push(`${key}: ${baseline[key]} -> ${focused[key]}`);
  }
  return changed;
}

/* --- composer keyboard contract --------------------------------------- */

async function composerTests(browser) {
  const viewport = { width: 1440, height: 900 };
  const results = [];

  /* No suggestion showing: Tab does what Tab always does and leaves the
     field. Clicking the field part-way through the autoplay takes over and
     stops the demo before any offer can appear. */
  {
    const { context, page } = await freshPage(browser, { viewport });
    const area = page.locator(AREA);
    await area.click();
    await page.waitForTimeout(500); /* comfortably past the 350ms offer delay */
    const offered = await page.locator(ACCEPT).count();
    await area.press("Tab");
    const after = await page.evaluate(() => document.activeElement?.tagName ?? "none");
    results.push({
      name: "composer: Tab with no suggestion leaves the field",
      pass: offered === 0 && after !== "TEXTAREA",
      detail: { acceptButtonsVisible: offered, focusAfterTab: after },
    });
    await context.close();
  }

  /* A suggestion showing: Tab accepts it and focus stays in the field. */
  {
    const { context, page } = await freshPage(browser, { viewport });
    await waitForOffer(page);
    const area = page.locator(AREA);
    const before = await area.inputValue();
    await area.focus();
    await area.press("Tab");
    await page.waitForTimeout(150);
    const after = await page.evaluate(() => document.activeElement?.tagName ?? "none");
    const value = await area.inputValue();
    const accepted = value.startsWith(before) && value.length > before.length;
    const buttonGone = (await page.locator(ACCEPT).count()) === 0;
    results.push({
      name: "composer: Tab with a suggestion showing accepts it and focus stays",
      pass: accepted && after === "TEXTAREA" && buttonGone,
      detail: { valueGrew: accepted, focusAfterTab: after, acceptButtonGone: buttonGone },
    });
    await context.close();
  }

  /* Escape dismisses a suggestion, and the next Tab leaves the field. */
  {
    const { context, page } = await freshPage(browser, { viewport });
    await waitForOffer(page);
    const area = page.locator(AREA);
    await area.focus();
    await area.press("Escape");
    await page.waitForTimeout(150);
    const dismissed = (await page.locator(ACCEPT).count()) === 0;
    await area.press("Tab");
    const after = await page.evaluate(() => document.activeElement?.tagName ?? "none");
    results.push({
      name: "composer: Escape dismisses a suggestion and the next Tab leaves the field",
      pass: dismissed && after !== "TEXTAREA",
      detail: { suggestionDismissed: dismissed, focusAfterTab: after },
    });
    await context.close();
  }

  /* A correction offer: a typed typo gets a fix proposal, Tab applies it and
     focus stays. */
  {
    const { context, page } = await freshPage(browser, { viewport });
    const area = page.locator(AREA);
    await area.click();
    /* The click may land mid-autoplay; clear whatever was typed so "teh" is
       the last word on the line, which is what a fix offer needs. */
    await area.fill("");
    await page.waitForTimeout(100);
    await page.keyboard.type("teh", { delay: 40 });
    await page.locator(ACCEPT).first().waitFor({ state: "visible", timeout: 5_000 });
    const fixLabel = await page.locator(ACCEPT).first().textContent();
    await area.press("Tab");
    await page.waitForTimeout(150);
    const value = await area.inputValue();
    const after = await page.evaluate(() => document.activeElement?.tagName ?? "none");
    const fixed = value.trimEnd().endsWith("the");
    results.push({
      name: "composer: Tab applies a correction offer and focus stays",
      pass: fixed && after === "TEXTAREA",
      detail: { offerLabel: fixLabel?.trim(), valueEndsCorrectly: fixed, focusAfterTab: after },
    });
    await context.close();
  }

  return results;
}

/* --- tab reachability and focus indicators ----------------------------- */

/*
 * The walk runs on a settled page: a fresh load, then wait until two
 * consecutive inventory snapshots agree, so the hero autoplay has finished
 * typing and the DOM is static for the whole walk. The prelude used earlier
 * (click the composer, Escape, blur) was wrong for this: Chromium keeps the
 * sequential focus navigation starting point at the last clicked element,
 * so every Tab from there skipped the header and hero controls.
 *
 * Radio inputs sharing a name are one tab stop by spec (arrow keys move
 * within the group), so focusing any member marks the whole group visited.
 */

async function tabReachabilityTests(browser) {
  const results = [];

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const { context, page } = await freshPage(browser, { viewport });

    /* In-page: the visible, tabbable elements, with a label and, for
       radios, the group name. Playwright passes the selector in. */
    const collect = (selector) => {
      const visible = Array.from(document.querySelectorAll(selector)).filter(
        (el) =>
          !el.closest('[aria-hidden="true"]') &&
          el.getClientRects().length > 0 &&
          el.offsetWidth > 0 &&
          el.offsetHeight > 0,
      );
      return visible.map((el, i) => ({
        index: i,
        label: (el.getAttribute("aria-label") ?? el.textContent ?? el.tagName).trim().slice(0, 60),
        radioName: el.tagName === "INPUT" && el.type === "radio" ? el.name : null,
      }));
    };

    /* Wait for the DOM to settle: consecutive snapshots must agree. */
    let settled = false;
    let prev = null;
    for (let i = 0; i < 20; i++) {
      const snap = await page.evaluate(collect, TABBABLE);
      if (prev && JSON.stringify(snap) === JSON.stringify(prev)) {
        settled = true;
        break;
      }
      prev = snap;
      await page.waitForTimeout(500);
    }
    const inventory = prev ?? [];
    if (!settled) {
      results.push({
        name: `keyboard (${viewport.width}px): page settled for the tab walk`,
        pass: false,
        detail: { note: "DOM never stabilized; inventory is from the last snapshot", inventory: inventory.map((e) => e.label) },
      });
      await context.close();
      continue;
    }

    /* Unfocused style baselines, per element, while nothing is focused. */
    const baselines = await page.evaluate((selector) => {
      const probe = (el) => {
        const cs = getComputedStyle(el);
        return {
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
          boxShadow: cs.boxShadow,
          backgroundColor: cs.backgroundColor,
          color: cs.color,
        };
      };
      const visible = Array.from(document.querySelectorAll(selector)).filter(
        (el) =>
          !el.closest('[aria-hidden="true"]') &&
          el.getClientRects().length > 0 &&
          el.offsetWidth > 0 &&
          el.offsetHeight > 0,
      );
      return visible.map(probe);
    }, TABBABLE);

    /* Walk the tab order from the top of the document. */
    const walk = [];
    const visited = new Set();
    let reachedEnd = false;
    for (let step = 0; step < inventory.length + 5; step++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(30);
      const stepInfo = await page.evaluate((selector) => {
        const probe = (el) => {
          const cs = getComputedStyle(el);
          return {
            outlineStyle: cs.outlineStyle,
            outlineWidth: cs.outlineWidth,
            boxShadow: cs.boxShadow,
            backgroundColor: cs.backgroundColor,
            color: cs.color,
          };
        };
        const el = document.activeElement;
        if (!el || el === document.body) return { atBody: true };
        const visible = Array.from(document.querySelectorAll(selector)).filter(
          (c) =>
            !c.closest('[aria-hidden="true"]') &&
            c.getClientRects().length > 0 &&
            c.offsetWidth > 0 &&
            c.offsetHeight > 0,
        );
        const idx = visible.indexOf(el);
        const radioName = el.tagName === "INPUT" && el.type === "radio" ? el.name : null;
        return {
          atBody: false,
          idx,
          radioName,
          label: (el.getAttribute("aria-label") ?? el.textContent ?? el.tagName).trim().slice(0, 60),
          styles: probe(el),
        };
      }, TABBABLE);
      if (stepInfo.atBody) {
        reachedEnd = true;
        break;
      }
      walk.push(stepInfo);
      if (stepInfo.idx >= 0) {
        visited.add(stepInfo.idx);
        if (stepInfo.radioName) {
          /* Every radio in the same group is one tab stop away by arrow key. */
          for (const entry of inventory) {
            if (entry.radioName === stepInfo.radioName) visited.add(entry.index);
          }
        }
      }
    }

    const missing = inventory
      .filter((entry) => !visited.has(entry.index))
      .map((entry) => entry.label);
    results.push({
      name: `keyboard (${viewport.width}px): every interactive element is reachable with Tab alone`,
      pass: reachedEnd && missing.length === 0,
      detail: {
        interactiveElements: inventory.length,
        tabStopsObserved: visited.size,
        walkedToEnd: reachedEnd,
        notReached: missing,
        order: walk.map((w) => w.label),
      },
    });

    /* While focused, each control must show a visible focus indicator:
       some tracked style property must differ from the unfocused baseline. */
    const noIndicator = [];
    for (const stop of walk) {
      if (stop.idx < 0) continue;
      const baseline = baselines[stop.idx];
      if (!baseline) {
        noIndicator.push(stop.label + " (no baseline)");
        continue;
      }
      const changed = Object.keys(stop.styles).filter((k) => stop.styles[k] !== baseline[k]);
      const outlinePresent =
        stop.styles.outlineStyle !== "none" &&
        stop.styles.outlineWidth !== "0px" &&
        stop.styles.outlineStyle !== baseline.outlineStyle;
      if (!outlinePresent && changed.length === 0) noIndicator.push(stop.label);
    }
    results.push({
      name: `keyboard (${viewport.width}px): every focused control shows a visible focus indicator`,
      pass: noIndicator.length === 0,
      detail: {
        checked: walk.length,
        withoutIndicator: noIndicator,
        sampleDeltas: walk.slice(0, 3).map((w) => ({
          label: w.label,
          changed: Object.keys(w.styles).filter((k) => w.styles[k] !== (baselines[w.idx] ?? {})[k]),
        })),
      },
    });

    await context.close();
  }

  return results;
}

/* --- reduced motion ---------------------------------------------------- */

async function reducedMotionTest(browser) {
  const { context, page } = await freshPage(browser, {
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await page.waitForLoadState("load");
  await page.waitForTimeout(1000);
  const running = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === "running")
      .map((a) => ({
        kind: a.constructor.name,
        target: a.effect?.target
          ? a.effect.target.nodeName +
            (a.effect.target.className ? "." + String(a.effect.target.className).split(" ").join(".") : "")
          : "(none)",
      })),
  );
  await context.close();
  return [
    {
      name: "motion: no animation still running 1s after load under prefers-reduced-motion",
      pass: running.length === 0,
      detail: { runningAnimations: running },
    },
  ];
}

/* --- entry ------------------------------------------------------------- */

export async function checkKeyboardAndMotion(failures) {
  mkdirSync(checksDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    const results = [
      ...(await composerTests(browser)),
      ...(await tabReachabilityTests(browser)),
      ...(await reducedMotionTest(browser)),
    ];
    writeFileSync(resolve(checksDir, "keyboard-motion.json"), JSON.stringify({ results }, null, 2) + "\n");
    for (const r of results) {
      if (!r.pass) failures.push({ check: "keyboard-motion", name: r.name, detail: r.detail });
    }
    return results;
  } finally {
    await browser.close();
  }
}
