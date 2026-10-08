import { REPO_URL } from "../lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container">
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
