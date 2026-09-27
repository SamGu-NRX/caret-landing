# Caret landing, second pass

Reader: the Opus implementer working in `Caret-landing-work`, and Sam. This file is the
whole design. Where a choice was not obvious, the reason sits next to it.

Sources this design is built from: `Caret/README.md`, `Caret/docs/input-pipeline.md`,
`Caret/apps/mac/Sources/Caret/{TriggerButton,CaretApp,SelectionMonitor,StatusBarController}.swift`,
`Caret/caret/{planner.py,workflows.json}`, `Caret/fixtures/meeting.json`, `Caret/sources.json`,
Andrew's `hab-th` landing (`page.tsx`, `HowItWorks.tsx`, `EncoreScene.tsx`, `landing.css`),
atatapp.com and cotypist.app as rendered today, and the glass material already in the site.

## Direction

The page is a Mac desktop. Its wallpaper is pixel-art Austin at dusk. Real-looking app
windows float over it, and the only thing Caret adds to any of them is a 40 px blue
asterisk with a glass strip beside it. Everything on the page is either that desktop, the
product's own UI drawn at true size, or plain editorial type on paper explaining what the
UI is doing.

Two consequences run through every section:

- Lines only where the Mac draws them. Window chrome, the strip's 1 px chip separators,
  and a selection highlight are depictions of real things and stay. Every decorative
  rule from pass one (step dividers, panel head and foot rules, the footer rule, the
  facts box) goes. Separation comes from spacing, paper-tone bands, and shadow.
- The product is always the same object. One `CaretCluster` component is drawn in the
  headline as a specimen, in the hero composer in situ, and in every workflow stage.
  Its numbers come from `TriggerButton.swift`, not from taste.

The one risk: the headline ends with the real, clickable cluster at 1:1, so the sentence
"the size of an asterisk" is demonstrated by the object it names. Everything around it
stays quiet so that lands.

### What survives from pass one

| Keep as is | Replace |
| --- | --- |
| `GlassAccent` + `glass-text.css`, `ActionButton` + `material.css` tokens, header glass pill, footer wordmark with blinking caret, Newsreader + Schibsted, paper palette, `--ease-out`, focus ring | Hero layout, the calendar-only "Demo" panel (its option/evidence/hold machinery is reused inside the Calendar link stage), the three-column steps, the closing, every `border` outside a window mock, `.section-label` sans kicker |

## Tokens

Add to `tokens.css`. Existing values stay.

| Token | Value | Use |
| --- | --- | --- |
| `--caret-blue` | `#4285fa` | The asterisk fill and nothing else on the page. From `TriggerButtonView` `Color(red: 0.26, green: 0.52, blue: 0.98)`. It is the product's colour, distinct from the site's ink-blue accent `#23418f`, and keeping it exclusive is what makes the asterisk read as the product every time it appears. |
| `--ghost` | `#8b8d94` | Ghost text. 3.4:1 on white, on purpose below body-text AA: a proposal has to read as not-yet-ink. The same text is exposed to assistive tech through a live region, so nobody depends on the colour. |
| `--dusk` | `#1a1b3a` | Desktop stage backdrop under the wallpaper, the art shell behind the Pershing scene, the closing band. Matches the indigo of the generated art. |
| `--mac-selection` | `#b3d7ff` | Text selection in the Notes mock. macOS default. |
| `--window` | `#ffffff` | Window bodies. Windows are the only pure white on the page, which is what makes them float on the paper. |
| `--window-shadow` | `0 30px 60px -20px rgba(23,24,28,.45), 0 2px 6px rgba(23,24,28,.12)` | Every window. |
| `--traffic-close/min/zoom` | `#ff5f57` / `#febc2e` / `#28c840` | Window traffic lights. |
| `--kicker-font` | `var(--font-mono)` | Section kickers switch from sans to mono, uppercase, `0.75rem`, `letter-spacing: .08em`, tertiary, preceded by the 10 px sparkle glyph in `--caret-blue`. Andrew uses a mono eyebrow with a lit square; ours uses the product's own mark, so the recurring device means something. |

Type scale changes: H1 `clamp(2.75rem, 6vw, 5.25rem)`, line-height 1.0, tracking
`-0.02em`, centred. Section H2 `clamp(2rem, 3.6vw, 3.25rem)`. Sticky step titles
`clamp(1.75rem, 2.6vw, 2.5rem)`. Body stays `1.0625rem`. Everything inside a window mock
uses `-apple-system, "SF Pro Text", "Helvetica Neue"` at 13 px, because the windows are
depicting macOS and should not wear the site's type.

The `.pill-glass` face, rim and cast tokens are the material for the strip, the actions
menu and the preview card. The real app draws them in `ultraThinMaterial`; the site's glass
is the closest thing we have, and using it means the product's glass and the site's glass
are one material.

Colour scheme stays light only.

## Page sequence

Nav → Hero → Facts band → How it works (sticky, 4 steps) → Three workflows (3 stages) →
Under the hood → Built in Austin → Closing → Footer. Anchors: `#how`, `#workflows`,
`#revise`, `#flight`, `#calendar`, `#inside`, `#austin`.

