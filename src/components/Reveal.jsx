import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Scroll-in reveal (500–700ms, transform/opacity only, once).
// Robust per §7: content is NEVER permanently hidden — if the observer never
// fires (or IO is unavailable), a failsafe reveals it. Reduced-motion shows
// content immediately with no transform.
export default function Reveal({ children, as = "div", className, style, id }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  const MotionTag = motion[as] || motion.div;

  useEffect(() => {
    if (reduce) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    const failsafe = setTimeout(() => {
      setShown(true);
      io.disconnect();
    }, 1200);
    return () => {
      io.disconnect();
      clearTimeout(failsafe);
    };
  }, [reduce]);

  return (
    <MotionTag
      ref={ref}
      id={id}
      className={className}
      style={style}
      initial={false}
      animate={reduce ? { opacity: 1, y: 0 } : { opacity: shown ? 1 : 0, y: shown ? 0 : 18 }}
      transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
