# Caret landing page

A one-page static site for [Caret](https://github.com/theodorexli/hackathon-2026-09-19),
a Mac assistant that proposes a next step from whatever is on your screen and
waits for you to accept it. This repository is vendored into Caret as a Git
submodule at `sites/landing`.

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then writes dist/
npm run preview    # serves the built dist/
```

Vite builds with `base: "./"` so `dist/` works from any path prefix. There is
no server, no backend, and no analytics.

## What is on the page

Nav, hero, a key legend, a four-step sticky explainer, three workflow stages,
"Under the hood", "Built at a hackathon in Austin", a closing, and the footer.
The page is a Mac desktop: pixel-art Austin as wallpaper, real-looking app
windows over it, and the only thing Caret adds to any of them is a 40px blue
asterisk with a glass strip beside it.

### The hero demo is the argument

`src/components/hero/ReplyComposer.tsx` types one opening line, then lets you
switch what else is open in the browser. Travel tabs and job-hunting tabs
produce different completions for the same words. That is the product's claim
in one interaction, which is why the context switch is a control rather than a
sentence.

The completions are a seeded local script. There is no network call and no
model. Type something the script does not know and nothing appears.

### The workflow stages

`src/components/sections/Workflows.tsx` holds the three seeds from
`caret/workflows.json` and nothing else: revise, book-flight,
book-calendar-link. The calendar stage's times, buffers and dropped candidates
come from `fixtures/meeting.json` and `caret/planner.py`. The flight itinerary
is a sample picked to stay consistent with that calendar: it departs after the
9–10 busy block, lands before the 1pm, and returns after it. It is labelled a
sample because no timetable is connected.

Two constraints shaped all of it, and both are worth preserving:

**The demos autoplay once when scrolled into view.** Pointer or keyboard focus
hands control to the visitor and stops the script. Each stage can be reset and
stepped through manually. These are local examples with no external effects.
Reduced motion disables autoplay and resolves the flight animation immediately.

**It never listens for keys on the document.** Tab, Escape and the arrow keys
work because the controls are a native `<textarea>`, `<button>`, `<input
type="radio">`, `<details>` and a `role="menu"`, so the keys belong to whatever
the visitor has focused. The real app owns a system shortcut; a web page should
not take one. The only global listeners in `src/` are a passive scroll listener
for the parallax and a pointerdown for click-outside on the menu.

Two invariants worth re-checking after any edit: Tab inside the composer must
leave the field when there is no offer and must not when there is, and no
`role="img"` window may contain a focusable control.

## Where the design comes from

The glass text treatment and the button material were built and measured in
another project and are reused here rather than reinvented:

| File here | Ported from `cluely-manifesto-clone` |
| --- | --- |
| `src/components/glass-text/*` | `src/components/glass-text/*` |
| `src/components/material.css` | `src/styles/lander/material.css` |
| `src/styles/editorial.css` | the type rules in `src/styles/lander/editorial.css` |

`src/components/caret-ui/` is not ported: it redraws the product's own controls
from `apps/mac/Sources/Caret/TriggerButton.swift` and `PinnedActionsStore.swift`
at the sizes those files declare. The glass under them is the same
`.pill-glass` face, so the product's material and the page's are one material.

Those files keep their original comments, which explain why each layer is
built the way it is. Three things changed in the port, all mechanical:

1. The palette moved from forest green to Caret's ink blue.
2. The dark theme came out, because this page is light only. Nothing else
   about the construction changed, so re-adding a theme means supplying the
   token block again.
3. `book-demo-button` was renamed `action-button`, and the unused second CTA
   tier (`pill-cta-soft`) was dropped.

Every contrast figure quoted in those files was re-measured against the new
palette. `tools/measure-contrast.py` samples the real composite the browser
paints (the base radial, then the specular through `overlay`, then the hover
layer) and reports the worst sample inside the glyph footprint:

```sh
python3 tools/measure-contrast.py
```

The blue holds AA on every button state including hover, which the source
palette could not; the note at the top of `material.css` has the numbers.

## Layout notes

`src/index.css` declares `@layer base, components, page` before anything else.
The ported files assume a layer order that Tailwind used to supply; without
that line, unlayered rules would outrank the material regardless of
specificity.

The page uses one measure (`--page-max-width: 1200px`), so the header pill, the
hero copy, every stage and the footer wordmark land on the same rails.

Breakpoints that mean something: at 900 the how-it-works stage stops being
sticky and each step carries its own frame inline, and the workflow stages go
from two columns to stacked. At 640 the pinned strip folds away beside a field
and the sparkle carries the actions through its menu to leave room for the field.

One trap worth knowing about: `.mac-stage` sets `position: relative` in
`mac.css`, which is imported after `page.css` into the same layer. A bare
`.wf__desk { position: absolute }` therefore lost on import order and collapsed
every stage to zero height. The stage-filling rules are qualified by their
parent (`.wf__stage .mac-stage`) so they win on specificity instead.

## Art

`public/art/austin-dusk.png` is the desktop wallpaper, the backdrop of every
stage, and the closing band. `public/art/pershing-hall.png` is the Austin
section. Both are illustrations, not photographs, and both are drawn with
`image-rendering: pixelated` because any smoothing turns the dithering to mud.

## Dependencies

React, React DOM, lucide for icons, and the two self-hosted font families.
CSS handles visual motion; small React timers drive the scripted demos. There
is no animation library.

Icons come from lucide rather than hand-typed path data, at one stroke weight
and one grid. `src/components/Icons.tsx` re-exports the handful the page uses
and holds the single authored drawing, the curly arrow that points at the hero
composer; that one is linework aimed at a specific place on the page, not an
icon. `public/favicon.svg` is lucide's sparkle on the product blue.

There is no test framework: this is presentation code, and the checks that
matter are a build, a type-check, and checking the demos in a browser.