### Nav

Existing glass pill. Links: How it works, Workflows, Under the hood, Austin. CTA: the
compact `ActionButton` "See the code ↗". Below 560 px the links hide, CTA stays.

### Hero

```
                ✱ NATIVE MAC · CURSOR HACKATHON, AUSTIN · 19 SEPTEMBER 2026

                              An assistant
                    the size of an asterisk.  (✱)[Book flight|Calendar link|Revise draft]
                                                   ↑ real CaretCluster, 40 px, +10 px after the period

     Caret is a native Mac assistant that lives beside your cursor. It finishes the
     sentence you are typing, or offers the next step from the thread you are reading:
     a cleaner draft, a flight, three meeting times. Tab accepts. Nothing runs before
     you have seen exactly what it will do.

                    [ Try it below ]      See the code ↗

┌─ DesktopStage ──────────────────────────────────────────────────────────────────────┐
│ ✱ Caret                                                  wifi  battery  Sat Sep 19  2:47 PM │  menu bar
│    ┌─ BrowserWindow ────────────────────────────────────────────────────┐          │
│    │ ● ● ●   ‹ ›   🔒 mail.google.com/mail/u/0/#inbox/FMfcgz…      ⟳     │          │
│    │  Dallas meeting                                          Inbox  ×  │          │
│    │  Alex Rivera <alex@example.com>                     Sat, Sep 19    │          │
│    │  Could we meet in Dallas next Tuesday? Please send three times     │          │
│    │  that leave room for travel.                                       │          │
│    │  ┌ Reply · To: Alex Rivera ──────────────────────────────────┐    │          │
│    │  │ Hi Alex, happy to come up. Tuesday works on my side.      │ (✱)[Book flight|Calendar link|Revise draft]
│    │  │ I'll send three times that leave room for the drive,|     │    │          │
│    │  └───────────────────────────────────────────────────────────┘    │          │
│    │   [ Send ▾ ]   A  📎  🔗                                          │          │
│    └────────────────────────────────────────────────────────────────────┘          │
│                     pixel-art Austin at dusk behind everything                       │
└──────────────────────────────────────────────────────────────────────────────────────┘
  ◦ Interactive concept demo    Type in the reply. Tab accepts, Esc dismisses.  [Replay]
```

Copy is centred above the stage, as on Andrew's site, because the headline's cluster sets
up the stage below it. The stage is `width: 100%` of the 1200 px container, aspect
`16 / 9.5`, radius 16, `--window-shadow` doubled, wallpaper `object-fit: cover;
image-rendering: pixelated; object-position: 50% 70%` with the 24 s drift from Andrew's
`.encore-scene-art`. Menu bar: 24 px, `rgba(255,255,255,.55)` with
`backdrop-filter: blur(20px)`. The status item sits on the right, where macOS puts status
items, with the sparkle glyph and the title `" Caret"` that `StatusBarController` sets.
Clock reads 2:47 PM, thirteen minutes before submissions closed.

The browser window is 880 × 470 at desktop, left 8 %, top 12 %. The reply composer sits
high in the window so the ghost text is inside the viewport at 1280 × 800 without
scrolling, which is why the thread shows one short message and not a conversation.

Headline cluster: DOM sibling after the `h1`, in a flex row, `align-items: flex-end`, with
`margin-bottom` equal to half the difference between the last line's height and 40 px so
it sits on the second line's vertical centre, `margin-left: 10px` (the `x + 10` from
`TriggerButtonController.update`). Its chips scroll to `#flight`, `#calendar`, `#revise`.
Its sparkle opens the real menu; menu items do the same scrolls. On narrow screens the
cluster wraps onto its own line under the headline; that is fine.

"Try it below" scrolls the stage into view and focuses the composer. "See the code" is the
existing link.

### Facts band

Full-bleed `--color-surface-alt` band, no border, no crosses. Five facts, big value in
Newsreader 500 `2.25rem`, label in body sans tertiary underneath. Grid 5 across from 960,
2+2+1 below, 1 across below 480.

| Value | Label |
| --- | --- |
| 40 px | the whole interface: one asterisk and a strip |
| 2 s | at most one decision while something changes |
| 3 answers | abstain, inline, action |
| ⇥ | accepts. It never sends. |
| $0 | it stops at the payment page |

### How it works (`#how`)

Kicker: `✱ HOW IT WORKS`. H2: "One loop, two decisions, and a Tab key." with the flow-tier
glass accent on "a Tab key".

Andrew's `HowItWorks` pattern, taken as built: `ol` of steps on the left, each
`min-height: 64vh`, opacity .35 at rest and 1 when active, activation by
`IntersectionObserver` with `rootMargin: -45% 0px -45% 0px`; a `position: sticky` stage
on the right at `top: calc(50vh - 240px)`, height 480, holding one absolutely positioned
frame per step that crossfades (opacity + 12 px translate, 350 ms `--ease-out`). Below
900 px the stage is `display: none` and each step renders its own frame inline under its
text. Step index: mono `0.8125rem`, tertiary, goes `--color-text-primary` and weight 600
when active; no border-left bar.

