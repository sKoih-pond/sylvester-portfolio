import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Phase 1: static export to dist/ for cPanel public_html.
// Content-hashed filenames remove the need for manual ?v=N cache-busting.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    target: "es2020",
  },
});
