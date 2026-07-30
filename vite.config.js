import { copyFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* GitHub Pages serves this repo from /Visitor-Management-System/ and has no SPA
   rewrite rule: any path it doesn't recognise returns 404.html. Shipping a copy
   of the app there is what makes a deep link like /check-in reach the router
   instead of a dead end. */
const REPO_BASE = "/Visitor-Management-System/";

const spaFallback = () => ({
  name: "spa-404-fallback",
  closeBundle() {
    copyFileSync("dist/index.html", "dist/404.html");
  },
});

export default defineConfig(({ command, isPreview }) => ({
  /* Only the dev server stays at the root. `vite preview` also reports
     command "serve", so it needs the base too — otherwise it serves the built
     bundle from / while the HTML asks for the prefixed paths. */
  base: command === "build" || isPreview ? REPO_BASE : "/",
  plugins: [react(), spaFallback()],
  server: { port: Number(process.env.PORT) || 5173, open: true },
  /* `npm run preview` reproduces the Pages layout — base path and all. */
  preview: { port: Number(process.env.PORT) || 4173 },
}));
