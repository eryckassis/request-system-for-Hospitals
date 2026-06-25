/* eslint-disable prettier/prettier */
import { useLayoutEffect, useRef } from "react";

import { loadGsap } from "@/hooks/use-gsap";
import { cn } from "@/lib/utils";

type Option<T extends string> = {
  value: T;
  label: string;
};

type AnimatedToggleGroupProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
};

const ACTIVE_RADIUS = "999px";
const INACTIVE_RADIUS = "6px";

export function AnimatedToggleGroup<T extends string>({
  value,
  onChange,
  options,
  className,
}: AnimatedToggleGroupProps<T>) {
  const buttonRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const prevValueRef = useRef<T | null>(null);
  const hasMountedRef = useRef(false);

  useLayoutEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      prevValueRef.current = value;
      return;
    }

    const activeButton = buttonRefs.current.get(value);
    const prevButton = prevValueRef.current ? buttonRefs.current.get(prevValueRef.current) : null;
    prevValueRef.current = value;
    if (!activeButton) return;

    activeButton.style.borderRadius = INACTIVE_RADIUS;
    if (prevButton && prevButton !== activeButton) {
      prevButton.style.borderRadius = ACTIVE_RADIUS;
    }

    let cancelled = false;
    let cleanup = () => {};

    void loadGsap().then((gsap) => {
      if (cancelled) return;

      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          defaults: {
            duration: 0.42,
            ease: "power3.inOut",
            overwrite: "auto",
          },
        });

        tl.fromTo(
          activeButton,
          { borderRadius: INACTIVE_RADIUS },
          { borderRadius: ACTIVE_RADIUS, clearProps: "borderRadius" },
          0,
        );

        if (prevButton && prevButton !== activeButton) {
          tl.fromTo(
            prevButton,
            { borderRadius: ACTIVE_RADIUS },
            {
              borderRadius: INACTIVE_RADIUS,
              clearProps: "borderRadius",
            },
            0,
          );
        }
      });

      cleanup = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [value]);

  return (
    <div className={cn("inline-flex flex-wrap gap-1.5", className)}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            ref={(el) => {
              if (el) buttonRefs.current.set(option.value, el);
              else buttonRefs.current.delete(option.value);
            }}
            onClick={(event) => {
              if (option.value === value) return;

              event.currentTarget.style.borderRadius = INACTIVE_RADIUS;
              const currentButton = buttonRefs.current.get(value);
              if (currentButton) currentButton.style.borderRadius = ACTIVE_RADIUS;

              onChange(option.value);
            }}
            className={cn(
              "px-5 py-2.5 text-[1rem] font-medium transition-colors",
              isActive
                ? "rounded-full bg-toggle-active text-toggle-active-foreground"
                : "rounded-[6px] bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
