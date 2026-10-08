/* The scenery: a Mac desktop, a menu bar, and window chrome.
 *
 * These are depictions, so they are the only place on the page allowed to draw
 * lines. Window edges, traffic lights and the strip's chip separators are real
 * things in the picture; every decorative rule elsewhere was removed.
 *
 * A window that holds no controls is `role="img"` with a label naming the app
 * and its state, which keeps a screen reader from walking a picture of an
 * inbox. A window that holds real controls is NOT, because you cannot put
 * interactive elements inside an image.
 */

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { SparkleGlyph } from "../caret-ui/CaretUI";
import { Chevron, ChevronLeft } from "../Icons";

const WALLPAPER = `${import.meta.env.BASE_URL}art/austin-dusk.png`;
const WALLPAPER_ALT =
  "Pixel-art illustration of Austin at dusk from the south bank of Lady Bird Lake: the Congress Avenue bridge with bats lifting off, downtown towers with lit windows, the Capitol dome, an indigo sky fading to peach at the horizon.";

/* The same painting as one-colour ink, from tools/ink-print.mjs. */
const WALLPAPER_INK = `${import.meta.env.BASE_URL}art/austin-dusk-ink.webp`;
const WALLPAPER_INK_ALT =
  "The same pixel-art view of Austin across Lady Bird Lake, printed in one ink blue: towers, the Congress Avenue bridge, the Capitol dome, trees in the foreground.";

/* Where the painting appears. This is Sam's open decision 2 in the kgu.one
 * design handoff (HANDOFF-caret.md); "A" is its recommended default.
 *   A  full colour in the hero only; every other desktop uses the ink print
 *   B  the ink print on every desktop, the hero included
 *   C  no painting; every desktop is flat paper with a hairline edge
 * The Austin section's own illustration is not affected. */
export const PAINTING: "A" | "B" | "C" = "A";

function wallpaperFor(hero: boolean): { src: string; alt: string } | null {
  if (PAINTING === "C") return null;
  if (PAINTING === "A" && hero) return { src: WALLPAPER, alt: WALLPAPER_ALT };
  return { src: WALLPAPER_INK, alt: WALLPAPER_INK_ALT };
}

/* The hero's painting is the largest thing in the first screen. On a phone the
 * desktops below it sit inside the browser's lazy-load distance, so their ink
 * prints downloaded alongside it: with Lighthouse's real mobile throttling
 * that moved its largest-contentful-paint from 15.7 s on main to 20.6 s. The
 * other desktops wait for the hero's painting instead. */
let heroSettled = false;
const waitingForHero = new Set<() => void>();

function settleHero() {
  heroSettled = true;
  waitingForHero.forEach((resume) => resume());
  waitingForHero.clear();
}

function useAfterHero(): boolean {
  const [ready, setReady] = useState(heroSettled);
  useEffect(() => {
    if (ready) return;
    const resume = () => setReady(true);
    waitingForHero.add(resume);
    return () => {
      waitingForHero.delete(resume);
    };
  }, [ready]);
  return ready;
}

/* ------------------------------------------------------------ menu bar */

export function MenuBar() {
  return (
    <div className="mac-menubar" aria-hidden>
      <span className="mac-menubar__apple">Chrome</span>
      <span className="mac-menubar__menus">File Edit View History</span>
      <span className="mac-menubar__spacer" />
      {/* StatusBarController sets a `sparkle` template image and the title
          " Caret", on the right where macOS puts status items. */}
      <span className="mac-menubar__status">
        <SparkleGlyph size={12} />
        Caret
      </span>
      <span className="mac-menubar__clock">Sat 2:47 PM</span>
    </div>
  );
}

/* --------------------------------------------------------------- stage */

/** The desktop. Wallpaper, optional menu bar, and whatever floats on it. */
export function DesktopStage({
  children,
  menuBar,
  className,
  dim,
  style,
  hero,
}: {
  children: ReactNode;
  menuBar?: boolean;
  className?: string;
  /** 0..1 overlay so a frame's UI reads before its scenery does. Only drawn
      over the full-colour painting; the ink print is already quiet. */
  dim?: number;
  style?: CSSProperties;
  /** The hero's desktop: loaded first, and the one that may be in colour. */
  hero?: boolean;
}) {
  const paper = wallpaperFor(Boolean(hero));
  const inColour = paper?.src === WALLPAPER;
  const afterHero = useAfterHero();
  return (
    <div
      className={className ? `mac-stage ${className}` : "mac-stage"}
      data-paper={paper ? (inColour ? "colour" : "ink") : "none"}
      style={style}
    >
      {paper && (hero || afterHero) ? (
        <img
          className="mac-stage__paper"
          src={paper.src}
          alt={paper.alt}
          width={1536}
          height={1024}
          loading={hero ? "eager" : "lazy"}
          fetchPriority={hero ? "high" : undefined}
          draggable={false}
          onLoad={hero ? settleHero : undefined}
          onError={hero ? settleHero : undefined}
        />
      ) : null}
      {dim && inColour ? (
        <span
          aria-hidden
          className="mac-stage__dim"
          style={{ background: `rgba(26,27,58,${dim})` }}
        />
      ) : null}
      {menuBar ? <MenuBar /> : null}
      <div className="mac-stage__layer">
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- window */

function TrafficLights() {
  return (
    <span className="mac-lights" aria-hidden>
      <i style={{ background: "var(--traffic-close)" }} />
      <i style={{ background: "var(--traffic-min)" }} />
      <i style={{ background: "var(--traffic-zoom)" }} />
    </span>
  );
}

type WindowProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Set only when the window contains no interactive elements. */
  label?: string;
};

/** A plain macOS app window: title bar with lights, then a body. */
export function MacWindow({ title, children, className, style, label }: WindowProps & { title: string }) {
  const role = label ? ({ role: "img", "aria-label": label } as const) : {};
  return (
    <div className={className ? `mac-window ${className}` : "mac-window"} style={style} {...role}>
      <div className="mac-window__bar">
        <TrafficLights />
        <span className="mac-window__title">{title}</span>
      </div>
      <div className="mac-window__body">{children}</div>
    </div>
  );
}

/** A browser window: lights, then a tab row, then a URL bar. */
export function BrowserWindow({
  tabs,
  activeTab,
  url,
  children,
  className,
  style,
  label,
}: WindowProps & {
  tabs: string[];
  activeTab: number;
  url: string;
}) {
  const role = label ? ({ role: "img", "aria-label": label } as const) : {};
  return (
    <div className={className ? `mac-window ${className}` : "mac-window"} style={style} {...role}>
      <div className="mac-window__bar mac-window__bar--browser">
        <TrafficLights />
        <span className="mac-tabs">
          {tabs.map((tab, i) => (
            <span key={tab} className="mac-tab" data-active={i === activeTab || undefined}>
              {tab}
            </span>
          ))}
        </span>
      </div>
      <div className="mac-urlbar" aria-hidden>
        <span className="mac-urlbar__nav">
          <ChevronLeft size={11} />
          <Chevron size={11} />
        </span>
        <span className="mac-urlbar__field">{url}</span>
      </div>
      <div className="mac-window__body">{children}</div>
    </div>
  );
}

/* -------------------------------------------------- shared small pieces */

/** The one disclosure the page makes about its demos, worn by every stage. */
export function ConceptChip({ children }: { children?: ReactNode }) {
  return (
    <span className="mac-concept">
      <SparkleGlyph size={10} />
      {children ?? "Interactive concept demo"}
    </span>
  );
}
