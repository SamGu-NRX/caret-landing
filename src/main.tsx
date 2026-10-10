import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App";

/* Start the three above-the-fold font files fetching before React's first
   render. Without this the fonts are only discovered when the first text
   lays out, and the swap reflows the hero — the whole mobile CLS miss
   (0.0156 at 390px). The ?url imports resolve to the same hashed assets the
   @font-face rules reference, so nothing downloads twice. */
import newsreaderLatin from "@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2?url";
import newsreaderItalic from "@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2?url";
import schibstedLatin from "@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2?url";

for (const href of [newsreaderLatin, newsreaderItalic, schibstedLatin]) {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "font";
  link.type = "font/woff2";
  link.crossOrigin = "";
  link.href = href;
  document.head.append(link);
}

const container = document.getElementById("root");
if (!container) throw new Error("#root is missing from index.html");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
