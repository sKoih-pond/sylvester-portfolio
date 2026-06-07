import { useState } from "react";

const hasHover =
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Shared interaction model for the radar sections:
// desktop → highlight on hover/focus; touch → sticky tap (tap again to clear).
export function useActiveEntry() {
  const [activeId, setActiveId] = useState(null);

  const getProps = (id) =>
    hasHover
      ? {
          tabIndex: 0,
          onMouseEnter: () => setActiveId(id),
          onMouseLeave: () => setActiveId(null),
          onFocus: () => setActiveId(id),
          onBlur: () => setActiveId(null),
        }
      : {
          tabIndex: 0,
          onClick: () => setActiveId((p) => (p === id ? null : id)),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveId((p) => (p === id ? null : id));
            }
          },
        };

  return { activeId, getProps, setActiveId };
}
