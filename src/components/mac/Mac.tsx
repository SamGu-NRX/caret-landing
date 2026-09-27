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

import type { CSSProperties, ReactNode } from "react";
import { SparkleGlyph } from "../caret-ui/CaretUI";
import { Chevron, ChevronLeft } from "../Icons";

export const WALLPAPER = `${import.meta.env.BASE_URL}art/austin-dusk.png`;
export const WALLPAPER_ALT =
  "Pixel-art illustration of Austin at dusk from the south bank of Lady Bird Lake: the Congress Avenue bridge with bats lifting off, downtown towers with lit windows, the Capitol dome, an indigo sky fading to peach at the horizon.";

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
  eager,
  parallax,
}: {
  children: ReactNode;
  menuBar?: boolean;
  className?: string;
  /** 0..1 overlay so a frame's UI reads before its scenery does. */
  dim?: number;
  style?: CSSProperties;
  eager?: boolean;
  parallax?: boolean;
}) {
  return (
    <div className={className ? `mac-stage ${className}` : "mac-stage"} style={style}>
      <img
        className="mac-stage__paper"
        data-parallax={parallax || undefined}
        src={WALLPAPER}
        alt={WALLPAPER_ALT}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        draggable={false}
      />
      {dim ? (
        <span
          aria-hidden
          className="mac-stage__dim"
          style={{ background: `rgba(26,27,58,${dim})` }}
        />
      ) : null}
      {menuBar ? <MenuBar /> : null}
      <div className="mac-stage__layer" data-parallax={parallax || undefined}>
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
