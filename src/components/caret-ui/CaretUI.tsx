/* The product's own interface, drawn at the size the Mac app draws it.
 *
 * Every number here comes from apps/mac/Sources/Caret/TriggerButton.swift and
 * PinnedActionsStore.swift. The point of the page is that Caret adds one small
 * thing to an app you already use, so the control has to be the real size in
 * every place it appears: in the headline as a specimen, over the hero's
 * composer, and in each workflow stage.
 *
 * These are real buttons and a real menu. Nothing here is wrapped in role="img",
 * because a picture of a control you can click is a lie to a screen reader.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Chevron } from "../Icons";
import type { ReactNode } from "react";

/** SF Symbol `sparkle`, redrawn. Four points, semibold weight. */
export function SparkleGlyph({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 1.6c.3 0 .55.2.62.49l1.06 4.2a5.2 5.2 0 0 0 3.77 3.77l4.2 1.06a.64.64 0 0 1 0 1.24l-4.2 1.06a5.2 5.2 0 0 0-3.77 3.77l-1.06 4.2a.64.64 0 0 1-1.24 0l-1.06-4.2a5.2 5.2 0 0 0-3.77-3.77l-4.2-1.06a.64.64 0 0 1 0-1.24l4.2-1.06a5.2 5.2 0 0 0 3.77-3.77l1.06-4.2A.64.64 0 0 1 12 1.6Z" />
    </svg>
  );
}

/* --------------------------------------------------------------- sparkle */

type SparkleProps = {
  onClick?: () => void;
  expanded?: boolean;
  controls?: string;
  buttonRef?: React.Ref<HTMLButtonElement>;
};

/** The trigger. 36px circle in a 40px hit box, per CaretPillMetrics. */
export function Sparkle({ onClick, expanded, controls, buttonRef }: SparkleProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="cu-sparkle"
      onClick={onClick}
      aria-label="Caret actions"
      aria-haspopup={controls ? "menu" : undefined}
      aria-expanded={controls ? expanded : undefined}
      aria-controls={controls && expanded ? controls : undefined}
    >
      <span className="cu-sparkle__dot">
        <SparkleGlyph />
      </span>
    </button>
  );
}

/* ----------------------------------------------------------------- strip */

export type Pin = { id: string; title: string; slot: number; full?: string; icon: ReactNode };

