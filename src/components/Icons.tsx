/* Shared Lucide icons. CurlyArrow is custom linework positioned beside the reply field. */

import {
  ArrowUpRight as LuArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft as LuChevronLeft,
  ChevronRight,
  MousePointer2,
  PencilLine,
  Plane,
  Sparkle,
} from "lucide-react";

/** The page's icon defaults: 1.5 stroke, decorative unless a label says otherwise. */
const BASE = {
  strokeWidth: 1.5,
  "aria-hidden": true,
  focusable: "false",
} as const;

export function ArrowUpRight({ size = 15 }: { size?: number }) {
  return <LuArrowUpRight size={size} {...BASE} />;
}

export function Chevron({ size = 12 }: { size?: number }) {
  return <ChevronRight size={size} {...BASE} />;
}

export function ChevronLeft({ size = 12 }: { size?: number }) {
  return <LuChevronLeft size={size} {...BASE} />;
}

/** The pointer that marks a demo as yours to drive. */
export function CursorArrow({ size = 15 }: { size?: number }) {
  return <MousePointer2 size={size} {...BASE} fill="currentColor" strokeWidth={0} />;
}

/* The three workflow marks, used small in the pinned strip and large above the
   stage headings. Same icons in both places, so the strip teaches the heading. */

export function FlightIcon({ size = 14 }: { size?: number }) {
  return <Plane size={size} {...BASE} />;
}

export function CalendarIcon({ size = 14 }: { size?: number }) {
  return <CalendarDays size={size} {...BASE} />;
}

export function ReviseIcon({ size = 14 }: { size?: number }) {
  return <PencilLine size={size} {...BASE} />;
}

/** Marks a step the workflow has already run. */
export function CheckMark({ size = 12 }: { size?: number }) {
  return <Check size={size} {...BASE} strokeWidth={2} />;
}

/* The product's own mark. The app draws SF Symbol `sparkle` filled in white on
   a blue circle; lucide's Sparkle is the same four-point star, so it is filled
   and unstroked here to match rather than redrawn by hand. */
export function SparkleMark({ size = 17 }: { size?: number }) {
  return <Sparkle size={size} {...BASE} fill="currentColor" strokeWidth={0} />;
}

/* -------------------------------------------------------- curly arrow */

/* Linework, not an icon: it points from the open sky at the reply field and
   says the demo is real. Drawn in a 200x130 box and positioned by the stage.
   `pathLength` normalises the dash animation so the draw-in does not depend on
   the curve's actual arc length. */
export function CurlyArrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 130"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="curly__line"
        pathLength={1}
        d="M195 11C152 3 96 17 58 48 36 66 24 88 18 108"
      />
      {/* Barbs at 30 degrees either side of the curve's final tangent, which
          runs down and to the left, so the head continues the pen stroke and
          aims into the window rather than past it. */}
      <path className="curly__head" pathLength={1} d="M37 103 18 108 23 89" />
    </svg>
  );
}
