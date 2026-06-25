import { useEffect } from "react";
import Lenis from "lenis";
import { loadGsap } from "./use-gsap";

/** Smooth scroll via Lenis, synced with GSAP ticker. Mount once per page. */
export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId = 0;
    let detach: (() => void) | undefined;

    void loadGsap().then((gsap) => {
      const update = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsap.ticker.add(update);
      gsap.ticker.lagSmoothing(0);
      detach = () => {
        gsap.ticker.remove(update);
      };
    });

    // Fallback rAF until GSAP loads
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      detach?.();
      lenis.destroy();
    };
  }, []);
}
