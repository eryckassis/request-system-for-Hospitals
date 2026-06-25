/* eslint-disable prettier/prettier */



import { useCallback, useEffect, useRef } from "react";
import type Lenis from "lenis";
import type { LenisOptions } from "lenis";

import { loadGsap } from "@/hooks/use-gsap";

function shouldPreventLenis(node: HTMLElement) {
  if (
    node.closest(
      [
        "a",
        "button",
        "input",
        "textarea",
        "select",
        "summary",
        "[role='button']",
        "[role='link']",
        "[contenteditable='true']",
        "[data-lenis-prevent]",
      ].join(","),
    )
  ) {
    return true;
  }

  const hasScrollableContent =
    node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth;

  if (!hasScrollableContent) {
    return false;
  }

  const { overflow, overflowX, overflowY } = window.getComputedStyle(node);

  return [overflow, overflowX, overflowY].some((value) =>
    ["auto", "scroll", "overlay"].includes(value),
  );
}

const lenisOptions = {
  autoRaf: false,
  smoothWheel: true,
  syncTouch: false,
  allowNestedScroll: true,
  stopInertiaOnNavigate: true,
  prevent: shouldPreventLenis,
} satisfies LenisOptions;

export function useLenisGsap() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return;
    }

    let cancelled = false;
    let cleanup = () => {};

    void Promise.all([import("lenis"), loadGsap()]).then(([lenisModule, gsap]) => {
      if (cancelled) {
        return;
      }

      const lenis = new lenisModule.default(lenisOptions);
      lenisRef.current = lenis;

      const tick = (time: number) => {
        lenis.raf(time * 1000);
      };

      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();

        if (lenisRef.current === lenis) {
          lenisRef.current = null;
        }
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return useCallback(() => {
    const lenis = lenisRef.current;

    if (lenis) {
      lenis.scrollTo(0, {
        duration: 0.9,
        easing: (time) => 1 - Math.pow(1 - time, 3),
      });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
}