import { ActionButton } from "./ActionButton";
import { ArrowUpRight } from "./Icons";
import { REPO_URL } from "../lib/site";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#workflows", label: "Workflows" },
  { href: "#inside", label: "Under the hood" },
  { href: "#austin", label: "Austin" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="page-container">
        <div className="header-shell pill-glass pill-glass--shell">
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
            <ActionButton href={REPO_URL} compact icon={<ArrowUpRight />}>
              See the code
            </ActionButton>
          </nav>
        </div>
      </div>
    </header>
  );
}