Parallax: on scroll (rAF-throttled) write the section's progress 0..1 to `--how-p` on the
section. The stage's wallpaper layer moves `translateY(calc(var(--how-p) * -40px))`, the
window layer `translateY(calc(var(--how-p) * -16px))`. Enough to read as depth; not enough
to notice as a trick. Off under reduced motion.

Every frame is the hero's `DesktopStage` at 60 % scale (wallpaper darkened by a
`rgba(26,27,58,.35)` overlay so the frame's UI reads first), with the same Gmail window,
and one thing added per step:

| # | Title (serif) | Body | Frame |
| --- | --- | --- | --- |
| 01 | It reads the frame you are in. | Every two seconds, while something changes: the front app, the focused field and selection, the clipboard if you allowed it, the last few things you looked at from Screenpipe, and whatever the last action returned. Each piece keeps its source and capture time. If a source is missing, the frame says so instead of inventing it. | Window dimmed under a labelled outline. Mono chips down the right edge: `app  Google Chrome`, `field  reply body · rev 41`, `clipboard  none`, `history  3 items · Screenpipe`, `observation  none`. |
| 02 | It decides whether to say anything. | Jev, the judge, receives the frame and three allowed answers: abstain, inline, action. Most of the time the answer is abstain and you see nothing. Inline means a short continuation or a spelling fix, written by a fast model on Groq. Action means a second question with a fixed list: which registered workflow, or none. | Two small glass cards stacked over the window. Card 1 `Jev · decision 1` with `ABSTAIN  INLINE  ACTION`, ACTION filled in `--caret-blue`. Card 2 `Jev · decision 2` with `book-flight  book-calendar-link  revise  NONE`, `book-calendar-link` filled. Tag `rev 41` on both. |
| 03 | It offers, at the cursor. | Inline text appears as ghost text after the caret. Actions appear as the blue asterisk and your pinned strip at the edge of the field or selection. Hover reveals; nothing steals focus. Escape dismisses. Tab means one thing at a time, and never a send. | The composer with ghost text, and the cluster at the field edge with the "Calendar link" chip in its hover state. |
| 04 | It previews, then acts, then stops. | Accepting an action opens a preview that names its exact effect and the evidence behind it. Only then does a workflow run: Gmail and Calendar adapters, Skyvern in the browser, or a native worker for Mac apps. Booking stops at the payment page. Holds stay tentative until you confirm. | The `PreviewCard` for Calendar link over the window (see Calendar stage, state `options`), and behind it, peeking, the Safari mock's "Stopped before payment" banner from the Flight stage. |

### Three workflows (`#workflows`)

Kicker: `✱ THREE WORKFLOWS`. H2: "Three workflows, one shape." Standfirst: "Each one is
ordinary code with a Jev decision at the points that need judgement. They run here on
sample data. Step through them."

Three stages, stacked, full container width, alternating sides: text column 5/12 and window
column 7/12, swapped for the middle one. Each stage is a `DesktopStage` variant without the
menu bar (radius 16, `--dusk` backdrop, wallpaper at 40 % darkening so the windows carry
the scene), with the same "Interactive concept demo" chip in the top-left corner. Controls
are ordinary buttons under the text column; nothing advances on a timer. Every state has
"Start over".

Eyebrows: `WORKFLOW 01 · REVISE`, `02 · BOOK A FLIGHT`, `03 · CALENDAR LINK`, the ids from
`workflows.json`.

**01 Revise (`#revise`).** Title: "Rough notes, selected. Cleaner notes, in place." Body:
"Select anything in a supported app. The asterisk moves to the selection. Revise shows the
rewrite before it touches anything, replaces exactly the selection, and leaves ⌘Z working."

Window: Apple Notes mock (native title bar, toolbar with the compose and format icons as
simple glyphs, note title "Demo run of show", date line). Body text:

> ok so the demo: we show the asterisk then tab then the flight thing, need to make sure it
> doesnt buy anything lol, also calendar

| State | Window | Cluster / card | Controls |
| --- | --- | --- | --- |
| `idle` | Note as above | hidden | "Select the paragraph"; clicking the paragraph does the same |
| `selected` | Paragraph in `--mac-selection` | Cluster at selection `maxX + 6`, `midY` (the `.selection` anchor in `SelectionMonitor`) | Chip "Revise draft ⌘⌥3", or "Revise" button |
| `preview` | unchanged | `PreviewCard` "Revise draft", effect "Replaces the selected text in Notes", a two-row diff: the rough text struck in tertiary, then "Demo order: show the asterisk, press Tab, then run the flight booking. Confirm it stops before payment. Then the calendar link." Footer: Cancel · **Replace text** | same, plus Cancel |
| `replaced` | New text, selection cleared, cluster hidden | one line under the window: "Replaced. ⌘Z restores the original." | Start over |

