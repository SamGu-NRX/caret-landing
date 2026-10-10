import { chromium } from "playwright";

const b = await chromium.launch();
for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  const p = await b.newPage({ viewport });
  await p.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  const shifts = await p.evaluate(() => {
    return new Promise((resolve) => {
      const entries = [];
      const obs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.hadRecentInput) continue;
          entries.push({
            value: e.value,
            time: Math.round(e.startTime),
            sources: e.sources?.map((s) => {
              const n = s.node;
              const desc = n
                ? n.nodeName +
                  (n.className && typeof n.className === "string" ? "." + n.className.split(" ").join(".") : "")
                : "(none)";
              return {
                node: desc,
                from: s.previousRect ? [s.previousRect.x, s.previousRect.y] : null,
                to: s.currentRect ? [s.currentRect.x, s.currentRect.y] : null,
              };
            }),
          });
        }
      });
      obs.observe({ type: "layout-shift", buffered: true });
      setTimeout(() => resolve(entries), 6000);
    });
  });
  console.log("== viewport", viewport.width, "==");
  for (const s of shifts) console.log(JSON.stringify(s));
  await p.close();
}
await b.close();
