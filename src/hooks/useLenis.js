import { useEffect } from "react";
import Lenis from "lenis";

// Lenis smooth scroll — GATED: desktop (hover + fine pointer) AND
// prefers-reduced-motion: no-preference only. Disabled on touch / reduced-motion.
export function useLenis() {
  useEffect(() => {
    const allowMotion = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    const desktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!allowMotion || !desktop) return;

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
}
