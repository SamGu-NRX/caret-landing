import { REPO_URL } from "../lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container">
        <p className="footer-wordmark" aria-label="Caret">
          <span aria-hidden>Caret</span>
          <i aria-hidden className="footer-caret" />
        </p>
        <div className="footer-meta">
          <span>Built at the Cursor hackathon in Austin. Sample data only.</span>
          <a className="link-underline" href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
