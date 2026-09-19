/* A legend for the rest of the page, not a stats band.
 *
 * Four real interactions, all of which the visitor can carry out further down:
 * these are the keys the app actually binds today (PinnedShortcutFormatting
 * maps slots to ⌘⌥1 … ⌘⌥3, and the menu bar item opens with ⌘⌥). No numbers
 * are quoted here, because the ones worth quoting have not been measured.
 */

import { SparkleGlyph } from "../caret-ui/CaretUI";

const KEYS = [
  { key: "⇥", label: "Accepts the text in front of you" },
  { key: "⌘⌥1", label: "Runs a pinned action" },
  { key: "esc", label: "Dismisses, and changes nothing" },
  { key: "sparkle", label: "Opens the full list" },
];

export function KeyLegend() {
  return (
    <section className="legend section-shell" aria-label="What the keys do">
      <div className="page-container legend__grid">
        {KEYS.map((item) => (
          <div key={item.label} className="legend__item">
            <span className="legend__key">
              {item.key === "sparkle" ? <SparkleGlyph size={17} /> : item.key}
            </span>
            <span className="legend__label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
