# glass-text

Gives a display-size accent word a physical material: a lit face, a crisp edge
along the bottom of each glyph, and a cast underneath. Static. No animation,
no JavaScript beyond rendering three spans.

Ported from the Sillion lander (`src/components/glass-text/`). The full
reasoning lives in the comments in `glass-text.css`, which came across intact;
this file is the short version.

```tsx
import { GlassAccent } from "@/components/glass-text";

<h1 className="editorial-display">
  See what it will do. Then <GlassAccent className="editorial-accent">let it.</GlassAccent>
</h1>
```

## Two tiers, split by whether the accent has to wrap

**`full`** is the `<GlassAccent>` component: three registered copies of the
word, so the rim can carry its own fade mask. It is `display: inline-block`,
because the copies are absolutely positioned against it, and an inline-block
will not break across lines. A long accent is therefore dumped onto a line of
its own, or overflows its heading. Use it for one short accent known to sit at
the end of a line. On this site that is the hero's "let it."

**`flow`** is the two class names `glass-text glass-text--flow` on a single
inline element, with its edges from a `drop-shadow` chain. It wraps freely,
which is the only reason it exists. It cannot carry the fade mask, so its rim
outlines the whole downward silhouette; at display size that reads as the same
lighting. On this site that is the section heading's "before it acts."

```tsx
<em className="glass-text glass-text--flow editorial-accent">before it acts.</em>
```

**Neither tier is for text below 2rem.** Below that, leave the accent flat.

## Two rules worth not rediscovering

**Never use `text-shadow` on the face.** The face is a gradient clipped to the
glyphs with a transparent fill, and a transparent fill does not hide what is
behind it, so the shadow paints *through* the glyph interior instead of behind
it. `filter: drop-shadow()` follows the glyph alpha and composites outside the
fill, which is why the flow tier uses it.

**The flow tier's face stops must be opaque.** `drop-shadow` reads the face's
own alpha, so an alpha face lets the rim and cast paint through it: the same
failure by a slower route.

## Theming

Every value is a custom property on `:root`, declared in this directory's CSS.
Caret uses one light theme. The source also carried a dark theme, where the
face was the bright thing and the rim needed to be a mid-tone rather than the
paper-white one used here; that block was removed rather than left untuned, so
adding a theme means supplying the token set again.

Two variables come from outside this module and must exist in the host app:
`--color-accent`, the flat colour every fallback restores, and
`--color-accent-foreground`, used for selection.

Contrast is per-stop, because a gradient varies across the glyph, so the figure
that matters is the worst stop. Caret's ramp measures 13.41 / 7.50 / 4.20:1 on
the paper. The worst clears the 3:1 large-text floor this treatment is held to
and does not clear 4.5:1; that stop is the bottom of the em box, where the rim
overlays it, not the colour most of the glyph is painted in. Re-measure with
`tools/measure-contrast.py` after changing the ramp.

## Accessibility

The whole treatment is opt-in behind `@supports (background-clip: text)`. Where
that is unavailable the element keeps its `color` and renders flat, and the two
decorative copies stay `display: none`.

Three conditions strip the decoration and restore an opaque fill:
`forced-colors: active`, `print`, and `prefers-contrast: more`. The copies are
`aria-hidden` and `user-select: none`, so the word is announced once and copies
to the clipboard once.
