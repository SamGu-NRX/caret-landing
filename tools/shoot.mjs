/* Capture screenshots of the running dev server through Chrome's DevTools
 * protocol. `--screenshot` alone cannot scroll, and the workflow stages only
 * play once they are in view, so the evidence crops have to be taken after a
 * real scroll and a wait.
 *
 * Usage: node tools/shoot.mjs <url> <out-dir> <width>x<height> [sel::name ...]
 * With no selectors it writes one first-viewport shot. Each `sel::name` scrolls
 * that element to the middle of the window, waits for the stage there to finish
 * playing itself, and shoots the viewport. Shooting the viewport rather than a
 * clip of the element matters: a clip taller than the window captures regions
 * the page has not laid out against a real scroll position, which comes back
 * with the sticky header stamped into the middle of it.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [url, outDir, size, ...selectors] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
const port = 9400 + (process.pid % 300);

const chrome = spawn(CHROME, [
  "--headless", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=/tmp/shoot-${port}`,
  `--window-size=${w},${h}`,
  "about:blank",
], { stdio: "ignore" });

const get = async (path) => {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}${path}`);
      if (r.ok) return r.json();
    } catch {}
    await sleep(250);
  }
  throw new Error(`devtools endpoint never answered ${path}`);
};

const targets = (await get("/json/list")).filter((t) => t.type === "page");
if (!targets.length) throw new Error("chrome exposed no page target");
const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { ok, no } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? no(new Error(JSON.stringify(m.error))) : ok(m.result);
  }
};
const send = (method, params = {}) =>
  new Promise((ok, no) => { pending.set(++id, { ok, no }); ws.send(JSON.stringify({ id, method, params })); });

const evaluate = async (expression) =>
  (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;

await send("Page.enable");
await send("Page.navigate", { url });
await sleep(4000);
const title = await evaluate("document.title");
if (!title) throw new Error(`page did not load: ${url}`);
await mkdir(outDir, { recursive: true });

const shoot = async (name, clip) => {
  const { data } = await send("Page.captureScreenshot", clip ? { clip } : {});
  await writeFile(`${outDir}/${name}.png`, Buffer.from(data, "base64"));
  console.log(`${name}.png`);
};

if (!selectors.length) await shoot(`hero-${w}`);

for (const sel of selectors) {
  const [css, name] = sel.split("::");
  const found = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(css)});
    if (!el) return false;
    el.scrollIntoView({ block: "center", behavior: "instant" });
    return true;
  })()`);
  if (!found) { console.error(`missing ${css}`); continue; }
  await sleep(4500); // let the stage finish its own script
  await shoot(name);
}

ws.close();
chrome.kill();