**02 Book a flight (`#flight`).** Title: "From the thread to the payment page, and not one
step further." Body: "Caret reads the ask, your calendar and the travel buffers, then drives
the airline site through Skyvern, re-reading the page after every step. It stops before
paying. On purpose, every time."

Window: Apple Mail mock, thread "Tuesday in Dallas?" from Alex Rivera: "Can you be in Dallas
Tuesday for the 1pm? Happy to cover the flight." with an empty reply field below.

| State | Window | Cluster / card | Controls |
| --- | --- | --- | --- |
| `idle` | Mail thread, reply field focused | Cluster at the reply field's right edge, `midY` (the `.input` anchor uses the element frame, so for a field the asterisk docks to the field's edge, not the caret) | Chip "Book flight ⌘⌥1", or "Book a flight" button |
| `preview` | unchanged | `PreviewCard` "Book a flight", effect "Searches flights in your browser. Stops before payment.", route block `AUS → DFW · Tue Sep 22 · arrive before 12:00 · return after 15:30`, evidence rows: Read "Dallas Tuesday for the 1pm"; Calendar "busy Tue 9:00–10:00"; Buffers "60 min before, 30 after · sample inputs"; Timetable "sample, not a real fare". Footer: Cancel · **Search in browser** | same |
| `driving` | A Safari window slides up over Mail (translateY 24 px → 0, 320 ms). Its page is a plain airline search mock. A Skyvern step list in the card's place ticks through: Open search · Set AUS → DFW, Sep 22 · Filter arrive before 12:00 · Choose fare (sample) · Open checkout. Each step observes, acts, re-observes; show that as a three-dot rhythm per step, 600 ms each | | "Skip to the end" |
| `stopped` | Safari shows a checkout mock: fare summary "AA 2419 · 07:35 → 08:40 · $148 · sample", card fields empty. A glass banner across the top of the page: sparkle, "Stopped before payment. Nothing was bought." Buttons inside: "Open in your browser" (disabled, "Not connected") · Cancel | | Back to Mail · Start over |

**03 Calendar link (`#calendar`).** Title: "Three times that fit, with the reasons
attached." Body: "From one email it proposes three slots that clear your calendar and the
drive, drafts the reply, and holds the times tentatively. When they pick one, you confirm
once. It keeps that hold and removes only its own others."

Window: the hero's Gmail mock with the fixture thread ("Could we meet in Dallas next
Tuesday? Please send three times that leave room for travel."), plus a narrow week column
on the right of the window showing Tue Sep 22, 9:00 to 17:00, with the 9:00–10:00 busy
block solid grey. Every time and buffer below is from `fixtures/meeting.json` and
`planner.py`.

| State | Window | Cluster / card | Controls |
| --- | --- | --- | --- |
| `idle` | Thread, reply field focused | Cluster at reply field edge | Chip "Calendar link ⌘⌥2", or button |
| `options` | The request sentence gets the pass-one highlighter sweep | `PreviewCard` "Book a calendar link", effect "Drafts a reply with three times and holds them on your calendar", options as the pass-one radio rows: Tue Sep 22 · 11:00–11:30, 13:00–13:30, 15:00–15:30. Disclosure "Why these, and not others": Read "…three times that leave room for travel"; Busy "Tue 9:00–10:00"; Buffers "60 before, 30 after"; Dropped "10:30, overlaps the busy block once the drive is added"; Dropped "16:00, its source failed". Footer: Cancel · **Send draft and hold 3 times** | same |
| `held` | Reply field fills with the planner's draft ("I can meet at one of these times:" and the three times). The week column shows three hatched holds at 10:00–11:30, 12:00–13:30, 14:00–15:30 (start − 60, end + 30, the planner's `hold_start`/`hold_end`) | Card collapses to a status line: "Draft sent · 3 holds placed" with a mono `sample · nothing left this page` tag | "Alex replies" · Start over |
| `replied` | A new message appears in the thread, tagged `Staged reply (sample)`: "13:00 works for me. See you Tuesday." | `PreviewCard` "Confirm 13:00", effect "Keeps the 13:00 hold as the meeting. Removes this workflow's other two holds and nothing else." Footer: Cancel · **Confirm 13:00** | same |
| `confirmed` | Week column: 12:00–13:30 becomes a solid `--color-accent-soft` event "Dallas meeting", the other two hatches fade out | status line "Kept 13:00. Released 11:00 and 15:00." | Start over |

### Under the hood (`#inside`)

Kicker: `✱ UNDER THE HOOD`. H2: "Code owns the branches. Jev picks one." Standfirst: "Two
questions to a judge, one fast writer, and executors that only run what a workflow already
allows. Names below are the ones in `docs/input-pipeline.md`."

Four blocks, generous vertical rhythm, no rules between them.

**The loop.** A diagram built from mono-labelled tone boxes (`--color-surface-alt`, radius
10, 12 px padding) with `→` glyphs between them, wrapping to a vertical `↓` column below
760 px. No connector lines. Decision nodes wear the glass face. Sequence:

