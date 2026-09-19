/* The three registered workflows, each playing itself once and then yielding.
 *
 * These are the three seeds in caret/workflows.json and nothing else. Every
 * time, buffer and dropped candidate in the calendar stage comes from
 * fixtures/meeting.json and caret/planner.py. The flight itinerary is a sample
 * chosen to stay consistent with that calendar, and is labelled as one.
 */

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CaretCluster, PreviewCard, SparkleGlyph } from "../caret-ui/CaretUI";
import { BrowserWindow, ConceptChip, DesktopStage, MacWindow } from "../mac/Mac";
import { CursorArrow } from "../Icons";
import { PINS } from "../hero/Hero";
import { useStage } from "./useStage";
import type { Beat } from "./useStage";

function Stage({
  id,
  title,
  body,
  controls,
  children,
  flip,
  stageRef,
  taken,
  done,
  takeOver,
  onKeyDown,
}: {
  id: string;
  title: string;
  body: string;
  controls: ReactNode;
  children: ReactNode;
  flip?: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
  taken: boolean;
  done: boolean;
  takeOver: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
}) {
  return (
    <article id={id} className="wf" data-flip={flip || undefined}
      onPointerDownCapture={takeOver} onFocusCapture={takeOver} onKeyDown={onKeyDown}>
      <div className="wf__text">
        <h3 className="editorial-title wf__title">{title}</h3>
        <p className="wf__body">{body}</p>
        <div className="wf__controls">{controls}</div>
      </div>
      <div className="wf__stage" ref={stageRef} tabIndex={-1} role="group" aria-label={`${title} Interactive demo`}>
        <DesktopStage className="wf__desk" dim={0.4}>
          <ConceptChip />
          {children}
          {/* The only prompt on the stage. It arrives when the stage has
              finished showing itself and leaves the first time you act. */}
          {!taken ? (
            <span className="wf-invite" data-ready={done || undefined}>
              <CursorArrow size={13} />
              Your turn
            </span>
          ) : null}
        </DesktopStage>
      </div>
    </article>
  );
}

