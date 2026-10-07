/* How it works, at the level a visitor wants it.
 *
 * The loop comes first, as four short steps: it is a real sequence, so it is
 * numbered. Then the one decision that matters, set as three answers and what
 * each one costs you, rather than as a diagram of boxes and arrows.
 *
 * The four steps used to be a sticky section of their own, one tall step per
 * screen against a pinned desktop. It doubled the page's height and let scroll
 * position drive a demo, so its sentences moved here (kgu.one design handoff,
 * HANDOFF-caret.md, decision 4).
 *
 * The contract with the record names, the cadence and the keyboard rules is
 * linked once at the end. It belongs in the repository, not on a landing page.
 */

import { REPO_URL } from "../../lib/site";

const LOOP = [
  {
    title: "It reads the frame you are in.",
    body: "The app you are in, the field you are on, and a little of what you were just looking at. Each piece keeps where it came from. A missing source is recorded as missing, not filled in.",
  },
  {
    title: "It decides whether to say anything.",
    body: "One judge gets that frame and three answers it is allowed to give: stay quiet, suggest text, offer an action. Staying quiet is an answer, not a failure.",
  },
  {
    title: "It offers, at the cursor.",
    body: "Text arrives in grey after your caret. An action arrives as the asterisk and your pinned strip at the edge of the field. Nothing takes your focus, and Escape makes it go away.",
  },
  {
    title: "It previews, then acts, then stops.",
    body: "A preview names the exact effect and shows what it read to get there. Only then does the workflow run, and booking stops at the payment page.",
  },
];

const ANSWERS = [
  {
    name: "Stay quiet",
    then: "Nothing appears. You keep typing.",
  },
  {
    name: "Suggest text",
    then: "A fast writer on Groq drafts the next few words as grey text after your caret. Tab takes it.",
  },
  {
    name: "Offer an action",
    then: "A second question picks one of the workflows you registered, or none of them.",
  },
];

export function UnderTheHood() {
  return (
    <section id="inside" className="section inside section-shell">
      <div className="page-container">
        <h2>Code owns the branches. The model picks one.</h2>
        <p className="editorial-standfirst inside__lede">
          Caret asks Jev one question about what is on your screen, and the judge may
          answer three ways. Everything it could pick was written down first.
        </p>

        <ol className="loop" aria-label="The loop">
          {LOOP.map((step, index) => (
            <li key={step.title} className="loop__step">
              <span className="loop__n" aria-hidden>
                {index + 1}
              </span>
              <h3 className="loop__title">{step.title}</h3>
              <p className="loop__body">{step.body}</p>
            </li>
          ))}
        </ol>

        <dl className="answers">
          {ANSWERS.map((answer) => (
            <div key={answer.name} className="answers__row">
              <dt>{answer.name}</dt>
              <dd>{answer.then}</dd>
            </div>
          ))}
        </dl>

        <div className="uh-notes">
          <div>
            <h3>Confidence is not permission.</h3>
            <p>
              Nothing with an effect happens on a model's say-so. Every consequential step
              names its effect in a preview first, and the stop before a payment page is
              written into the workflow rather than asked for in a prompt.
            </p>
          </div>
          <div>
            <h3>Where things run.</h3>
            <p>
              Swift handles the Mac UI, Screenpipe supplies recent context, and Python
              stores workflow state in SQLite. The execution path uses Skyvern for browser
              steps and Computer Use Jev for native apps. Model calls send relevant context
              to their providers.
            </p>
          </div>
        </div>

        <p className="inside__link">
          <a
            className="link-underline"
            href={`${REPO_URL}/blob/main/docs/input-pipeline.md`}
            target="_blank"
            rel="noreferrer"
          >
            Read the pipeline contract
          </a>
        </p>
      </div>
    </section>
  );
}
