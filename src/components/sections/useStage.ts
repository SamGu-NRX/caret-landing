/* A stage plays itself once, then hands you the controls.
 *
 * Scrolling past a workflow should show you what it does without asking you to
 * press anything, because most visitors will never press anything. So each
 * stage runs its own script the first time it comes into view, rests at the
 * end, and says so. The moment you touch a control the script is dead for good
 * and the state is yours.
 *
 * Under reduced motion nothing runs: the stage sits at its first state and the
 * same prompt invites you in.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type Beat<T> = { to: T; after: number };

export function useStage<T extends string>(states: readonly T[], script?: readonly Beat<T>[]) {
  const [state, setState] = useState<T>(states[0]);
  /** True once the visitor has taken over, or the script has finished. */
  const [done, setDone] = useState(false);
  /** True only after a real interaction, which is what hides the prompt. */
  const [taken, setTaken] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const takenRef = useRef(false);

  const clear = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const takeOver = useCallback(() => {
    takenRef.current = true;
    clear();
    setTaken(true);
    setDone(true);
  }, [clear]);

  /** Keep focus in the demo when its pressed button disappears. */
  const go = useCallback(
    (next: T) => {
      takeOver();
      const stage = stageRef.current;
      if (stage?.parentElement?.contains(document.activeElement)) {
        stage.focus({ preventScroll: true });
      }
      setState(next);
    },
    [takeOver],
  );

  const reset = useCallback(() => {
    go(states[0]);
  }, [go, states]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node || !script?.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || takenRef.current) return;
        observer.disconnect();
        let at = 0;
        script.forEach(({ to, after }, index) => {
          at += after;
          timers.current.push(
            window.setTimeout(() => {
              if (takenRef.current) return;
              setState(to);
              if (index === script.length - 1) setDone(true);
            }, at),
          );
        });
      },
      { threshold: 0.45 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      clear();
    };
  }, [script, clear]);

  return { state, go, reset, stageRef, taken, done, takeOver };
}