/** Up to three chips, the PinnedActionsStore.maxPinned limit. */
export function PinnedStrip({
  pins,
  onRun,
  activeId,
}: {
  pins: Pin[];
  onRun?: (pin: Pin) => void;
  activeId?: string | null;
}) {
  if (pins.length === 0) return null;
  return (
    <div className="cu-strip pill-glass">
      {pins.map((pin, index) => (
        <span key={pin.id} className="cu-strip__cell">
          {index > 0 ? <i aria-hidden className="cu-strip__sep" /> : null}
          <button
            type="button"
            className="cu-chip"
            data-first={index === 0 || undefined}
            data-last={index === pins.length - 1 || undefined}
            data-active={pin.id === activeId || undefined}
            onClick={() => onRun?.(pin)}
            title={`${pin.full ?? pin.title} (⌘⌥${pin.slot})`}
            aria-label={pin.full ?? pin.title}
          >
            {pin.icon}
          </button>
        </span>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- menu */

export type MenuAction = { id: string; title: string; slot?: number };

/** The scrollable action list the sparkle opens. Arrow keys, Enter, Escape. */
export function ActionsMenu({
  id,
  actions,
  onRun,
  onClose,
  returnFocusTo,
}: {
  id: string;
  actions: MenuAction[];
  onRun: (action: MenuAction) => void;
  onClose: () => void;
  returnFocusTo: React.RefObject<HTMLButtonElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const items = ref.current?.querySelectorAll<HTMLElement>("[role='menuitem']");
    items?.[index]?.focus();
  }, [index]);

  /* Click-outside closes. This is a pointerdown listener rather than a keydown
     one: the page has no global key handling anywhere, and this menu is no
     exception. Keys are handled on the menu's own elements. */
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !ref.current?.contains(event.target) &&
        !returnFocusTo.current?.contains(event.target)
      ) onClose();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [onClose, returnFocusTo]);

  const dismiss = useCallback(() => {
    onClose();
    returnFocusTo.current?.focus();
  }, [onClose, returnFocusTo]);

  return (
    <div
      ref={ref}
      id={id}
      role="menu"
      aria-label="Caret actions"
      className="cu-menu pill-glass"
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setIndex((i) => (i + 1) % actions.length);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setIndex((i) => (i - 1 + actions.length) % actions.length);
        } else if (event.key === "Escape") {
          event.preventDefault();
          dismiss();
        }
      }}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          role="menuitem"
          tabIndex={-1}
          className="cu-menu__row"
          onClick={() => {
            dismiss();
            onRun(action);
          }}
        >
          <span className="cu-menu__title">{action.title}</span>
          {action.slot ? <span className="cu-menu__key">⌘⌥{action.slot}</span> : null}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- cluster */

/* Sparkle, then the strip, 4px apart, 40px tall. In the app this is a floating
   NSPanel positioned against the field or selection, so on the page it is
   absolutely positioned by the stage rather than living inside the window it
   sits beside. `flip` mirrors AXHelpers' behaviour when the panel would leave
   the screen. */
export function CaretCluster({
  pins,
  actions,
  onRun,
  style,
  flip,
  activeId,
  compact,
}: {
  pins: Pin[];
  actions?: MenuAction[];
  onRun?: (id: string) => void;
  style?: React.CSSProperties;
  flip?: boolean;
  activeId?: string | null;
  /** Below 640px the strip does not fit beside a field, so only the sparkle shows. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const sparkleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const menuActions =
    actions ?? pins.map((p) => ({ id: p.id, title: p.full ?? p.title, slot: p.slot }));

  return (
    <div className="cu-cluster" data-flip={flip || undefined} style={style}>
      <div className="cu-cluster__sparkle">
        <Sparkle
          buttonRef={sparkleRef}
          onClick={() => setOpen((v) => !v)}
          expanded={open}
          controls={menuId}
        />
      </div>
      {/* The app hides the trigger while the panel is open; so does this. */}
      {!open && !compact ? (
        <PinnedStrip pins={pins} activeId={activeId} onRun={(pin) => onRun?.(pin.id)} />
      ) : null}
      {open ? (
        <ActionsMenu
          id={menuId}
          actions={menuActions}
          onRun={(action) => onRun?.(action.id)}
          onClose={() => setOpen(false)}
          returnFocusTo={sparkleRef}
        />
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------- preview card */

/* Nothing consequential happens without one of these. The primary button is
   named for the exact effect rather than "Confirm", because that name is the
   only thing standing between a proposal and a real action. */
export function PreviewCard({
  title,
  effect,
  children,
  why,
  primary,
  onPrimary,
  onCancel,
  style,
}: {
  title: string;
  effect: string;
  children?: ReactNode;
  why?: ReactNode;
  primary: string;
  onPrimary: () => void;
  onCancel: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div className="cu-card pill-glass" style={style}>
      <div className="cu-card__head">
        <span className="cu-card__title">{title}</span>
        <span className="cu-card__tag">PREVIEW</span>
      </div>
      <p className="cu-card__effect">{effect}</p>
      {children}
      {why ? (
        <details className="cu-card__why">
          <summary>
            <Chevron size={11} />
            Why these
          </summary>
          {why}
        </details>
      ) : null}
      <div className="cu-card__foot">
        <button type="button" className="cu-card__cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="pill-raised cu-card__go" onClick={onPrimary}>
          {primary}
        </button>
      </div>
    </div>
  );
}
