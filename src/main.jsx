import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LazyMotion } from "framer-motion";
import App from "./App.jsx";

// Code-split Framer Motion's features (loaded after first paint) — the initial
// bundle ships only the tiny `m` component shell.
const loadFeatures = () => import("./motionFeatures.js").then((mod) => mod.default);

// Brand face = self-hosted General Sans (Fontshare). The @font-face rules live
// in index.css and the woff2 files in public/assets/fonts — no JS font import
// and no third-party font CDN (keeps the CSP tight).
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LazyMotion features={loadFeatures} strict>
      <App />
    </LazyMotion>
  </StrictMode>
);
