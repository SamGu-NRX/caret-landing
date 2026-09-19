/* The reply composer, and the one idea the whole page is built to show.
 *
 * You type the same opening line twice. The only thing that changes is what
 * else is open in the browser behind you, and the completion changes with it.
 * That is the product's claim in one interaction, and it is why the context
 * switch is a visible control rather than a sentence.
 *
 * Everything here is a seeded local script. There is no model call, no network,
 * and the caption says so once. If what you type is not something the script
 * knows, nothing appears. Staying quiet is one of the three answers the real
 * first decision is allowed to give, and it is the right one when there is
 * nothing useful to say.
 *
 * The ghost is drawn in a mirror behind a transparent textarea. That is the
 * ordinary way to get wrapping ghost text without fighting contenteditable, and
 * it keeps the textarea a real textarea: real selection, real caret, real
 * label, real keys.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type ContextId = "travel" | "jobs";

export type ContextPreset = {
  id: ContextId;
  label: string;
  /** What the visitor sees open in the browser, which is the whole point. */
  tabs: string[];
  activeTab: number;
  url: string;
  /** The completion this context produces for the shared opening. */
  completion: string;
  /** Said once under the stage when this context is chosen. */
  note: string;
};

/** The same first words in both contexts. Everything after this is the demo. */
export const OPENING = "Hi Alex, thanks for the note. ";

export const CONTEXTS: ContextPreset[] = [
  {
    id: "travel",
    label: "Travel",
    tabs: ["Next week?", "AUS to DFW", "Stay in Deep Ellum", "Things to do in Dallas"],
    activeTab: 0,
    url: "mail.google.com",
    completion:
      "I'm going to be in Dallas Tuesday through Thursday, so I could come by while I'm up there.",
    note: "Travel tabs open. The completion knows you are going to Dallas.",
  },
  {
    id: "jobs",
    label: "Job search",
    tabs: ["Next week?", "Backend roles", "Greenhouse application", "resume.pdf"],
    activeTab: 0,
    url: "mail.google.com",
    completion:
      "I'd love to talk about the backend role this week. I've attached my resume.",
    note: "Same inbox, job tabs. Same opening line, a different ending.",
  },
];

/* A handful of typos worth fixing. INLINE in the pipeline is "a short
   continuation or a simple correction", and this is the second half of that. */
const FIXES: Record<string, string> = {
  teh: "the",
  wroks: "works",
  recieve: "receive",
  calender: "calendar",
  tommorow: "tomorrow",
  seperate: "separate",
  definately: "definitely",
};

type Offer =
  | { kind: "none" }
  | { kind: "ghost"; text: string }
  | { kind: "fix"; from: string; to: string; start: number };

