import { ArrowUpRight } from "../Icons";
import { WALLPAPER, WALLPAPER_ALT } from "../mac/Mac";
import { REPO_URL } from "../../lib/site";

export function Closing() {
  return (
    <section className="closing section-shell">
      <div className="page-container">
        <h2 className="closing__title">
          Not another window.
          <br />
          An asterisk.
        </h2>
        <p className="closing__body">
          Read what is on screen, offer one thing at the cursor, show the effect, wait for
          Tab, and stop before anything you cannot undo. Everything else is a workflow
          somebody registers.
        </p>
        <div className="closing__actions">
          <a className="button" href={REPO_URL} target="_blank" rel="noreferrer">
            See the code
            <ArrowUpRight />
          </a>
        </div>
      </div>

      {/* The same illustration as the hero, cropped to its lower third, so the
          page closes on the city it opened on without a third image. */}
      <div className="closing__band">
        <img src={WALLPAPER} alt={WALLPAPER_ALT} loading="lazy" />
        <span className="closing__band-caption">Illustration</span>
      </div>
    </section>
  );
}
