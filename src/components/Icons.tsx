/* Drawn icons, one stroke weight, one geometry. Nothing on this page uses a
   unicode glyph or an emoji where an icon belongs. */

type IconProps = { className?: string; size?: number };

function Stroke({ size = 14, children, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function ArrowUpRight({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M5 11 11 5" />
      <path d="M5.7 5H11v5.3" />
    </Stroke>
  );
}

export function Chevron({ className, size = 12 }: IconProps) {
  return (
    <Stroke className={className} size={size}>
      <path d="M6 3.5 10.5 8 6 12.5" />
    </Stroke>
  );
}

/** Back and forward, for browser chrome. */
export function ChevronLeft({ className, size = 12 }: IconProps) {
  return (
    <Stroke className={className} size={size}>
      <path d="M10 3.5 5.5 8 10 12.5" />
    </Stroke>
  );
}

export function FlightIcon() {
  return (
    <Stroke>
      <path d="m2 8 5 1-1 4 2 1 2-5 4-4c1-1-1-3-2-2L8 6 3 5Z" />
    </Stroke>
  );
}

export function CalendarIcon() {
  return (
    <Stroke>
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M5 1.5v3M11 1.5v3M2 7h12M5 10h1M9 10h1" />
    </Stroke>
  );
}

export function ReviseIcon() {
  return (
    <Stroke>
      <path d="m3 10 7-7 3 3-7 7-4 1 1-4ZM9 4l3 3M9 14h5" />
    </Stroke>
  );
}

/** The pointer, used once: the sign that a demo is yours to drive. */
export function CursorArrow({ className, size = 14 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3.4 2.2a.6.6 0 0 1 .84-.55l8.4 3.9a.6.6 0 0 1-.05 1.1l-3.3 1.2-1.6 3.2a.6.6 0 0 1-1.12-.13L3.4 2.2Z" />
    </svg>
  );
}
