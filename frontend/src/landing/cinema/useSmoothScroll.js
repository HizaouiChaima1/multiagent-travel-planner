import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Défilement amorti (Lenis) synchronisé avec ScrollTrigger, coupé si l'utilisateur
 * préfère moins d'animations. Renvoie scrollTo(sélecteur) pour les liens internes.
 */
export function useSmoothScroll() {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const lenis = new Lenis({ lerp: 0.085 });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return useCallback((selector) => {
    const target = document.querySelector(selector);
    if (!target) return;
    if (lenisRef.current) lenisRef.current.scrollTo(target, { duration: 2.2 });
    else target.scrollIntoView();
  }, []);
}
