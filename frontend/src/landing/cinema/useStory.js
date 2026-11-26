import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatBudget } from "../../format.js";
import { CHAPTERS, buildTimeline, initialState } from "./story.js";

gsap.registerPlugin(ScrollTrigger);

const LAYOUTS = {
  wide: { side: 0.62, far: 1, low: 0 },
  narrow: { side: 0, far: 1.5, low: -0.36 },
};

/**
 * Relie le scroll au récit : la timeline écrit dans `state` (lu par la scène 3D),
 * chaque chapitre s'active quand il occupe l'écran, et le texte suit l'état
 * (lignes tapées, journée, compteur du budget, barre de progression).
 */
export function useStory(rootRef, state) {
  useEffect(() => {
    const root = rootRef.current;
    const nodes = {
      progress: root.querySelector("[data-progress]"),
      chapter: root.querySelector("[data-chapter-label]"),
      typed: [...root.querySelectorAll("[data-typed]")],
      events: [...root.querySelectorAll("[data-event]")],
      counter: root.querySelector("[data-counter]"),
      budget: root.querySelector("[data-phase]"),
    };
    const sync = () => {
      nodes.typed.forEach((el, i) => el.classList.toggle("is-on", state.typed > i + 0.3));
      nodes.events.forEach((el, i) => el.classList.toggle("is-on", state.events > i + 0.2));
      nodes.counter.textContent = formatBudget(Math.round(state.counter));
      nodes.budget.classList.toggle("is-second", state.phase > 0.5);
    };

    const media = gsap.matchMedia();
    media.add({ wide: "(min-width: 821px)", narrow: "(max-width: 820px)" }, ({ conditions }) => {
      const layout = conditions.wide ? LAYOUTS.wide : LAYOUTS.narrow;
      Object.assign(state, initialState(layout));
      const timeline = buildTimeline(state, layout).eventCallback("onUpdate", sync);
      ScrollTrigger.create({
        trigger: root.querySelector(".story"),
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        animation: timeline,
        toggleClass: { targets: root, className: "in-story" },
        onUpdate: (self) => {
          nodes.progress.style.transform = `scaleY(${self.progress})`;
        },
      });
      root.querySelectorAll("[data-chapter]").forEach((section, index) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 50%",
          end: "bottom 50%",
          toggleClass: { targets: section, className: "is-active" },
          onToggle: (self) => {
            if (self.isActive) nodes.chapter.textContent = CHAPTERS[index].label;
          },
        });
      });
      sync();
    });
    return () => media.revert();
  }, [rootRef, state]);
}
