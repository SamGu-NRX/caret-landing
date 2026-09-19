/* What is actually happening, at the level a visitor wants it.
 *
 * This was a diagram of boxes and arrows. Boxes and arrows are what you draw
 * when you have not decided what the shape is: the reader has to hold six
 * labels in their head before the first idea lands. The shape here is small
 * enough to say in words — one question, three answers, and only two of them
 * do anything — so it is set as three answers and what each one costs you.
 *
 * The contract with the record names, the cadence and the keyboard rules is
 * linked once at the end. It belongs in the repository, not on a landing page.
 */

import { REPO_URL } from "../../lib/site";

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
        <h2 className="editorial-title">Code owns the branches. The model picks one.</h2>
        <p className="editorial-standfirst inside__lede">
          Caret asks Jev one question about what is on your screen, and the judge may
          answer three ways. Everything it could pick was written down first.
        </p>

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
