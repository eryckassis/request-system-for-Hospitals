import { useEffect, useRef } from "react";

let gsapPromise: Promise<(typeof import("gsap"))["default"]> | undefined;

function loadGsap() {
  gsapPromise ??= import("gsap").then((module) => module.default);
  return gsapPromise;
}

/** Page enter — fade + slide up. Apply to a wrapping element. */
export function usePageEnter<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    void loadGsap().then((gsap) => {
      if (cancelled || !ref.current) return;
      const ctx = gsap.context(() => {
        gsap.from(ref.current, { opacity: 0, y: 12, duration: 0.35, ease: "power2.out" });
      }, ref);
      cleanup = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);
  return ref;
}

/** Stagger child elements matching selector on mount. */
export function useStaggerList<T extends HTMLElement = HTMLDivElement>(
  selector = "[data-stagger]",
  deps: unknown[] = [],
) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    void loadGsap().then((gsap) => {
      if (cancelled || !ref.current) return;
      const ctx = gsap.context(() => {
        gsap.from(selector, {
          opacity: 0,
          y: 10,
          duration: 0.3,
          ease: "power2.out",
          stagger: 0.05,
        });
      }, ref);
      cleanup = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/** Modal/Drawer enter animation. */
export function useDialogEnter<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    void loadGsap().then((gsap) => {
      if (cancelled || !ref.current) return;
      const ctx = gsap.context(() => {
        gsap.from(ref.current, { opacity: 0, y: 20, duration: 0.25, ease: "power2.out" });
      }, ref);
      cleanup = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);
  return ref;
}

/** Hover handlers for buttons (scale 1.02). Spread onto a button. */
export function buttonHoverHandlers() {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      const target = e.currentTarget;
      void loadGsap().then((gsap) => {
        gsap.to(target, { scale: 1.02, duration: 0.15, ease: "power2.out" });
      });
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      const target = e.currentTarget;
      void loadGsap().then((gsap) => {
        gsap.to(target, { scale: 1, duration: 0.15, ease: "power2.out" });
      });
    },
  };
}
