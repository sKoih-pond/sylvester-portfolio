import { useEffect, useRef } from "react";
import { motion, animate, useMotionValue, useTransform, useReducedMotion } from "framer-motion";

// Custom-SVG radar. One shared taxonomy; per-axis highlight on hover/tap.
// Resting = uniform muted heptagon. Active = morph spokes to the entry's mapped
// values, brighten fill/stroke, dim the axes the entry doesn't touch.
// Animates transform/opacity-equivalent SVG attrs only (no layout properties).

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE * 0.34;
const REST_RATIO = 0.5; // uniform resting fill level

function angleFor(i, n) {
  return -Math.PI / 2 + (i * 2 * Math.PI) / n;
}
function vertex(i, n, ratio) {
  const a = angleFor(i, n);
  return [CX + Math.cos(a) * R * ratio, CY + Math.sin(a) * R * ratio];
}
function ringPoints(n, ratio) {
  return Array.from({ length: n }, (_, i) => vertex(i, n, ratio).join(",")).join(" ");
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function Radar({ axes, max, active, resting, idPrefix = "radar", maxWidth = SIZE }) {
  const reduce = useReducedMotion();
  const n = axes.length;
  // Resting shape: an aggregate profile if provided, else a uniform heptagon.
  const rest = resting ? resting.map((v) => v / max) : axes.map(() => REST_RATIO);

  const progress = useMotionValue(0); // 0 = from, 1 = to
  const lit = useMotionValue(0); // 0 = resting look, 1 = active look
  const fromRef = useRef(rest);
  const toRef = useRef(rest);

  // Snapshot current displayed ratios so transitions between entries are smooth.
  const displayedNow = () => {
    const p = progress.get();
    return fromRef.current.map((f, i) => lerp(f, toRef.current[i], p));
  };

  useEffect(() => {
    const target = active ? active.map((v) => v / max) : rest;
    fromRef.current = displayedNow();
    toRef.current = target;
    progress.set(0);
    const dur = reduce ? 0 : 0.35;
    const ease = [0.22, 0.61, 0.36, 1];
    const c1 = animate(progress, 1, { duration: dur, ease });
    const c2 = animate(lit, active ? 1 : 0, { duration: dur, ease });
    return () => {
      c1.stop();
      c2.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, max, reduce]);

  const points = useTransform(progress, (p) =>
    fromRef.current.map((f, i) => vertex(i, n, lerp(f, toRef.current[i], p)).join(",")).join(" ")
  );
  const fillOpacity = useTransform(lit, [0, 1], [0.1, 0.26]);
  const strokeOpacity = useTransform(lit, [0, 1], [0.4, 0.95]);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-labelledby={`${idPrefix}-title`}
      style={{ width: "100%", maxWidth, height: "auto", overflow: "visible" }}
    >
      <title id={`${idPrefix}-title`}>
        Skill radar across {axes.join(", ")}
      </title>

      {/* concentric guide rings */}
      {[1, 0.66, 0.33].map((r) => (
        <polygon
          key={r}
          points={ringPoints(n, r)}
          fill="none"
          stroke="var(--border-soft)"
          strokeWidth="1"
        />
      ))}

      {/* spokes + labels */}
      {axes.map((label, i) => {
        const [x, y] = vertex(i, n, 1);
        const [lx, ly] = vertex(i, n, 1.16);
        const a = angleFor(i, n);
        const anchor = Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        const dimmed = active ? active[i] === 0 : false;
        return (
          <g key={label} style={{ transition: reduce ? "none" : "opacity .3s ease", opacity: dimmed ? 0.28 : 1 }}>
            <line x1={CX} y1={CY} x2={x} y2={y} stroke="var(--border-soft)" strokeWidth="1" />
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="600"
              fill="var(--muted)"
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* animated value polygon */}
      <motion.polygon
        points={points}
        fill="var(--accent)"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        style={{ fillOpacity, strokeOpacity }}
      />
    </svg>
  );
}
