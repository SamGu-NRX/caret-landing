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

Nav, hero, a key legend, three workflow stages, "Under the hood" (which opens
with the four steps of the loop), "Built at a hackathon in Austin", a closing,
and the footer. Each demo is a Mac desktop: pixel-art Austin as wallpaper,
real-looking app windows over it, and the only thing Caret adds to any of them
is a 40px blue asterisk with its pinned strip beside it.

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
not take one. The only document listener in `src/` is a pointerdown for
click-outside on the menu.

Two invariants worth re-checking after any edit: Tab inside the composer must
leave the field when there is no offer and must not when there is, and no
`role="img"` window may contain a focusable control.

## Where the design comes from

The page is built the way the BaseScanning landing page is
(`house-scanning-landing`, its `styles.css` and `DESIGN.md`), in Caret's own
paper, ink and typefaces. The kgu.one design handoff that asked for it,
`HANDOFF-caret.md`, lists the rules; in short:

- **One left edge.** `.page-container` is 1280px wide with 56px gutters (36px
  at 980 and below, 20px at 760 and below). The wordmark, the headline and
  every section heading start on it.
- **Two typefaces, one display weight.** Newsreader 500 for `h1` and `h2`
  only, at BaseScanning's scale (`tokens.css`). Schibsted Grotesk for
  everything else. The mono appears only where the page depicts a keycap or a
  clock time.
- **One flat button shape.** `.button` is the 54px accent capsule, `.control`
  the 44px pale one, `.text-link` an underlined link. All press to 0.97 over
  140ms; hover changes colour only, and only for a real pointer. The focus ring
  is 3px of the accent at a 4px offset.
- **One section gap**, `--section`: 112px, 80px on phones.
- **Motion plays once.** The demos script themselves once and hand over;
  nothing loops, and scroll position drives nothing.

This page used to wear glass ported from the Sillion lander: glossy buttons
with a blue glow, a three-layer cast on "an asterisk.", and a glass header.
That material is gone. `src/components/caret-ui/` still names `.pill-glass`
and `.pill-raised`, because it redraws the product's own strip, menu and
preview card; `mac.css` now draws those as flat surfaces.

`src/components/caret-ui/` is not ported: it redraws the product's own controls
from `apps/mac/Sources/Caret/TriggerButton.swift` and `PinnedActionsStore.swift`
at the sizes those files declare.

Contrast ratios are noted beside each colour in `src/styles/tokens.css`. Text
sits on flat colour everywhere, so the ratio computed from the hex values is
what the screen shows.

## Layout notes

`src/index.css` declares `@layer base, components, page` before anything else.
Without that line, unlayered rules would outrank the layered ones regardless
of specificity.

Breakpoints that mean something: at 1100 the hero becomes two columns, with
the demo beside the headline. At 900 the workflow stages go from stacked to
two columns, and the nav links appear. At 640 the pinned strip folds away
beside a field and the sparkle carries the actions through its menu to leave
room for the field.

One trap worth knowing about: `.mac-stage` sets `position: relative` in
`mac.css`, which is imported after `page.css` into the same layer. A bare
`.wf__desk { position: absolute }` therefore lost on import order and collapsed
every stage to zero height. The stage-filling rules are qualified by their
parent (`.wf__stage .mac-stage`) so they win on specificity instead.

## Art

`public/art/austin-dusk.png` is the desktop wallpaper.
`public/art/austin-dusk-ink.webp` is the same painting printed in one ink blue,
written by `tools/ink-print.mjs` (its header has the recipe and how to run it).
`public/art/pershing-hall.png` is the Austin section. All three are
illustrations, not photographs, and all are drawn with
`image-rendering: pixelated` because any smoothing turns the dithering to mud.

`PAINTING` in `src/components/mac/Mac.tsx` decides where the wallpaper appears.
`"A"` (the default) shows it in full colour behind the hero only and puts the
ink print behind every other desktop, so the colour appears once and the
working demo stays the brightest thing on the page. `"B"` uses the ink print
everywhere; `"C"` drops the painting for a flat desktop. The Austin
illustration is not affected.

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
