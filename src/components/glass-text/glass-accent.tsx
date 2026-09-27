/* Ported from the Sillion lander:
 * src/components/glass-text/glass-accent.tsx
 *
 * Unchanged except for the `cn` helper, which was one call and is inlined
 * here rather than pulling in clsx and tailwind-merge for it.
 */

/* The full glass-text tier is three registered copies of the same word: a
 * blurred cast, a masked rim, and the gradient face on top. See
 * ./glass-text.css for why the edges cannot be shadows, and for the flow tier
 * -- one element, edges from a drop-shadow chain -- which is what an accent
 * that has to WRAP uses instead of this component.
 *
 * The copies are markup rather than `content: attr(data-text)` on ::before and
 * ::after, which would fit in two pseudo-elements and is otherwise tempting.
 * Three things decided it:
 *
 *   - Generated content is not reliably hidden from assistive tech. VoiceOver
 *     announces ::before and ::after text, so the accent would be read three
 *     times with no way to mark the two decorative copies. `aria-hidden` on a
 *     real element is unambiguous.
 *   - Generated content cannot be given `user-select: none`, because it is not
 *     selectable in the first place -- but it is also not addressable, so
 *     there is no way to keep ::selection painting correctly on the face while
 *     the copies stay out of the clipboard. Real spans give both.
 *   - `attr()` puts the word in a `data-text` attribute as well as in the
 *     element, so the two can drift. Here the string is passed once and used
 *     three times.
 *
 * `children` is typed as `string` for that last reason: the copies have to be
 * duplicable and identical, which arbitrary nodes are not.
 */

type GlassAccentProps = {
  /** The accent word. A string, because it is rendered three times. */
  children: string;
  /** Typography classes for the call site, e.g. `editorial-accent`. */
  className?: string;
};

export function GlassAccent({ children, className }: GlassAccentProps) {
  return (
    <em className={className ? `glass-text ${className}` : "glass-text"}>
      <span className="glass-text__layer glass-text__cast" aria-hidden="true">
        {children}
      </span>
      <span className="glass-text__layer glass-text__rim" aria-hidden="true">
        {children}
      </span>
      <span className="glass-text__face">{children}</span>
    </em>
  );
}
