/* Where it was built, and exactly what is built.
 *
 * The scene is an illustration, not a photograph of a room. The status lists
 * below it are the part that has to be right: they say what the repository does
 * today, and they match docs/input-pipeline.md rather than a wish.
 */

import { useEffect, useState } from "react";

const HALL = `${import.meta.env.BASE_URL}art/pershing-hall.png`;
const HALL_ALT =
  "Pixel-art illustration of a music hall in Austin used as a one-day hackathon space: a long wooden table of open laptops seen from behind, a small stage with a drum kit under warm bulbs, late orange light through tall windows.";

/* Short notes about the build, in the builders' own plain words. Nothing here
   is a quote from anywhere private, and nothing claims a measurement. */
const NOTES = [
  "One asterisk. No second window to go and open.",
  "Tab accepts. Nothing sends by itself.",
  "The booking stops at the payment page.",
  "Sample data all the way down, for now.",
];

export function Austin() {
  const [note, setNote] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setNote((n) => (n + 1) % NOTES.length), 5200);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <section id="austin" className="section austin section-shell">
      <div className="page-container">
        <h2 className="editorial-title">Built at a hackathon in Austin.</h2>
        <p className="editorial-standfirst austin__lede">
          One day, one room, three workflows.
        </p>

        <div className="austin__scene">
          <img className="austin__art" src={HALL} alt={HALL_ALT} loading="lazy" />
          <span className="austin__glow" aria-hidden />
          <div className="austin__sparks" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <i
                key={i}
                style={{ left: `${9 + i * 9}%`, top: `${28 + ((i * 17) % 48)}%`, animationDelay: `${i * -1.7}s` }}
              />
            ))}
          </div>
          <p className="austin__bubble" key={note} role="status" aria-live={reduced ? "polite" : "off"}>
            {NOTES[note]}
          </p>
          <span className="austin__where">Austin, Texas</span>
        </div>

        <div className="austin__status">
          <p className="austin__status-lede">
            Every demo on this page runs on sample data. Nothing here sends, books, holds or
            touches your Mac.
          </p>
          <div className="austin__lists">
            <div>
              <h3>Running today</h3>
              <ul>
                <li>The asterisk beside supported fields and selections</li>
                <li>The pinned strip, the action menu, and their shortcuts</li>
                <li>Accessibility reconnection</li>
                <li>Screenpipe startup and recent-context retrieval</li>
                <li>The planner, holding and confirming on sample data</li>
                <li>The workflow contract the three seeds are written against</li>
              </ul>
            </div>
            <div>
              <h3>Still being wired</h3>
              <ul>
                <li>The inline writer and both judge decisions</li>
                <li>Mail, calendar, and the two executors</li>
                <li>Tab acceptance inside other apps</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