`InputSnapshot` (live AX focus and caret reader · revision · text digest) → `ContextFrame`
(app and window · field and selection · permitted clipboard · Screenpipe history with
source ids and capture times · last computer-use observation) → **Jev 1** `ABSTAIN | INLINE
| ACTION` → two branches:
INLINE → Groq fast model → `InlineProposal` (exact range · replacement · original digest) →
`⇥`;
ACTION → **Jev 2** `workflow id | NONE` → `ActionProposal` (visible title and effect ·
required inputs · evidence · execution method) → strip → preview → `WorkflowRun` (Gmail and
Calendar adapters · Skyvern for browser steps · computer-use-jev for native steps) →
recorded effects and remote ids.

Under it, one sentence in body: "A model's confidence is not permission to act. Every
consequential step names its effect in the preview, and the stop before payment lives in the
workflow, not in a prompt."

**Cadence.** Three short paragraphs, no bullets: at most one first-stage call per 2,000 ms
while context changes, one request in flight, later changes folded into the newest snapshot;
unchanged snapshots, idle time, mouse-only movement, secure fields, IME composition and
Caret's own typing are skipped; every response carries the snapshot revision it answered,
stale ones are dropped, and the target is re-read right before an edit or action commits.
Close with: "2,000 ms is the starting setting. It is not a measured number, and nobody
should call it tuned until offer acceptance and interruptions have been counted."

**Keyboard.** A borderless table, zebra tone on alternate rows, keys in mono.

| Offer on screen | Tab | ⌘⌥1 · 2 · 3 |
| --- | --- | --- |
| Nothing | reaches the app unchanged | reach the app unchanged |
| Inline text | commits the completion or the fix | pass through |
| Action strip | passes through unless a card shows a Tab hint | run that pinned action |
| Workflow preview | only the exact visible primary effect, when the preview owns Tab | pick visible alternatives |

Footnote in tertiary: "The build on this page uses ⌘⌥. The pipeline contract targets ⌘1 · 2
· 3 once shortcut ownership is scoped to a visible offer."

**Parts.** Two columns. Left, the app: "Swift, AppKit and SwiftUI in `apps/mac`. A Python
core in `caret/` with the planner, the workflow registry and local SQLite state. Jev for
both decisions. A Groq-hosted model for inline text." Right, the pinned upstreams from
`sources.json`, each as name, licence, one-line role: KeyType (MIT) inline autocomplete,
caret geometry, insertion · GhostType (MIT) text interaction components · Computer Use Jev
(MIT) native Mac actions through a persistent Swift AX worker and a Go coordinator ·
Skyvern (AGPL-3.0) browser execution · Screenpipe (MIT except `ee/`) history and context.

### Built in Austin (`#austin`)

Kicker: `✱ BUILT IN A DAY`. H2: "Nine to three, at The Pershing." Body: "Caret was built at
the Cursor hackathon in Austin on 19 September 2026. Doors at nine, building at ten,
submissions at three. Below is where it stood that evening."

Stage: image B (the Pershing hall) in a shell with radius 16 and `--dusk` background,
aspect 3:2, 1:1 with Andrew's `EncoreScene` mechanics: drift, the warm `scene-glow`
atmosphere, ten sparks, and one speech bubble cycling every 5.2 s with `speech-in` 350 ms
`cubic-bezier(.16,1,.3,1)`. The bubbles are real commits from the repository, mono short
SHA as the name line, message as the body, anchored above the laptops:

- `e79e2da` · feat(mac): pinned actions, install packaging, and accessibility reconnect
- `827a387` · fix(mac): polish pinned glass strip and scrollable action menu
- `8753450` · chore: narrow upstreams and define the shared Jev workflow contract
- `cc52862` · feat(dev): flashbang u with developer tools

Bottom-left location label, mono like Andrew's: `30.2672° N · 97.7431° W` / **The
Pershing, Austin**.

Under the stage, the status note. One paragraph then two lists side by side, no borders:

"The demos on this page are interactive concepts on the repository's sample data. Nothing
here sends, books, holds, or touches your Mac."

Built today: the native app: asterisk beside supported fields and selections, pinned glass
strip, scrollable action menu, ⌘⌥ and ⌘⌥1 · 2 · 3, Accessibility reconnect · the planner
and local hold and confirm state on sample data · the shared workflow contract.
Being wired: the Groq inline writer and both Jev decisions.
Not connected yet: Screenpipe history · Gmail and Calendar · Skyvern · native execution ·
Tab acceptance in other apps.

### Closing

Kicker: `✱ WHERE IT GOES`. H2 (large, `editorial-display` size): "Not another window. An
asterisk." Body, max 46ch: "The shape is the point. Read what is on screen, offer one
thing at the cursor, show the effect, wait for Tab, stop before anything you cannot undo.
Everything else is a workflow to register."

Buttons: `ActionButton` "See the code ↗" and a quiet underlined link "Read the pipeline
contract" to `REPO_URL + "/blob/main/docs/input-pipeline.md"` (verify it resolves before
shipping, same rule as `site.ts`).

