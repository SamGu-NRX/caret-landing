/* The hero. The claim on the left, the working product on the right.
 *
 * At 1100px and up it is two columns on the page rail: the headline,
 * standfirst, actions and the "What else is open" switch on the left, and a Mac
 * desktop with one browser window on the right, close enough to the headline
 * that the composer is in the first screen. Below 1100px it stacks: copy, the
 * desktop, then the switch, so a phone reaches the demo before the control.
 */

import { useRef, useState } from "react";
import { ArrowUpRight, CalendarIcon, CurlyArrow, FlightIcon, ReviseIcon } from "../Icons";
import { CaretCluster } from "../caret-ui/CaretUI";
import type { Pin } from "../caret-ui/CaretUI";
import { BrowserWindow, ConceptChip, DesktopStage } from "../mac/Mac";
import { CONTEXTS, ReplyComposer } from "./ReplyComposer";
import type { ContextId } from "./ReplyComposer";
import { REPO_URL } from "../../lib/site";

/* The native strip uses icons; the menu and accessible names retain full titles. */
export const PINS: Pin[] = [
  { id: "book-flight", title: "Flight", full: "Book flight", slot: 1, icon: <FlightIcon /> },
  { id: "book-calendar-link", title: "Calendar", full: "Calendar link", slot: 2, icon: <CalendarIcon /> },
  { id: "revise", title: "Revise", full: "Revise draft", slot: 3, icon: <ReviseIcon /> },
];

const ANCHORS: Record<string, string> = {
  "book-flight": "#flight",
  "book-calendar-link": "#calendar",
  revise: "#revise",
};

function goTo(id: string) {
  const anchor = ANCHORS[id];
  if (!anchor) return;
  document.querySelector(anchor)?.scrollIntoView({ block: "start" });
}

export function Hero() {
  const [context, setContext] = useState<ContextId>("travel");
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const preset = CONTEXTS.find((c) => c.id === context) ?? CONTEXTS[0];

  return (
    <section className="hero section-shell">
      <div className="page-container hero-grid">
        <div className="hero-copy">
          {/* Each line is its own block, so the headline always breaks in the
              same three places. The spaces keep the text a sentence for a
              screen reader. */}
          <h1 className="hero-title">
            <span>An assistant</span> <span>the size of</span>{" "}
            <span>
              <em className="editorial-accent">an asterisk.</em>
            </span>
          </h1>

          <p className="hero-standfirst">
            A native Mac assistant that lives beside your cursor. It finishes the sentence you
            are typing, or offers the next step from the thread you are reading. Tab accepts,
            and nothing runs before you have seen what it will do.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="button"
              onClick={() => {
                stageRef.current?.scrollIntoView({ block: "center" });
                stageRef.current?.querySelector("textarea")?.focus();
              }}
            >
              Try the demo
            </button>
            <a className="text-link" href={REPO_URL} target="_blank" rel="noreferrer">
              See the code
              <ArrowUpRight />
            </a>
          </div>
        </div>

        <div className="hero-demo">
          <div className="hero-stage" ref={stageRef}>
            <DesktopStage menuBar hero>
              <ConceptChip />
              <BrowserWindow
                className="hero-browser"
                tabs={preset.tabs}
                activeTab={preset.activeTab}
                url={preset.url}
              >
                <div className="hero-thread">
                  <p className="hero-thread__subject">Next week?</p>
                  <p className="hero-thread__from">
                    Alex Rivera &lt;alex@example.com&gt;
                    <span>Sat, Sep 19</span>
                  </p>
                  <p className="hero-thread__body">
                    Hey — are you around next week? Let me know what makes sense on your end.
                  </p>
                  <ReplyComposer
                    context={preset}
                    resetKey={run}
                    onFirstInput={() => setPlaying(false)}
                  />
                </div>
              </BrowserWindow>

              {/* kgu.one's arrival rules (its PR #1) select .hero-try__note and
                  .hero-try__arrow by name. Keep both. */}
              {playing ? (
                <span className="hero-try" aria-hidden>
                  <span className="hero-try__note">Type in here. Tab takes the grey text.</span>
                  <CurlyArrow className="hero-try__arrow" />
                </span>
              ) : null}

              {/* The cluster floats beside the composer the way the app's panel
                  floats beside a field: it is not inside the window. */}
              <span className="hero-cluster">
                <CaretCluster pins={PINS} onRun={goTo} />
              </span>
            </DesktopStage>
          </div>

          <p className="hero-caption">
            A concept demo. The completions are samples written into this page, not a live
            model. Type something it does not know and it stays quiet.
          </p>
        </div>

        {/* The context control. This is the demonstration, so it is a real
            control rather than a claim in a paragraph, and it is the hero's
            only control. */}
        <div className="hero-context">
          <fieldset className="hero-context__set">
            <legend className="section-label hero-context__legend">What else is open</legend>
            <div className="hero-context__track">
              {CONTEXTS.map((c) => (
                <label key={c.id} className="hero-context__opt" data-on={c.id === context || undefined}>
                  <input
                    type="radio"
                    name="hero-context"
                    value={c.id}
                    checked={c.id === context}
                    onChange={() => {
                      setContext(c.id);
                      setPlaying(false);
                    }}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>

          <p className="hero-context__note">{preset.note}</p>

          <button
            type="button"
            className="text-link hero-replay"
            onClick={() => {
              setRun((r) => r + 1);
              setPlaying(true);
            }}
          >
            {playing ? "Replay" : "Start over"}
          </button>
        </div>
      </div>
    </section>
  );
}
