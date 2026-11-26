import { useEffect } from "react";

/**
 * Fait apparaître les éléments [data-reveal] d'un conteneur quand ils entrent à l'écran,
 * l'un après l'autre. Sans script ou avec prefers-reduced-motion, tout reste visible.
 */
export function useReveal(containerRef) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const items = [...root.querySelectorAll("[data-reveal]")];
    root.classList.add("reveal-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, index) => {
            entry.target.style.transitionDelay = `${index * 80}ms`;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
      },
      { threshold: 0.15 }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [containerRef]);
}