Then a full-bleed band, height `clamp(160px, 22vw, 280px)`, image A cropped to its lower
third (`object-position: 50% 78%`), the lake and the lit skyline, with a mono caption
bottom-left `30.2672° N · 97.7431° W · Austin`. It bookends the hero without a third image.

### Footer

Existing giant wordmark and blinking caret. Remove the rule; use `margin-top: 2rem` on the
meta row. Meta: "Built at the Cursor hackathon, The Pershing, Austin, 19 September 2026.
Sample data only." and "GitHub".

## The product UI, drawn from the Swift source

One set of components, used everywhere. Numbers are from `TriggerButton.swift` and
`CaretApp.swift`; where the site deviates, the reason is stated.

**`Sparkle`.** 36 px circle, `--caret-blue` at .96 alpha (1.0 on hover), a white 4-point
sparkle (SF Symbol `sparkle`; draw an equivalent SVG at 17 px, semibold weight), shadow
`0 2px 6px rgba(0,0,0,.18)`, inside a 40 px hit box. `aria-label="Caret actions"`. Press
scales to .97.

**`PinnedStrip`.** Capsule, 40 px tall, `.pill-glass` face, edge and rims. Up to three chips
(`PinnedActionsStore.maxPinned`), each a `button` 10 px medium, `max-width: 58px`,
`padding: 0 8px`, single line, ellipsis. 1 × 14 px separators at `rgba(23,24,28,.12)`.
Hover: `rgba(23,24,28,.10)` fill with the capsule radius on the outer chips only, square
between. `title="Book flight (⌘⌥1)"`. Demo pins are the three seeds in slot order:
Book flight ⌘⌥1, Calendar link ⌘⌥2, Revise draft ⌘⌥3. Real defaults come from
`PinnedActionsStore.load()`, which this design did not read; three seeds are the honest
choice for a page about three workflows.

**`CaretCluster`.** Sparkle then strip, 4 px gap, 40 px tall. Positioned by the stage, not
inside any window: it is a floating `NSPanel` in the app and may hang past a window's edge.
Anchor rules: selection → `selection.maxX + 6`, `selection.midY`; field → `field.maxX + 6`,
`field.midY`; then origin `x + 10`, `y − 20`. If the cluster's right edge would leave the
stage, flip to `anchor.x − width − 10`; clamp to the stage (mirrors `AXHelpers.clamp`).
Appears 180 ms `--ease-out`, opacity 0 → 1 and scale .9 → 1 from its left-centre. Hidden
while the menu is open (`showPanel` calls `trigger.hide()`), back when it closes.

**`ActionsMenu`.** 260 px wide, `.pill-glass` face on radius 10, rows 24 px, `padding: 4px`
vertical, three rows for this page. The app lists eight titles, but only three are
registered workflows, and showing the rest would be inventing capability. Row: title 13 px, then the shortcut
`⌘⌥n` in 12 px tertiary mono when pinned, then a pin glyph 11 px (filled and accent when
pinned). Hover row: radius 5 fill `rgba(23,24,28,.10)`. Opens at `sparkle.right + 16`,
vertically centred on the sparkle, 160 ms `--ease-out`, scale .96 → 1, `transform-origin:
left center`; closes 100 ms. `role="menu"`, arrow keys move, Enter runs, Escape and click
outside close and return focus to the sparkle. Pin toggling reorders the strip live; keep
it, it is cheap and it teaches the strip.

**`PreviewCard`.** 360 px, glass face, radius 10, `--window-shadow`. Header: workflow title
13 px semibold and a mono `PREVIEW` tag. Effect line in secondary. Body varies per
workflow. Optional disclosure "Why" using pass one's `.evidence` styling. Footer: quiet
"Cancel" and a `pill-raised` primary named for the exact effect. Anchors beside the cluster
on desktop, becomes a bottom sheet inside the stage below 640 px.

**Keyboard in demos.** No document-level listeners. A stage is a `section` with
`tabIndex=-1`; its `onKeyDown` handles `⌘⌥1/2/3` only while focus is inside it and a cluster
is visible, calling `preventDefault` once. ⌘⌥ is used rather than ⌘1/2/3 because ⌘1/2/3
switches browser tabs and must not be taken from a visitor; it also matches the build. Tab
and Escape are handled on the composer's textarea alone. Every shortcut has a visible click
equivalent.

## The hero composer

A `textarea` over a mirror. The textarea has `color: transparent; caret-color: var(--color-text-primary)`
and normal selection; the mirror is a `div` behind it with identical font, padding, width,
`white-space: pre-wrap; overflow-wrap: anywhere`, rendering the typed text in ink and the
offer after it. This is the standard way to get wrapping ghost text without fighting
`contenteditable` under React. Offers only exist at the end of the text; if the caret is
anywhere else, nothing is offered, which is also the pipeline's rule for a moved caret.

