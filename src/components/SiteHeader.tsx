import { REPO_URL } from "../lib/site";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#workflows", label: "Workflows" },
  { href: "#inside", label: "Under the hood" },
  { href: "#austin", label: "Austin" },
];

/* A plain row on the rail: the wordmark on the page's left edge, the links and
   one pale capsule on the right. It scrolls away with the page. */
export function SiteHeader() {
  return (
    <header className="page-container site-header">
      <a className="header-brand" href="#top">
        Caret
        <i aria-hidden className="caret-bar" />
      </a>
      <nav className="header-nav" aria-label="Main">
        {LINKS.map((link) => (
          <a key={link.href} className="header-link" href={link.href}>
            {link.label}
          </a>
        ))}
        <a className="control" href={REPO_URL} target="_blank" rel="noreferrer">
          See the code
        </a>
      </nav>
    </header>
  );
}
