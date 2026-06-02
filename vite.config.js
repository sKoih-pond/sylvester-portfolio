import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { copyFileSync, existsSync } from "node:fs";

// Guarantee the Apache security config lands in the published output, even if
// Vite's public-dir copy skips dotfiles.
function copyHtaccess() {
  return {
    name: "copy-htaccess",
    closeBundle() {
      if (existsSync("public/.htaccess")) copyFileSync("public/.htaccess", "dist/.htaccess");
    },
  };
}

// Phase 1: static export to dist/ for cPanel public_html.
// Content-hashed filenames remove the need for manual ?v=N cache-busting.
export default defineConfig({
  plugins: [react(), tailwindcss(), copyHtaccess()],
  build: {
    outDir: "dist",
    target: "es2020",
  },
});