Script (the reply the demo knows): "Hi Alex, happy to come up. Tuesday works on my side.
I'll send three times that leave room for the drive, and I can hold whichever one you
pick."

Offer logic, run 350 ms after the last keystroke:

1. Normalise (`trim`, collapse spaces, case-insensitive). If the text is a prefix of the
   script, the completion is the next chunk up to the end of the sentence, at most 12
   words. Show it as ghost text.
2. Else, if the last word before the caret is in the misspelling map (`wroks→works`,
   `recieve→receive`, `teh→the`, `definately→definitely`, `calender→calendar`,
   `tommorow→tomorrow`, `seperate→separate`), show a correction: the word gets a 1 px dotted
   underline in `--caret-blue` in the mirror, and a 22 px glass pill floats above it with
   the fix and a `⇥` keycap. A replacement that is not a prefix continuation gets its own
   small preview rather than pretending to be ghost text.
3. Else abstain. Nothing appears. That silence is correct behaviour and the caption says so
   once: "No suggestion means Caret decided to stay quiet."

Keys, on the textarea only: Tab with an offer accepts it (ghost joins the text; correction
replaces the word) and `preventDefault`; Tab without an offer does its normal thing. Escape
dismisses and suppresses the same offer until the text changes. A typed character equal to
the ghost's first character consumes it silently; any other character clears the ghost and
restarts the timer. Clicking or tapping the ghost, or the correction pill, accepts, because
phones have no Tab key. Ghost text appears 120 ms `--ease-out` opacity 0 → .9, no translate;
accepted text goes `--ghost` → ink in 100 ms.

Live region: `aria-live="polite"` announcing "Suggestion: … Press Tab to accept" when an
offer appears, debounced 500 ms. Textarea label "Reply to Alex Rivera", description
"Suggestions appear after the caret. Tab accepts, Escape dismisses."

Autoplay: starts when the stage is 40 % visible and the visitor has not focused the
composer. Types the script at 40–70 ms per character with 220 ms pauses at punctuation,
deliberately typing `wroks` once so the correction shows. Before each accept, a `⇥` keycap
flashes beside the ghost for 300 ms. On finishing, the "Calendar link" chip shows its hover
fill for 900 ms and the caption becomes "Click ✱ or a pinned action to see what happens
next." Any focus or click in the composer stops autoplay instantly and leaves the text
where it is. "Replay" clears and restarts. Under reduced motion there is no autoplay: the
composer opens already holding "Hi Alex, " with the ghost visible and a "Play" button
replaces "Replay".

## Motion

| Moment | Spec |
| --- | --- |
| Page load | Hero copy: opacity 0 → 1, 8 px rise, 400 ms `--ease-out`, 60 ms stagger. Wallpaper fades 600 ms. Window rises 16 px and scales .985 → 1 over 500 ms at +200 ms. |
| Wallpaper | Andrew's `scene-drift`: scale 1 → 1.04, 24 s, ease-in-out, alternate, origin 65 % 65 %. Paused under reduced motion. |
| Sticky frames | opacity 0 → 1, translateY 12 → 0, 350 ms `--ease-out`; steps .35 → 1 opacity 300 ms. Parallax as above. |
| Cluster in | 180 ms, scale .9 → 1, opacity, from left-centre. Out 100 ms. |
| Menu | 160 ms in, 100 ms out, origin left-centre. |
| Preview card | 220 ms, translateY 8 → 0 and opacity; bottom sheet variant translateY 100 % → 0 over 260 ms. |
| Ghost text | 120 ms in, 80 ms out, opacity only. |
| Highlighter sweep | pass one's `mark-sweep` 380 ms. |
| Safari slide (flight) | translateY 24 → 0, opacity, 320 ms; Skyvern steps tick at 600 ms each, three-dot rhythm. |
| Speech bubbles | Andrew's 350 ms `speech-in`, 5.2 s cycle. |
| Buttons and chips | `:active` scale .97; hover fills 120 ms `ease`. |
| Reduced motion | No autoplay, drift, sparks, parallax or entrances; state changes are instant; the machines are identical. |

Transform and opacity only, except the highlighter's `background-size`, kept from pass one
for the reason given there.

## Art

Two generated images, both pixel art in the register of Andrew's `encore-palace.png`:
16-bit detail, fine dithering, crisp square pixels, an indigo and lavender sky with a peach
horizon, warm amber and gold lights. Deliver PNG at 1536 × 1024, optionally lossless WebP
beside it, never JPEG, whose compression smears pixel art. Both are `image-rendering: pixelated`.
No text and no logos in either image; generated lettering is always wrong and the page
adds its own captions.

**Image A, `public/art/austin-dusk.png`.** Hero wallpaper (cover, `50% 70%`, `loading="eager"`,
`fetchpriority="high"`), the sticky stage backdrop (darkened), the closing band (lower third).
Composition must keep the top 35 % as open sky so the menu bar and window sit on calm colour;
the subject lives in the lower half.