function computeOffer(value: string, script: string): Offer {
  /* Offers only exist at the end of the text. A caret parked in the middle of a
     sentence gets nothing, which is also the pipeline's rule for a moved
     caret. The composer only ever appends, so "end" is just the full value. */
  const typed = value;
  if (typed.length === 0) return { kind: "none" };

  const norm = (s: string) => s.replace(/\s+/g, " ").toLowerCase();
  if (typed.length < script.length && norm(script).startsWith(norm(typed))) {
    const rest = script.slice(typed.length);
    if (rest.trim().length > 0) {
      /* At most one sentence, at most twelve words, so the ghost stays a
         proposal rather than an essay. */
      const sentence = rest.split(/(?<=[.!?])\s/)[0] ?? rest;
      const words = sentence.trim().split(/\s+/).slice(0, 12).join(" ");
      const lead = rest.startsWith(" ") ? " " : "";
      return { kind: "ghost", text: lead + words };
    }
  }

  const match = /([A-Za-z']+)$/.exec(typed);
  if (match) {
    const word = match[1];
    const fix = FIXES[word.toLowerCase()];
    if (fix) return { kind: "fix", from: word, to: fix, start: typed.length - word.length };
  }

  return { kind: "none" };
}

export function ReplyComposer({
  context,
  onFirstInput,
  resetKey,
}: {
  context: ContextPreset;
  /** Autoplay hands over the moment a visitor touches the field. */
  onFirstInput?: () => void;
  resetKey: number;
}) {
  const script = OPENING + context.completion;
  const [value, setValue] = useState("");
  const [offer, setOffer] = useState<Offer>({ kind: "none" });
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<number | null>(null);
  const autoplay = useRef<number | null>(null);
  const touched = useRef(false);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clearTimers = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (autoplay.current) window.clearInterval(autoplay.current);
    timer.current = null;
    autoplay.current = null;
  }, []);

  /* Offers land 350ms after the last keystroke, so the ghost is not chasing
     every character. */
  const schedule = useCallback(
    (next: string) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const candidate = computeOffer(next, script);
        const key = candidate.kind === "ghost" ? candidate.text : candidate.kind === "fix" ? candidate.from : "";
        setOffer(key && key === dismissed ? { kind: "none" } : candidate);
      }, 350);
    },
    [script, dismissed],
  );

  /* Switching context re-asks with the text already on screen, which is the
     demonstration: same input, different answer. */
  const currentScript = useRef(script);
  useEffect(() => {
    currentScript.current = script;
    if (timer.current) window.clearTimeout(timer.current);
    setDismissed(null);
    if (value.length === 0) return;
    setOffer(computeOffer(value, script));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script]);

  /* Autoplay types the shared opening and then stops, leaving the ghost up and
     the context control inviting a switch. Under reduced motion it is not an
     animation at all: the text is simply already there. */
  useEffect(() => {
    clearTimers();
    touched.current = false;
    setValue("");
    setOffer({ kind: "none" });
    setDismissed(null);

    if (reduced) {
      setValue(OPENING);
      setOffer(computeOffer(OPENING, currentScript.current));
      return;
    }

    let i = 0;
    setTyping(true);
    autoplay.current = window.setInterval(() => {
      if (touched.current) {
        clearTimers();
        setTyping(false);
        return;
      }
      i += 1;
      const next = OPENING.slice(0, i);
      setValue(next);
      if (i >= OPENING.length) {
        clearTimers();
        setTyping(false);
        setOffer(computeOffer(next, currentScript.current));
      }
    }, 55);

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, reduced]);

  const takeOver = () => {
    if (touched.current) return;
    touched.current = true;
    clearTimers();
    setTyping(false);
    onFirstInput?.();
  };

  const accept = useCallback(() => {
    if (offer.kind === "ghost") {
      const next = value + offer.text;
      setValue(next);
      setOffer({ kind: "none" });
      schedule(next);
    } else if (offer.kind === "fix") {
      const next = value.slice(0, offer.start) + offer.to;
      setValue(next);
      setOffer({ kind: "none" });
      schedule(next);
    }
    areaRef.current?.focus();
  }, [offer, value, schedule]);

  const live = useMemo(() => {
    if (offer.kind === "ghost") return `Suggestion: ${offer.text.trim()}. Press Tab to accept.`;
    if (offer.kind === "fix") return `Correction: ${offer.from} to ${offer.to}. Press Tab to accept.`;
    return "";
  }, [offer]);

  const beforeFix = offer.kind === "fix" ? value.slice(0, offer.start) : value;

  return (
    <div className="rc">
      <div className="rc__head" aria-hidden>
        To: Alex Rivera
      </div>

      <div className="rc__field">
        {/* The mirror. Same font, same padding, same wrapping as the textarea
            sitting on top of it, so the ghost lands exactly after the caret. */}
        <div className="rc__mirror" aria-hidden>
          {offer.kind === "fix" ? (
            <>
              {beforeFix}
              <span className="rc__fix">{offer.from}</span>
            </>
          ) : (
            value
          )}
          {offer.kind === "ghost" ? (
            <span className="rc__ghost">
              {offer.text}
              <span className="rc__tab">⇥</span>
            </span>
          ) : null}
          {typing ? <span className="rc__cursor" /> : null}
        </div>

        <textarea
          ref={areaRef}
          className="rc__area"
          value={value}
          rows={3}
          spellCheck={false}
          aria-label="Reply to Alex Rivera"
          aria-describedby="rc-help"
          onFocus={takeOver}
          onPointerDown={takeOver}
          onChange={(event) => {
            takeOver();
            setDismissed(null);
            setValue(event.target.value);
            setOffer({ kind: "none" });
            schedule(event.target.value);
          }}
          onKeyDown={(event) => {
            /* Tab only belongs to Caret while there is something to accept.
               With no offer it does what Tab always does and leaves the field,
               which is the pipeline's rule and the thing a visitor will test. */
            if (event.key === "Tab" && offer.kind !== "none") {
              event.preventDefault();
              accept();
              return;
            }
            if (event.key === "Escape" && offer.kind !== "none") {
              event.preventDefault();
              setDismissed(offer.kind === "ghost" ? offer.text : offer.from);
              setOffer({ kind: "none" });
            }
          }}
        />

        {/* Tapping the proposal accepts it. Phones have no Tab key. */}
        {offer.kind !== "none" ? (
          <button type="button" className="rc__accept" onClick={accept}>
            {offer.kind === "ghost"
              ? "Accept suggestion"
              : `Fix “${offer.from}” to “${offer.to}”`}
          </button>
        ) : null}
      </div>

      <p id="rc-help" className="visually-hidden">
        Suggestions appear after the caret. Press Tab to accept, Escape to dismiss.
      </p>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>

      <div className="rc__toolbar" aria-hidden>
        <span className="rc__send">Send</span>
      </div>
    </div>
  );
}
