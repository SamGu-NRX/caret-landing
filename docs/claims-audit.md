# Caret landing: claims audit

An evidence document, not a copy change. Every claim the landing page makes is
listed, checked against the hackathon code and against v2, and given a verdict
with file-and-line on both sides. No page copy, component or style was edited.

**What was read**

- Landing: `SamGu-NRX/caret-landing`, branch `restyle/basescanning` at commit
  `d12b95d4` (the rebuilt page, open as PR #2 into `main`). All line references
  marked **landing** are to this commit.
- Product: `SamGu-NRX/Caret`, read only, at tag `hackathon-v1` (the hackathon
  build) and at branch `v2/next` commit `98596a0d` (v2). References marked
  **v1** and **v2** are to those commits. Nothing was pushed, opened or
  commented in that repository.
- Caret PR #32 was read via the public GitHub API for status only. It is open
  and unaccepted.

**Verdict values.** *True* — the claim holds of that version as written.
*Partly* — a recognisable core holds but the claim overstates it. *False* —
the claim does not hold. *n/a* — the claim is about the other version or about
this page. Evidence is `path:line` in the named commit.

**Method note.** All reading was done offline against git objects and the
public GitHub API. No app was built or run, so nothing here is a runtime
observation; where behaviour is stated, it is stated by the code or docs cited.

---

## Milestone 1 — inventory

Every claim the page makes, as a visitor or screen reader meets it. "Demo
behaviour" rows cover what the demos act out, not only sentences.

| # | Claim (exact text) | Landing file:line | Kind |
|---|---|---|---|
| C1 | "An assistant the size of an asterisk." | Hero.tsx:52–57 | Capability/identity (the asterisk figure) |
| C2 | "A native Mac assistant that lives beside your cursor." | Hero.tsx:59–60 | Capability |
| C3 | "It finishes the sentence you are typing, or offers the next step from the thread you are reading." | Hero.tsx:60–62 | Capability |
| C4 | "Tab accepts, and nothing runs before you have seen what it will do." | Hero.tsx:61–63 | Behaviour/safety |
| C5 | "See the code" → `REPO_URL` | Hero.tsx:76–79; SiteHeader.tsx:24–26; Closing.tsx:19–22 | Provenance/destination |
| C6 | "Type in here. Tab takes the grey text." | Hero.tsx:114 | Demo behaviour |
| C7 | "A concept demo. The completions are samples written into this page, not a live model. Type something it does not know and it stays quiet." | Hero.tsx:129–132 | Honesty about the demo itself |
| C8 | Demo: autoplay types a shared opening line, then a ghost offer appears; the visitor's first input takes over (ReplyComposer.tsx:167–211). Offers arrive 350 ms after the last keystroke (141–153); unknown input produces nothing (80–108) | ReplyComposer.tsx | Demo behaviour |
| C9 | Demo: Tab accepts the ghost or a typo fix; with no offer, Tab passes through and leaves the field (ReplyComposer.tsx:280–288) | ReplyComposer.tsx | Demo behaviour |
| C10 | Demo: Escape dismisses the offer and changes nothing (289–293); legend: "esc — Dismisses, and changes nothing" (KeyLegend.tsx:14) | ReplyComposer.tsx; KeyLegend.tsx | Demo behaviour / keyboard claim |
| C11 | Demo: same opening line, different completion when "What else is open" switches between Travel and Job search (CONTEXTS, 40–61; re-ask on switch 155–165) | ReplyComposer.tsx; Hero.tsx:135–158 | Demo behaviour |
| C12 | Demo: typo fixes offered ("teh"→"the", etc.), described as "a simple correction" | ReplyComposer.tsx:63–73 | Demo behaviour |
| C13 | Legend: "⇥ — Accepts the text in front of you" | KeyLegend.tsx:12 | Keyboard claim |
| C14 | Legend: "⌘⌥1 — Runs a pinned action" | KeyLegend.tsx:13 | Keyboard claim |
| C15 | Legend: "sparkle — Opens the full list" | KeyLegend.tsx:15 | Keyboard/UI claim |
| C16 | Comment: "the keys the app actually binds today (PinnedShortcutFormatting maps slots to ⌘⌥1 … ⌘⌥3, and the menu bar item opens with ⌘⌥)" | KeyLegend.tsx:3–6 | Provenance (names v1 app files) |
| C17 | "Three workflows, one shape." + "Ordinary code, with a judgement call only where one is needed. Each runs here on the repository's sample data." | Workflows.tsx:549–553 | Capability/scope |
| C18 | Comment: "These are the three seeds in caret/workflows.json … every time, buffer and dropped candidate in the calendar stage comes from fixtures/meeting.json and caret/planner.py" | Workflows.tsx:1–7 | Provenance (names v1 files) |
| C19 | Revise: "The asterisk follows your selection. Revise shows the rewrite before it touches the document, replaces exactly what you picked, and leaves ⌘Z working." Demo: select → preview with diff → "Replace text" → "Replaced. ⌘Z restores the original." | Workflows.tsx:104–121, 156–173 | Capability + demo behaviour (preview before acting) |
| C20 | Flight: "From the thread to the payment page, and not one step further." "It reads the ask and your calendar, then drives the airline site, re-reading the page after every step. The stop before paying lives in the workflow, not in a prompt." | Workflows.tsx:231–232 | Capability/safety |
| C21 | Flight preview: "Searches flights in your browser. Stops before payment."; evidence "Fares — a sample, not a live timetable"; step list ends "Open checkout"; stopped banner: "Stopped before payment. Nothing was bought." | Workflows.tsx:271–297, 180–186, 313–318 | Demo behaviour (preview with evidence; stop before payment) |
| C22 | Calendar: "From one email it proposes three slots that clear your calendar and the drive, drafts the reply, and holds the times. When they pick one you confirm once, and it releases only its own others." | Workflows.tsx:383–384 | Capability |
| C23 | Calendar demo: button "Send draft and hold" (392, 481), status "Draft sent, three times held." (522); confirm card "Keeps 13:00 as the meeting and releases this workflow's other two holds." (524–534); status "Kept 13:00. Released 11:00 and 15:00." (537) | Workflows.tsx | Demo behaviour — Caret appears to send a draft itself |
| C24 | Calendar preview card: "Drafts a reply with three times and holds them on your calendar."; evidence: Busy / Travel / Dropped with reasons | Workflows.tsx:476–499 | Demo behaviour (preview names effect and evidence) |
| C25 | "Code owns the branches. The model picks one." + "Caret asks Jev one question about what is on your screen, and the judge may answer three ways. Everything it could pick was written down first." | UnderTheHood.tsx:56–60 | Architecture claim |
| C26 | Loop step 1: "It reads the frame you are in. … A missing source is recorded as missing, not filled in." | UnderTheHood.tsx:20–21 | Architecture/privacy-adjacent claim |
| C27 | Loop step 2: "It decides whether to say anything. One judge … three answers … Staying quiet is an answer, not a failure." | UnderTheHood.tsx:24–25 | Architecture claim |
| C28 | Loop step 3: "It offers, at the cursor. … Nothing takes your focus, and Escape makes it go away." | UnderTheHood.tsx:28–29 | Behaviour claim |
| C29 | Loop step 4: "It previews, then acts, then stops. … Only then does the workflow run, and booking stops at the payment page." | UnderTheHood.tsx:32–33 | Safety claim |
| C30 | "Stay quiet — Nothing appears. You keep typing." | UnderTheHood.tsx:39–40 | Behaviour claim |
| C31 | "Suggest text — A fast writer on Groq drafts the next few words as grey text after your caret. Tab takes it." | UnderTheHood.tsx:43–44 | Architecture claim (names Groq) |
| C32 | "Offer an action — A second question picks one of the workflows you registered, or none of them." | UnderTheHood.tsx:47–48 | Architecture claim (registered workflows) |
| C33 | "Confidence is not permission. Nothing with an effect happens on a model's say-so. Every consequential step names its effect in a preview first, and the stop before a payment page is written into the workflow rather than asked for in a prompt." | UnderTheHood.tsx:85–90 | Safety claim |
| C34 | "Where things run. Swift handles the Mac UI, Screenpipe supplies recent context, and Python stores workflow state in SQLite. The execution path uses Skyvern for browser steps and Computer Use Jev for native apps. Model calls send relevant context to their providers." | UnderTheHood.tsx:93–99 | Architecture claim (names Screenpipe, SQLite, Skyvern, Computer Use Jev) |
| C35 | "Read the pipeline contract" → `REPO_URL/blob/main/docs/input-pipeline.md` | UnderTheHood.tsx:103–112 | Provenance/destination |
| C36 | "Built at a hackathon in Austin." "One day, one room, three workflows." "Austin, Texas" | Austin.tsx:44–54 | Provenance |
| C37 | Rotating notes: "One asterisk. No second window to go and open." / "Tab accepts. Nothing sends by itself." / "The booking stops at the payment page." / "Sample data all the way down, for now." | Austin.tsx:16–21 | Capability/safety/provenance |
| C38 | "Every demo on this page runs on sample data. Nothing here sends, books, holds or touches your Mac." | Austin.tsx:58–61 | Honesty about the page itself |
| C39 | "Running today": asterisk beside supported fields and selections; pinned strip, action menu, shortcuts; accessibility reconnection; **Screenpipe startup and recent-context retrieval**; planner holding/confirming on sample data; the workflow contract the three seeds are written against | Austin.tsx:64–72 | Provenance/status (names hackathon parts) |
| C40 | "Still being wired": the inline writer and both judge decisions; mail, calendar, and the two executors; Tab acceptance inside other apps | Austin.tsx:74–80 | Status claim |
| C41 | Footer: "Built at the Cursor hackathon in Austin. Sample data only." + GitHub link | SiteFooter.tsx:8–11 | Provenance |
| C42 | The page's one outbound link, `REPO_URL = "https://github.com/theodorexli/hackathon-2026-09-19"`, with the comment "The one external destination on the page." | site.ts:1–4 | Destination fact |

---

## Milestone 2 — verdicts

### General claims

| # | Verdict — hackathon-v1 | Evidence (v1) | Verdict — v2 @ 98596a0d | Evidence (v2) |
|---|---|---|---|---|
| C1 | True | README.md:119 "a blue asterisk beside supported fields"; TriggerButton.swift:5–7 | **False** — v2's figure is Pebble, "the blob with eyes," the only one; seed and wren retired 2026-10-09 | LineContent.swift:29–35; CaretSettings.swift:88–89 |
| C2 | True | README.md:55; apps/mac inline ghost panel (InlineGhostPanel.swift) | True | README.md:3 "a copilot that lives on your own Mac"; apps/caret/README.md:3 "ghost text at the caret in any app" |
| C3 | Partly — inline completion and ACTION offers are the designed modes, but integration "still in progress" | README.md:55; input-pipeline.md:35, 41 | Partly — inline ghost text is real (local model); "next step from the thread" exists as fills, action lines, routines and Ask, driven by the live screen model, not by reading one thread | apps/caret/README.md:3–4; helper/README.md:52; AGENTS.md:42–44 |
| C4 | True as contract; "nothing runs before you accept" is the stated rule | input-pipeline.md:41, 70; README.md(v1):64 | True — the executor holds an act grant only from an accepted offer, bounded to one window | README.md:3, 11; executor.ts:13–14; apps/screen-reader/README.md:35 |
| C5 | True — the link targets the hackathon repo | site.ts:4 | See C42 — destination question, decision for Sam | — |
| C7 | True of the page (all demos are seeded local scripts; no network) | ReplyComposer.tsx:8–12; useStage.ts | n/a (a claim about this page, which is the same page for both) | — |
| C17 | True — exactly three seeds | caret/workflows.json:1–24 | Partly — the three seeds survive only inside the v1 starter still in the tree; v2's product has skills/routines/fill, not these three registered workflows | README.md:5, 49–51; AGENTS.md:39 |
| C25 | True — ABSTAIN/INLINE/ACTION, choices written down first | caret/judge.py:21–24; input-pipeline.md:23–33 | True — same shape: one Jev judge, ABSTAIN/INLINE/ACTION, options code built | README.md:18; AGENTS.md:47 |
| C26 | True — failed sources dropped, nothing filled in | memory-bank/productContext.md (v1):27–28, 44 | True — the screen model records truncation; the ledger refuses text that does not stand in its source | apps/screen-reader/README.md:23 ("A cut-short walk says `truncated`"); privacy.ts:545–549 (locatable check) |
| C27 | True | judge.py:1–11 | True | AGENTS.md:47; helper/src/routing/judge.ts |
| C28 | True as contract ("Escape dismisses; it does not rewrite text"; previews dismissed on field change) | input-pipeline.md:52, 70 | True | OfferArbiter.swift:310, 332 ("Esc declines"); TapThread.swift:34 |
| C29 | Partly — designed and enforced in the seed (`stop_before: "payment"`), but the live browser path (Skyvern) was never product-complete | workflows.json:7–8; input-pipeline.md:70; README.md(v1):133 | True in mechanism — every step is predicted, acted, re-read and verified, and money-class presses are never made | executor.ts:1–7; risk.ts:3, 19 |
| C30 | True | judge.py:21 (ABSTAIN); input-pipeline.md:29 | True | AGENTS.md:47 (ABSTAIN) |
| C31 | True — the writer is Groq by default | README.md(v1):5; CoreLaunchSettings.swift:170–188 (`--writer groq`) | **False as worded** — v2's inline writer runs on the Mac (a local GGUF model); the approved promise says "Nothing goes to Groq" for inline. (Groq exists in v2 only as the Ask writer's key, a different path.) | privacy.ts:48; helper/src/writer/local-model.ts:2–3; README.md:32 |
| C32 | True — the second question picks a registered workflow or none | judge.py:9–11; workflows.json | Partly — v2's Jev still only picks among options code built, but they are skills, fills and plans, not user-registered workflows | README.md:18 ("Jev … only picks among options code built"); AGENTS.md:42–44 |
| C33 | True as contract ("Acceptance starts the requested workflow. Each consequential step still names its actual effect in the preview"; "The hackathon stops before payment") | input-pipeline.md:41, 70 | True — and enforced in code: predicted change vs. actual re-read, stop on mismatch; press risk table in code | executor.ts:1–7; risk.ts:1–11; helper/README.md:52 |
| C34 | True for v1's architecture as documented (Screenpipe 0.4.50 sidecar; SQLite run records; Skyvern and Computer Use Jev pinned as the executors) — though Skyvern was never product-complete | README.md(v1):67, 117; caret/store.py:1; input-pipeline.md:5–14; README.md(v1):133 | **False as worded** — v2 does not use Screenpipe, the helper is TypeScript, and execution is the helper executor acting through the Swift screen reader under grants; the pinned-upstream rule is retired | README.md:7–18 ("v2 does not use Screenpipe"); AGENTS.md:40–45; apps/screen-reader/README.md:31–35 |
| C36 | Partly — "hackathon" is certain (the repo's own name and records); the event's city is not stated in the repo (see "Could not verify") | memory-bank/productContext.md (v1):32–38 | Same — the fact ages with the product, not with v2 | — |
| C37 | True for all four notes as v1 contract: one asterisk, Tab-only acceptance, stop before payment, sample data | README.md(v1):119, 127, 134; input-pipeline.md:70 | Note 1 **False** for v2 (figure is Pebble, not an asterisk — LineContent.swift:29–35). Notes 2–4: True and enforced ("Caret never sends, submits…", HelperMemory.swift:517; risk.ts:3; the page's demos are seeded) | — |
| C38 | True of the page | ReplyComposer.tsx:8–12; Workflows.tsx:550–553 | n/a (about this page) | — |
| C40 | True for v1 as written — pattern judge stand-in, live Jev open; Gmail/Calendar send/Skyvern open | README.md(v1):129–134 | **Stale for v2** — the Jev judge and a local inline writer are implemented; mail/calendar *sending* remains handed to the user by rule | AGENTS.md:47; writer/local-model.ts; executor.ts:4–5 |

### The Austin "Running today / Still being wired" lists

| # | Item | Verdict — v1 | Evidence (v1) | Verdict — v2 | Evidence (v2) |
|---|---|---|---|---|---|
| C39a | "The asterisk beside supported fields and selections" | True | README.md(v1):119 | **False** (figure is Pebble; ghost text at the caret remains) | LineContent.swift:29–35; apps/caret/README.md:3 |
| C39b | "The pinned strip, the action menu, and their shortcuts" | True | TriggerButton.swift:5–7; PinnedActionsStore.swift:3–5 | Partly — action lines and pop-ups exist; the ⌘⌥ pinned-strip scheme is v1 (v2 owns Command-1…3) | KeyOwnership.swift:143–146; AGENTS.md:48 |
| C39c | "Accessibility reconnection" | True — a "Reconnect Accessibility…" menu item exists | StatusBarController.swift:50; CaretApp.swift:1130 | Partly — v2 instead checks trust at launch and reconnects the helper socket | apps/screen-reader/README.md:15; HelperClient.swift:9 |
| C39d | "Screenpipe startup and recent-context retrieval" | True — Caret.app starts pinned Screenpipe 0.4.50 and retrieves last-N windows/minutes/clipboard | ScreenpipeSupervisor.swift:10–13; README.md(v1):67, 117 | **False** — "v2 does not use Screenpipe"; recent context is its own reader plus a ten-minute rolling text | README.md:18; AGENTS.md:45; helper/src/rolling-text.ts:1–3 |
| C39e | "The planner, holding and confirming on sample data" | True — local preview math and local hold transitions on synthetic data | README.md(v1):126–127; caret/planner.py:54–113; caret/store.py:1 | Partly — the v2 executor plans, adds task-tagged calendar events and cleans up only its own, under grants; "holding" as the demo shows it is v1 | apps/screen-reader/README.md:41–55; executor.ts |
| C39f | "The workflow contract the three seeds are written against" | True | caret/workflows.json; input-pipeline.md | Partly — the contract still exists for the v1 starter in the tree; v2's contract is `helper/src/protocol.ts` and the executor | AGENTS.md:39; README.md:16 |
| C40a | "The inline writer and both judge decisions" still being wired | Partly — the Groq writer and two-step judge are wired in the core; the live-Jev default is open | README.md(v1):129–134 | **Stale** — both are implemented in v2 | AGENTS.md:47; helper/src/routing/judge.ts; writer/local-model.ts |
| C40b | "Mail, calendar, and the two executors" still being wired | True | README.md(v1):133; docs/integrations.md | **Stale for v2's architecture** — mail/calendar sends are permanently handed to the user by rule; calendar event adds run under grants; no Skyvern/Computer-Use-Jev executors in v2 | risk.ts:16–22; apps/screen-reader/README.md:41–55; AGENTS.md:40 |
| C40c | "Tab acceptance inside other apps" still being wired | True | README.md(v1):55 ("integration is still in progress") | **Stale** — the v2 host app inserts ghost text with Tab "in any app", via its own key tap and insertion executor | apps/caret/README.md:3, 32–37 |

### The workflow demos against v2's safety rules (the careful rows)

| # | Claim | Verdict — v1 | Evidence (v1) | Verdict — v2 | Evidence (v2) |
|---|---|---|---|---|---|
| C19 | Revise previews before touching the document, replaces exactly the selection, ⌘Z works | True as contract: previews never write; acceptance rechecks the original element | input-pipeline.md:15–16, 41 | True in mechanism: the host rereads the field, guards, writes, verifies, keeps ⌘Z undo; the executor predicts, acts, re-reads, compares | apps/caret/README.md:17, 36–37; executor.ts:6–12 |
| C20/C21 | Flight: drives the airline site, re-reading after every step; stops before payment; "Nothing was bought." | Partly — the stop-before-payment rule is real (`stop_before: "payment"`), but no browser executor was integrated; the demo's steps are the designed behaviour, not shipped behaviour | workflows.json:6–8; README.md(v1):133 | Partly — re-reading after every step is exactly what the executor does (native windows); but v2 does not drive airline sites: no Skyvern, and money-class presses are never made, so "from the thread to the payment page" is no longer a v2 capability claim at all — payment is permanently handed off | executor.ts:1–7; risk.ts:3, 19; AGENTS.md:40 |
| C23 | **"Send draft and hold" / "Draft sent, three times held."** | Partly — overstated even for v1: the seed's own notice says "Synthetic development data. This draft cannot be sent. Holds are local only."; the stage status `local_preview` never sends | caret/planner.py:113; workflows.json:15 | **False and contradicts v2's core rule** — "A press whose label reads as send, submit, delete or pay is never made; the run stops and hands it to the user" (executor.ts:4–5). The same rule is stated for Ask ("Caret never sends, submits…", HelperMemory.swift:517), in the permission table ("Send, submit, post — hand off to you", MemoryPage.swift:486; patterns/memory.ts:166), and in helper/README.md:52 | executor.ts:4–5; risk.ts:3, 16–17; helper/README.md:52 |
| C22/C24 | Calendar: proposes three slots with reasons, drafts, holds; confirm releases only its own holds; preview names effect and evidence | True as local fixture behaviour: options, draft, holds and release are computed in the planner on sample data | planner.py:54–113; store.py:1 | Partly — the shape holds (preview with named effect, evidence, confirmation; cleanup confined to what the task itself added), but v2 adds real events under grants rather than "holds", and there is no calendar-link workflow | apps/screen-reader/README.md:41–55; executor.ts; AGENTS.md:42 |
| C9/C13 | Tab accepts the ghost; with no offer Tab passes through | True as contract: only one view owns Tab; host app receives Tab unchanged when no offer | input-pipeline.md:59–68 | True: "Tab accepts only the current visible offer that owns it"; a plain Tab claims the one published offer, a second Tab passes through | AGENTS.md:48; OfferArbiter.swift:12–14 |
| C10 | Escape dismisses and changes nothing | True as contract | input-pipeline.md:70 | True | OfferArbiter.swift:310, 332 |
| C11 | Same input, different answer per context | True of the demo's design; in v1 the real app's completions were model-generated, not context-switched seeds | ReplyComposer.tsx:8–12 (page); README.md(v1):55 | Partly — v2's inline completion is real and grounded in the live screen model, but the on/off demo mechanic is page theatre | apps/caret/README.md:3–4 |
| C12 | Typo fixes ("a simple correction") | True — INLINE covers "a short continuation or simple grammar repair" | input-pipeline.md:30, 35 | True in kind — the writer produces short completions; the specific typo-fix list is page seeding | writer/local-model.ts; apps/caret/README.md:3–4 |

### Privacy wording (two columns: what v2's code does vs. what the approved promise says)

The page's only privacy-facing sentences are C34's "Model calls send relevant
context to their providers" (UnderTheHood.tsx:93–99) and the demo-honesty lines
C7/C38. There is no explicit privacy section. For the wording Sam may add, the
governing text is `PRIVACY_PROMISE` in `helper/src/privacy.ts` exactly as it
stands at 98596a0d (privacy.ts:40–48). Nothing else — including Caret PR #32 —
is treated here as policy.

| # | Wording | v2's code does (file:line) | The approved promise says (privacy.ts:40–48) |
|---|---|---|---|
| P1 | "Model calls send relevant context to their providers." (UnderTheHood.tsx:98) | A Jev request carries snippets of the windows involved, never a whole document or conversation (README.md:47); screen text is declared per-snippet through a SnippetLedger with per-window character budgets (privacy.ts:74–78, 318–344); the seal re-measures the final bytes (privacy.ts:363–374) | "Caret sends a cloud model what you type to it and short pieces of what's on your screen: a field's label, the values that might go in it, and the lines around them." — consistent, but vaguer than the promise |
| P2 | (nothing on the page today about redaction) | Password fields, card numbers, one-time codes, keys and high-entropy tokens are withheld from reads and refused in requests: `excludedValue`/`assertNoExcludedValue` (privacy.ts:642–657); secure fields never read (apps/screen-reader/README.md:26–29) | "Before anything leaves your Mac, Caret removes password fields, card numbers, one-time codes and keys, and lines it recognizes as secrets, though it can miss a secret written in ordinary words." |
| P3 | (nothing on the page today about switched-off apps) | Apps on the deny list are never read (apps/screen-reader/README.md:29); per-site switch-off drives `purgeWindow` | "It sends nothing from an app or website you've switched off." |
| P4 | (nothing on the page today about whole notes) | `OWNER_NOTE_CHARS = 2000` with a required disclosure sentence (privacy.ts:37–61) | "To decide whose details a value is, Caret may send the whole note it came from, if the note is 2,000 characters or shorter. No request takes more than half of any one conversation." |
| P5 | (nothing on the page today about the provider) | Jev runs on TypeSafe; retention and telemetry terms are disclosed as the promise states them (README.md:40; privacy.ts:46) | "Caret's main model is Jev, run by TypeSafe… They let TypeSafe keep using requests… We don't know whether TypeSafe staff read requests." |
| P6 | (the page implies a cloud writer via "Groq") | Inline suggestions are written on the Mac by a local model (writer/local-model.ts:2–3) | "Inline suggestions… are written on your Mac by a model that runs there. Nothing goes to Groq." |
| P7 | (nothing on the page today about retention) | The rolling text keeps screen text for the last ten minutes and is never written to disk (rolling-text.ts:1–3); README.md:44 states "Screen text stays in memory for ten minutes" | **Nothing.** The approved promise at 98596a0d states no retention limit. **Labelled hypothesis, not a verdict and not policy:** Caret PR #32 (open, unaccepted by Sam) proposes adding "Caret keeps what it reads from your screen for ten minutes after it last reads it, then forgets it." to the promise. That sentence is not quoted anywhere in this document as something Caret promises, and no landing copy is proposed from it or derived from it. |

---

## Milestone 3 — proposals

Rules observed: every proposal is true of v2 at 98596a0d, plain, and no longer
than the text it replaces. Where a demo contradicts v2's safety rules, the
smallest change that removes the contradiction is described in words only —
nothing was implemented.

| # | Current text (landing file:line) | Proposed text | Reason | Evidence |
|---|---|---|---|---|
| R1 | "A fast writer on Groq drafts the next few words as grey text after your caret. Tab takes it." (UnderTheHood.tsx:44) | "A writer on your Mac drafts the next few words as grey text after your caret. Tab takes it." | v2's inline writer is local; the approved promise says "Nothing goes to Groq" for inline. Same length, same claim shape. | privacy.ts:48; writer/local-model.ts:2–3 |
| R2 | "Swift handles the Mac UI, Screenpipe supplies recent context, and Python stores workflow state in SQLite. The execution path uses Skyvern for browser steps and Computer Use Jev for native apps. Model calls send relevant context to their providers." (UnderTheHood.tsx:95–99) | "Swift reads the screen and handles the Mac UI, and a TypeScript helper holds the screen model and checks each step before and after it acts. Model calls send short pieces of the screen to their providers." (~205 chars, under the original's ~248) | Every named system in the current text is v1-only: v2 does not use Screenpipe, has no Python workflow store, and retired Skyvern/Computer-Use-Jev. | README.md:7–18; AGENTS.md:40–45; executor.ts:1–7 |
| R3 | "The stop before paying lives in the workflow, not in a prompt." (Workflows.tsx:232) | "The stop before paying lives in the code, not in a prompt." | In v2 the rule is a code table, not a workflow seed. One word shorter. | risk.ts:1–11; executor.ts:4–5 |
| R4 | "…and the stop before a payment page is written into the workflow rather than asked for in a prompt." (UnderTheHood.tsx:89) | "…and the stop before a payment page is written into the code rather than asked for in a prompt." | Same reason. | risk.ts:1–11 |
| R5 | "Send draft and hold" — the calendar preview's primary button (Workflows.tsx:481, and the stage button at 392) | "Draft and hold" | Smallest change that removes the contradiction with "Caret never presses send": the demo stops claiming a send. Also more honest to v1, whose planner says "This draft cannot be sent." | executor.ts:4–5; risk.ts:16–17; caret/planner.py:113 |
| R6 | "Draft sent, three times held." (Workflows.tsx:522) | "Draft staged and times held." (28 chars, under 29) | Same reason: no send ever happened, in either version. | planner.py:113; executor.ts:4–5 |
| R7 | "⌘⌥1 Runs a pinned action" (KeyLegend.tsx:13) | "⌘1 Runs a visible action" | v2 owns Command-1…3 for visible actions; the ⌘⌥ pinned-strip scheme is v1. Conditional on Decision A (if the page keeps telling the hackathon story, keep ⌘⌥1). | KeyOwnership.swift:143–146; AGENTS.md:48; PinnedActionsStore.swift:69–71 |
| R8 | "Screenpipe startup and recent-context retrieval" (Austin.tsx:69, "Running today") | "Its own screen reader and context window" | v2 does not use Screenpipe; recent context is its own Accessibility reader plus a ten-minute rolling text. Conditional on Decision A. | README.md:18; rolling-text.ts:1–3; apps/screen-reader/README.md:3 |
| R9 | "From the thread to the payment page, and not one step further." (Workflows.tsx:231) | Keep, with the R5/R6 wording fixes — or, if Decision A says the page describes v2, retitle around the real stop: "To the edge of payment, and not one step further." (same length) | The v2 story is stronger than the v1 one: the stop is now a code rule that also covers submit, delete and share, not just a workflow seed. | risk.ts:16–22; executor.ts:4–5; workflows.json:7 |

**Demo-behaviour changes (described, not implemented).** Only the calendar
stage contradicts v2's rules, and only in two strings: the primary button and
the status line (R5, R6). The flight stage already ends at checkout with
"Stopped before payment. Nothing was bought," which v2's rule upholds. The
composer demo already matches v2's inline rules: Tab takes the ghost, Escape
dismisses silently, Tab with no offer passes through, and unknown typing gets
silence. No component or logic change is proposed anywhere.

### Decisions only Sam can make

1. **What the page describes.** Every verdict above splits on this. If the
   page tells the hackathon story (Austin section stays the frame), keep C1,
   C14, C31, C34, C39 as-is and land only R1–R6. If the page describes v2,
   the asterisk identity (C1, C37 note 1), the ⌘⌥ scheme (C14), the
   architecture paragraph (C34) and both Austin status lists (C39–C40) need
   rewriting along the lines of R1–R8, and the hero/closing "asterisk" pun
   needs a brand call — v2's figure is Pebble, a blob with eyes, not an
   asterisk (LineContent.swift:29–35).
2. **The outbound link (C42).** `REPO_URL` still resolves: GitHub redirects
   `theodorexli/hackathon-2026-09-19` to `theodorexli/Caret` (verified via the
   API, HTTP 301 → repo 1377355954), and the deep link
   `/blob/main/docs/input-pipeline.md` still returns content on that repo's
   main (raw HTTP 200). But the maintained public product repository is
   `SamGu-NRX/Caret`, which describes itself as the hackathon's first-place
   project. Options: point "See the code" at `SamGu-NRX/Caret` and keep the
   hackathon link only in the Austin section as provenance; or keep one link.
   Sam's call — I changed nothing.
3. **(pending) The ten-minute retention sentence.** Caret PR #32 proposes
   adding "Caret keeps what it reads from your screen for ten minutes after it
   last reads it, then forgets it." to `PRIVACY_PROMISE`. Sam has not accepted
   it. Until it is accepted and merged, no landing wording may state a
   retention limit as a Caret promise; if it lands later, P7 is the row to
   revisit.

### Could not verify

- The event's city. Neither repo states where the hackathon took place; the
  repo description confirms "First Place, Cursor X AITX Hackathon" only, and
  the Austin–Dallas references in v1's memory-bank are about the demo's travel
  corridor, not the venue. The page's "in Austin" rests on the page itself.
- Whether `theodorexli/Caret`'s current main differs from the hackathon-v1
  content beyond what this audit needed (I verified the redirect, the
  three-seed file, and the pipeline contract document exist there).
- v2's full trigger UI surface: I found no pinned strip or sparkle trigger in
  the v2 host app, but did not exhaustively read every `Surface*` file; C15
  and C39b's v2 verdicts are "partly" partly for that reason.
- Anything at runtime. No app was built or launched; every verdict is from
  source and committed docs at the two pinned commits.

### Handoff

**Done.** Full inventory (42 claims + the three careful demo rows), verdicts
against hackathon-v1 and v2@98596a0d with file:line on both sides, the
privacy two-column check against `PRIVACY_PROMISE` at 98596a0d, nine copy
proposals within the length and truth constraints, two described-but-unbuilt
demo changes, and the decision list (with PR #32 correctly parked as pending
and never quoted as policy).

**Left.** Sam decides the identity question (Decision 1), the link question
(Decision 2), and eventually PR #32 (Decision 3). No copy, component or style
was touched in this pass — the proposals table is the raw material for that
edit, which should land as its own PR after Decision 1.

**How to continue.** Apply the proposals row by row against the landing's
working tree; each row cites its landing file:line, so the edit is mechanical
once Decision 1 is made. Re-run the privacy column against whatever
`PRIVACY_PROMISE` says at merge time — it is quoted here from 98596a0d and
PR #32 would change it.