> Pixel art, wide landscape, 3:2. Austin, Texas at dusk from the south bank of Lady Bird
> Lake. Foreground: the Congress Avenue bridge with a long ribbon of bats lifting off into
> the sky, a kayak and two paddleboards on still water reflecting the city. Middle: the
> downtown towers with warm window lights, the Texas State Capitol dome lit amber on the
> left, the Frost Bank Tower's faceted crown on the right. Live oaks in silhouette at both
> edges. Sky: deep indigo at the top fading through lavender to a thin band of peach at the
> horizon, a few early stars; the upper third of the image is open sky with no objects.
> Water: teal-black with amber and gold reflections. Detailed 16-bit pixel art, fine
> dithering, crisp square pixels, no anti-aliasing, no text, no lettering, no logos, no
> people in the foreground.

**Image B, `public/art/pershing-hall.png`.** The Austin section stage (contain inside 3:2,
`object-position: 40% center` on narrow screens, `loading="lazy"`). Not Andrew's lagoon and
not three portraits facing the camera: an interior, a diagonal table, people from behind
and in profile, the room doing the work.

> Pixel art, 3:2. Inside a music hall in Austin turned into a one-day hackathon space,
> late afternoon golden hour. A long wooden table runs diagonally from the lower left
> toward the back, crowded with open laptops, coffee cups, a taco box, cables and
> notebooks. Four or five young builders seen from behind or in profile, one gesturing at a
> screen, none facing the camera. At the back, a small stage with a drum kit and a standing
> microphone under strings of warm bulbs. Framed paintings crowd the brick walls. Tall
> windows on the right let orange late light fall across the wooden floor. One laptop
> screen glows pale blue with a tiny four-point blue sparkle on it. Palette: indigo
> shadows, lavender highlights, warm amber and gold lights, honey wood tones. Detailed
> 16-bit pixel art, fine dithering, crisp square pixels, no anti-aliasing, no text, no
> lettering, no logos.

If a generation puts lettering anywhere, regenerate; do not retouch.

## Responsive

- 1280 and up: the layouts above. 960–1279: hero window 92 % wide, cluster may flip left
  per the anchor rule. Below 900: sticky stage hidden, inline frames per step; workflow
  stages stack window over text; the diagram goes vertical.
- Below 640: the hero stage becomes a 3:2 wallpaper band with the menu bar, and the browser
  window fills the container width and overlaps the band's bottom edge; the composer is
  three lines tall; the strip folds into the sparkle (sparkle only, menu carries the
  actions) because 234 px of cluster cannot sit beside a 320 px field. `PreviewCard` is a
  bottom sheet inside the stage. Facts band 1 across. Every scenario and every explanation
  stays on the page; nothing moves behind a tab.
- Touch: hover fills off under `(hover: hover) and (pointer: fine)`; ghost and correction
  pill are tappable; all buttons are 44 px tall or carry a pseudo-element hit area.

## Accessibility

Existing focus ring and skip link stay. Steps are a real `ol`; sticky stage frames are
`aria-hidden`, inline frames are not. Menu and card follow the roles above. Stage wallpaper
and art carry real `alt` text describing the scene (write it from the prompt). Every mock
window is `role="img"` with an `aria-label` naming the app and its state, except the hero's,
whose composer is real. Contrast: every text token stays at pass one's measured values; the
only new sub-AA text is `--ghost`, justified above.

## Build notes for the implementer

Reuse: `ActionButton`, `GlassAccent`, `glass-text.css`, `material.css`, `SiteHeader`,
`SiteFooter`, and from `demo/`: the option rows, hold hatch, `.evidence` disclosure, the
highlighter and `focusDemo`. Everything else is new. Suggested files, in build order so the
page is showable early:

1. `styles/tokens.css` additions, kicker style, remove rules. `components/ui/Sparkle.tsx`,
   `PinnedStrip.tsx`, `CaretCluster.tsx`, `ActionsMenu.tsx`, `PreviewCard.tsx`, one
   `caret-ui.css`.
2. `components/mac/DesktopStage.tsx`, `MenuBar.tsx`, `BrowserWindow.tsx`, `MacWindow.tsx`,
   `GmailThread.tsx`, `ReplyComposer.tsx` (textarea + mirror + offer logic), `mac.css`.
3. `Hero.tsx` with the specimen cluster and the stage; `FactsBand.tsx`.
4. `HowItWorks.tsx` on Andrew's mechanics, four frames built from the mac components.
5. `workflows/ReviseStage.tsx`, `FlightStage.tsx`, `CalendarStage.tsx`, sharing a
   `useStageMachine` hook (explicit state list, `next`, `reset`); `NotesWindow`,
   `MailWindow`, `SafariWindow`, `WeekColumn`.
6. `UnderTheHood.tsx` (diagram, cadence, keyboard, parts), `Austin.tsx` (scene, bubbles,
   status), `Closing.tsx`, art files from the Codex parent.

Two things to verify before calling it done: the hero composer's Tab never leaves the
textarea when an offer is showing and always does when none is; and no `keydown` listener
exists on `window` or `document` anywhere in `src/`.
