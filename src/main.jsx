import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LazyMotion } from "framer-motion";
import App from "./App.jsx";

// Code-split Framer Motion's features (loaded after first paint) — the initial
// bundle ships only the tiny `m` component shell.
const loadFeatures = () => import("./motionFeatures.js").then((mod) => mod.default);

// Self-hosted Inter as a single VARIABLE font (weight axis). One request covers
// every weight (incl. the headline's 350) instead of 5 static files; the latin
// subset is fetched on demand via unicode-range.
import "@fontsource-variable/inter/wght.css";

import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LazyMotion features={loadFeatures} strict>
      <App />
    </LazyMotion>
  </StrictMode>
);
