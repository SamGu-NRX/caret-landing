import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/* `base: "./"` because the built site gets vendored into Caret as
   `sites/landing` and may be served from a subpath we do not know here.
   Relative URLs work from any prefix; an absolute "/" base would 404. */
export default defineConfig({
  base: "./",
  plugins: [react()],
});