function Go({ children, onClick, quiet }: { children: ReactNode; onClick: () => void; quiet?: boolean }) {
  return (
    <button type="button" className={quiet ? "wf__quiet" : "wf__go"} onClick={onClick}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------- 01 revise */

const ROUGH =
  "ok so the demo: we show the asterisk then tab then the flight thing, need to make sure it doesnt buy anything lol, also calendar";
const CLEAN =
  "Demo order: show the asterisk, press Tab, then run the flight booking. Confirm it stops before payment. Then the calendar link.";

const REVISE_SCRIPT: Beat<"idle" | "selected" | "preview" | "replaced">[] = [
  { to: "selected", after: 700 },
  { to: "preview", after: 1100 },
  { to: "replaced", after: 1900 },
];

function ReviseStage() {
  const { state, go, reset, stageRef, taken, done, takeOver } = useStage(
    ["idle", "selected", "preview", "replaced"] as const,
    REVISE_SCRIPT,
  );

  return (
    <Stage
      id="revise"
      title="Rough notes, selected. Clean notes, in place."
      body="The asterisk follows your selection. Revise shows the rewrite before it touches the document, replaces exactly what you picked, and leaves ⌘Z working."
      stageRef={stageRef}
      taken={taken}
      done={done}
      takeOver={takeOver}
      onKeyDown={(event) => {
        if (state === "replaced" && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
          event.preventDefault();
          reset();
        }
      }}
      controls={
        <>
          {state === "idle" ? <Go onClick={() => go("selected")}>Select the paragraph</Go> : null}
          {state === "selected" ? <Go onClick={() => go("preview")}>Revise draft</Go> : null}
          {state === "preview" ? <Go onClick={() => go("replaced")}>Replace text</Go> : null}
          {state === "replaced" ? <Go onClick={reset}>Undo rewrite</Go> : null}
          {state !== "idle" ? (
            <Go quiet onClick={reset}>
              Start over
            </Go>
          ) : null}
        </>
      }
    >
      <MacWindow title="Notes" className="wf-window wf-window--notes">
        <div className="notes">
          <p className="notes__title">Demo run of show</p>
          <p className="notes__body">
            {state === "replaced" ? (
              CLEAN
            ) : (
              <button
                type="button"
                className="notes__select"
                data-on={state !== "idle" || undefined}
                onClick={() => state === "idle" && go("selected")}
              >
                {ROUGH}
              </button>
            )}
          </p>
        </div>
      </MacWindow>

      {state === "selected" ? (
        <span className="wf-cluster wf-cluster--notes">
          <CaretCluster pins={PINS.filter((pin) => pin.id === "revise")} flip compact activeId="revise" onRun={() => go("preview")} />
        </span>
      ) : null}

      {state === "preview" ? (
        <span className="wf-card">
          <PreviewCard
            title="Revise draft"
            effect="Replaces the selected text in Notes. ⌘Z restores it."
            primary="Replace text"
            onPrimary={() => go("replaced")}
            onCancel={() => go("selected")}
          >
            <div className="wf-diff">
              <p className="wf-diff__old">{ROUGH}</p>
              <p className="wf-diff__new">{CLEAN}</p>
            </div>
          </PreviewCard>
        </span>
      ) : null}

      {state === "replaced" ? <p className="wf-status">Replaced. ⌘Z restores the original.</p> : null}
    </Stage>
  );
}

/* -------------------------------------------------------------- 02 flight */

const SKY_STEPS = [
  "Open search",
  "AUS to DFW, Tuesday",
  "Land before noon",
  "Choose a fare",
  "Open checkout",
];

const FLIGHT_SCRIPT: Beat<"idle" | "preview" | "driving" | "stopped">[] = [
  { to: "preview", after: 900 },
  { to: "driving", after: 1800 },
  { to: "stopped", after: 3400 },
];

function FlightStage() {
  const { state, go, reset, stageRef, taken, done, takeOver } = useStage(
    ["idle", "preview", "driving", "stopped"] as const,
    FLIGHT_SCRIPT,
  );
  const [step, setStep] = useState(0);
  const manualDrive = useRef(false);

  const drive = () => {
    manualDrive.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      go("stopped");
      return;
    }
    go("driving");
    setStep(0);
  };

  useEffect(() => {
    if (state !== "driving" || (taken && !manualDrive.current)) return;
    let i = 0;
    setStep(0);
    const id = window.setInterval(() => {
      i += 1;
      setStep(i);
      if (i >= SKY_STEPS.length) {
        window.clearInterval(id);
        if (manualDrive.current) go("stopped");
      }
    }, 520);
    return () => window.clearInterval(id);
  }, [state, taken, go]);

  return (
    <Stage
      id="flight"
      title="From the thread to the payment page, and not one step further."
      body="It reads the ask and your calendar, then drives the airline site, re-reading the page after every step. The stop before paying lives in the workflow, not in a prompt."
      flip
      stageRef={stageRef}
      taken={taken}
      done={done}
      takeOver={takeOver}
      controls={
        <>
          {state === "idle" ? <Go onClick={() => go("preview")}>Book a flight</Go> : null}
          {state === "preview" ? <Go onClick={drive}>Search in browser</Go> : null}
          {state === "driving" ? <Go onClick={() => go("stopped")}>Skip to the end</Go> : null}
          {state !== "idle" ? (
            <Go quiet onClick={reset}>
              Start over
            </Go>
          ) : null}
        </>
      }
    >
      <MacWindow
        title="Mail"
        className="wf-window wf-window--mail"
        label="A Mail window showing a thread from Alex Rivera asking about Tuesday in Dallas"
      >
        <div className="mailw">
          <p className="mailw__subject">Tuesday in Dallas?</p>
          <p className="mailw__body">
            Can you be in Dallas Tuesday for the 1pm? Happy to cover the flight.
          </p>
          <div className="mailw__reply">Reply</div>
        </div>
      </MacWindow>

      {state === "idle" ? (
        <span className="wf-cluster wf-cluster--mail">
          <CaretCluster pins={PINS.filter((pin) => pin.id === "book-flight")} flip compact activeId="book-flight" onRun={() => go("preview")} />
        </span>
      ) : null}

      {state === "preview" ? (
        <span className="wf-card">
          <PreviewCard
            title="Book a flight"
            effect="Searches flights in your browser. Stops before payment."
            primary="Search in browser"
            onPrimary={drive}
            onCancel={reset}
            why={
              <dl className="wf-evidence">
                <div>
                  <dt>Read</dt>
                  <dd>“Dallas Tuesday for the 1pm”</dd>
                </div>
                <div>
                  <dt>Calendar</dt>
                  <dd>busy 9:00 to 10:00</dd>
                </div>
                <div>
                  <dt>Fares</dt>
                  <dd>a sample, not a live timetable</dd>
                </div>
              </dl>
            }
          >
            <p className="wf-route">Out after 10:00, back after 15:30</p>
          </PreviewCard>
        </span>
      ) : null}

      {state === "driving" || state === "stopped" ? (
        <BrowserWindow
          className="wf-window wf-window--safari"
          tabs={["Book a flight"]}
          activeTab={0}
          url={state === "stopped" ? "example-air.test/checkout" : "example-air.test/search"}
          label={
            state === "stopped"
              ? "A sample airline checkout page, stopped before payment"
              : "A sample airline search page"
          }
        >
          {state === "stopped" ? (
            <div className="airline">
              <p className="airline__banner">
                <SparkleGlyph size={12} />
                Stopped before payment. Nothing was bought.
              </p>
              <div className="fare">
                <span className="fare__code">AA 2419</span>
                <span className="fare__leg mono">AUS 10:35 → DFW 11:40</span>
              </div>
              <div className="fare">
                <span className="fare__code">AA 2588</span>
                <span className="fare__leg mono">DFW 15:30 → AUS 16:45</span>
              </div>
              <p className="airline__total">
                $148 <span>sample fare</span>
              </p>
              <div className="airline__fields" aria-hidden>
                <span>Card number</span>
                <span>MM / YY</span>
              </div>
            </div>
          ) : (
            <div className="airline">
              <ol className="airline__steps">
                {SKY_STEPS.map((label, i) => (
                  <li key={label} data-done={i < step || undefined} data-now={i === step || undefined}>
                    <span className="airline__dots" aria-hidden>
                      <i />
                      <i />
                      <i />
                    </span>
                    {label}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </BrowserWindow>
      ) : null}
    </Stage>
  );
}

/* ------------------------------------------------------------ 03 calendar */

const OPTIONS = [
  { id: "a", time: "11:00 – 11:30" },
  { id: "b", time: "13:00 – 13:30" },
  { id: "c", time: "15:00 – 15:30" },
];

const CAL_SCRIPT: Beat<"idle" | "options" | "held" | "replied" | "confirmed">[] = [
  { to: "options", after: 900 },
  { to: "held", after: 2200 },
  { to: "replied", after: 1600 },
  { to: "confirmed", after: 1900 },
];

function CalendarStage() {
  const { state, go, reset, stageRef, taken, done, takeOver } = useStage(
    ["idle", "options", "held", "replied", "confirmed"] as const,
    CAL_SCRIPT,
  );
  const [picked, setPicked] = useState("b");
  const chosen = OPTIONS.find((o) => o.id === picked) ?? OPTIONS[1];
  const start = chosen.time.split(" ")[0];

  return (
    <Stage
      id="calendar"
      title="Three times that fit, with the reasons attached."
      body="From one email it proposes three slots that clear your calendar and the drive, drafts the reply, and holds the times. When they pick one you confirm once, and it releases only its own others."
      stageRef={stageRef}
      taken={taken}
      done={done}
      takeOver={takeOver}
      controls={
        <>
          {state === "idle" ? <Go onClick={() => go("options")}>Find three times</Go> : null}
          {state === "options" ? <Go onClick={() => go("held")}>Send draft and hold</Go> : null}
          {state === "held" ? <Go onClick={() => go("replied")}>Alex replies</Go> : null}
          {state === "replied" ? <Go onClick={() => go("confirmed")}>Confirm {start}</Go> : null}
          {state !== "idle" ? (
            <Go quiet onClick={reset}>
              Start over
            </Go>
          ) : null}
        </>
      }
    >
      <BrowserWindow
        className="wf-window wf-window--gmail"
        tabs={["Dallas meeting"]}
        activeTab={0}
        url="mail.google.com"
        label="A mail thread asking for three meeting times, with a week column beside it"
      >
        <div className="calw">
          <div className="calw__thread">
            <p className="calw__subject">Dallas meeting</p>
            <p className="calw__body">
              Could we meet in Dallas next Tuesday? Please send{" "}
              {state === "idle" ? (
                <span>three times that leave room for travel</span>
              ) : (
                <mark className="calw__mark">three times that leave room for travel</mark>
              )}
              .
            </p>

            {state === "replied" || state === "confirmed" ? (
              <p className="calw__reply-in">
                <span className="calw__tag">Staged reply, sample</span>
                {start} works for me. See you Tuesday.
              </p>
            ) : null}

            {state === "held" || state === "replied" || state === "confirmed" ? (
              <p className="calw__draft">
                I can meet at one of these times:
                <br />
                Tuesday 11:00, 13:00 or 15:00
              </p>
            ) : (
              <div className="calw__composer">Reply</div>
            )}
          </div>

          {/* Tuesday, 9:00 to 17:00. The busy block and every hold come from
              the fixture and the planner's hold_start and hold_end. */}
          <div className="calw__week">
            <p className="calw__day">Tue 22</p>
            <div className="calw__col">
              <span className="calw__busy" style={{ top: "0%", height: "12.5%" }}>
                Busy
              </span>
              {state === "held" || state === "replied"
                ? OPTIONS.map((o, i) => (
                    <span
                      key={o.id}
                      className="calw__hold"
                      style={{ top: `${12.5 + i * 25}%`, height: "25%" }}
                    >
                      hold
                    </span>
                  ))
                : null}
              {state === "confirmed" ? (
                <span className="calw__event" style={{ top: `${12.5 + OPTIONS.indexOf(chosen) * 25}%`, height: "25%" }}>
                  Dallas
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </BrowserWindow>

      {state === "idle" ? (
        <span className="wf-cluster wf-cluster--gmail">
          <CaretCluster pins={PINS.filter((pin) => pin.id === "book-calendar-link")} flip compact activeId="book-calendar-link" onRun={() => go("options")} />
        </span>
      ) : null}

      {state === "options" ? (
        <span className="wf-card">
          <PreviewCard
            title="Book a calendar link"
            effect="Drafts a reply with three times and holds them on your calendar."
            primary="Send draft and hold"
            onPrimary={() => go("held")}
            onCancel={reset}
            why={
              <dl className="wf-evidence">
                <div>
                  <dt>Busy</dt>
                  <dd>Tuesday 9:00 to 10:00</dd>
                </div>
                <div>
                  <dt>Travel</dt>
                  <dd>60 minutes before, 30 after</dd>
                </div>
                <div>
                  <dt>Dropped</dt>
                  <dd>10:30, it overlaps once the drive is added</dd>
                </div>
              </dl>
            }
          >
            <ul className="wf-options">
              {OPTIONS.map((o) => (
                <li key={o.id}>
                  <label>
                    <input
                      type="radio"
                      name="cal-option"
                      checked={picked === o.id}
                      onChange={() => setPicked(o.id)}
                    />
                    <span className="wf-options__mark" aria-hidden />
                    <span className="wf-options__day">Tue</span>
                    <span className="mono">{o.time}</span>
                  </label>
                </li>
              ))}
            </ul>
          </PreviewCard>
        </span>
      ) : null}

      {state === "held" ? <p className="wf-status">Draft sent, three times held.</p> : null}

      {state === "replied" ? (
        <span className="wf-card">
          <PreviewCard
            title={`Confirm ${start}`}
            effect={`Keeps ${start} as the meeting and releases this workflow's other two holds.`}
            primary={`Confirm ${start}`}
            onPrimary={() => go("confirmed")}
            onCancel={() => go("held")}
          />
        </span>
      ) : null}

      {state === "confirmed" ? (
        <p className="wf-status">Kept {start}. Released {OPTIONS.filter((option) => option.id !== picked).map((option) => option.time.split(" ")[0]).join(" and ")}.</p>
      ) : null}
    </Stage>
  );
}

/* ------------------------------------------------------------------ all */

export function Workflows() {
  return (
    <section id="workflows" className="section workflows section-shell">
      <div className="page-container">
        <h2 className="editorial-title">Three workflows, one shape.</h2>
        <p className="editorial-standfirst workflows__lede">
          Ordinary code, with a judgement call only where one is needed. Each runs here on
          the repository's sample data.
        </p>
      </div>

      <div className="page-container workflows__list">
        <ReviseStage />
        <FlightStage />
        <CalendarStage />
      </div>
    </section>
  );
}
