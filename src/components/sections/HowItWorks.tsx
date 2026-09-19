/* The loop, as four numbered steps against one sticky desktop.
 *
 * The pacing is Andrew's: tall steps on the left, a stage pinned on the right
 * that crossfades one frame per step, activation by IntersectionObserver rather
 * than by scroll maths. Below 900px the stage is dropped and each step carries
 * its own frame inline, so nothing hides behind a breakpoint.
 *
 * The parallax is one custom property written on the section during scroll. The
 * wallpaper moves further than the windows, which is the whole trick.
 */

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { SparkleGlyph } from "../caret-ui/CaretUI";
import { CaretCluster } from "../caret-ui/CaretUI";
import { BrowserWindow, DesktopStage } from "../mac/Mac";
import { PINS } from "../hero/Hero";

type Step = {
  n: string;
  title: string;
  body: string;
  frame: ReactNode;
};

/** The Gmail window every frame is built on, so the scene never restarts. */
function FrameWindow({ children }: { children?: ReactNode }) {
  return (
    <BrowserWindow
      className="how-browser"
      tabs={["Next week?", "AUS to DFW", "Deep Ellum"]}
      activeTab={0}
      url="mail.google.com"
      label="A browser window showing a mail thread from Alex Rivera with a reply open"
    >
      <div className="how-thread">
        <p className="how-thread__subject">Next week?</p>
        <p className="how-thread__body">
          Hey — are you around next week? Let me know what makes sense on your end.
        </p>
        <div className="how-thread__reply">
          Hi Alex, thanks for the note.{children}
        </div>
      </div>
    </BrowserWindow>
  );
}

function Frame({ children, chips }: { children?: ReactNode; chips?: ReactNode }) {
  return (
    <DesktopStage className="how-stage__desk" dim={0.35} parallax>
      <FrameWindow />
      {chips}
      {children}
    </DesktopStage>
  );
}

const STEPS: Step[] = [
  {
    n: "01",
    title: "It reads the frame you are in.",
    body:
      "The app you are in, the field you are on, and a little of what you were just looking at. Each piece keeps where it came from. A missing source is recorded as missing, not filled in.",
    frame: (
      <Frame
        chips={
          <ul className="how-chips">
            <li>
              <b>app</b> Google Chrome
            </li>
            <li>
              <b>field</b> reply body
            </li>
            <li>
              <b>clipboard</b> none
            </li>
            <li>
              <b>recent</b> 3 tabs
            </li>
          </ul>
        }
      />
    ),
  },
  {
    n: "02",
    title: "It decides whether to say anything.",
    body:
      "One judge gets that frame and three answers it is allowed to give: stay quiet, suggest text, offer an action. Staying quiet is an answer, not a failure.",
    frame: (
      <Frame>
        <div className="how-decide">
          <div className="how-decide__card pill-glass">
            <span className="how-decide__label">First question</span>
            <span className="how-decide__row">
              <i>quiet</i>
              <i>text</i>
              <i data-on>action</i>
            </span>
          </div>
          <div className="how-decide__card pill-glass">
            <span className="how-decide__label">Second question</span>
            <span className="how-decide__row">
              <i>flight</i>
              <i data-on>calendar</i>
              <i>none</i>
            </span>
          </div>
        </div>
      </Frame>
    ),
  },
  {
    n: "03",
    title: "It offers, at the cursor.",
    body:
      "Text arrives in grey after your caret. An action arrives as the asterisk and your pinned strip at the edge of the field. Nothing takes your focus, and Escape makes it go away.",
    frame: (
      <Frame>
        <span className="how-ghostline">
          <span className="how-ghostline__ghost">
            I'm going to be in Dallas Tuesday
            <span className="how-ghostline__tab">⇥</span>
          </span>
        </span>
        <span className="how-cluster">
          <CaretCluster pins={PINS} activeId="book-calendar-link" />
        </span>
      </Frame>
    ),
  },
  {
    n: "04",
    title: "It previews, then acts, then stops.",
    body:
      "A preview names the exact effect and shows what it read to get there. Only then does the workflow run, and booking stops at the payment page.",
    frame: (
      <Frame>
        <div className="how-preview pill-glass">
          <span className="how-preview__head">
            Book a calendar link <b>PREVIEW</b>
          </span>
          <span className="how-preview__effect">
            Drafts a reply with three times and holds them on your calendar.
          </span>
          <span className="how-preview__foot">
            Cancel <b>Send draft and hold 3 times</b>
          </span>
        </div>
        <span className="how-stopped">
          <SparkleGlyph size={11} /> Stopped before payment
        </span>
      </Frame>
    ),
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.index));
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Scroll progress for the parallax, written once per frame. Skipped entirely
     under reduced motion, where the CSS ignores the property anyway. */
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const span = box.height + window.innerHeight;
      const p = Math.min(1, Math.max(0, (window.innerHeight - box.top) / span));
      el.style.setProperty("--stage-p", p.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="how" className="section how section-shell" ref={section}>
      <div className="page-container">
        <h2 className="editorial-title how-heading">
          One loop, two decisions, and{" "}
          <em className="glass-text glass-text--flow editorial-accent">a Tab key.</em>
        </h2>

        <div className="how-grid">
          <ol className="how-steps">
            {STEPS.map((step, index) => (
              <li
                key={step.n}
                data-index={index}
                data-active={index === active || undefined}
                className="how-step"
                ref={(el) => {
                  items.current[index] = el;
                }}
              >
                <span className="how-step__n">{step.n}</span>
                <div className="how-step__text">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
                <div className="how-step__inline" inert>{step.frame}</div>
              </li>
            ))}
          </ol>

          <div className="how-stage" aria-hidden inert>
            {STEPS.map((step, index) => (
              <div key={step.n} className="how-frame" data-active={index === active || undefined}>
                {step.frame}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
