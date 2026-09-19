/* The loud cut of the action material, ported from the Sillion lander:
 * src/components/sections/BookADemoButton.tsx
 *
 * The span structure is what the CSS paints into and is kept as it was: a
 * shimmer layer, a blurred rim in its own wrapper, then the content. What is
 * dropped is everything around it that belonged to that product, which was a
 * Cal.com modal, a focus trap, and a letter-flip label.
 *
 * `data-hovered` is set on focus as well as hover so a keyboard user gets the
 * same lift, scale, rim and arrow. The specular hotspot is the one part gated
 * to real pointers, in material.css, because it is the layer that would drop
 * the label's contrast for someone who cannot move off it.
 */

import type { ReactNode } from "react";
import { useState } from "react";

type ActionButtonProps = {
  children: ReactNode;
  /** Renders an anchor when present, a button otherwise. */
  href?: string;
  onClick?: () => void;
  compact?: boolean;
  icon?: ReactNode;
};

export function ActionButton({ children, href, onClick, compact, icon }: ActionButtonProps) {
  const [hovered, setHovered] = useState(false);

  const className = compact ? "action-button action-button--compact" : "action-button";

  const interaction = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
    "data-hovered": hovered ? "true" : undefined,
    className,
  };

  const inner = (
    <>
      <span aria-hidden className="action-button__shimmer" />
      <span aria-hidden className="action-button__border-wrapper">
        <span className="action-button__border" />
      </span>
      <span className="action-button__content">
        <span className="action-button__label">
          <span className="action-button__text">{children}</span>
          {icon ? (
            <span aria-hidden className="action-button__arrow">
              {icon}
            </span>
          ) : null}
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <a {...interaction} href={href} target="_blank" rel="noreferrer">
        {inner}
      </a>
    );
  }

  return (
    <button {...interaction} type="button" onClick={onClick}>
      {inner}
    </button>
  );
}
