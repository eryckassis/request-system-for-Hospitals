# AnimatedToggleGroup — pill morphing com GSAP

Código completo para substituir o `FilterGroup` inline em `admin.index.tsx` por um
toggle reutilizável com pílula roxa animada via GSAP. Este documento **não foi
aplicado** ao código-fonte — copie os blocos abaixo manualmente quando quiser
implementar.

## 1. `src/styles.css` (diff)

Adicionar dentro do bloco `@theme inline`, perto de `--color-warning`:

```css
--color-toggle-active: var(--toggle-active);
--color-toggle-active-foreground: var(--toggle-active-foreground);
```

Adicionar dentro do bloco `:root, .dark`, perto de `--warning`:

```css
--toggle-active: #7c3aed;            /* roxo — pílula ativa */
--toggle-active-foreground: #fafafa;
```

## 2. `src/hooks/use-gsap.ts` (diff)

Exportar o helper `loadGsap` (hoje privado) para reuso no novo componente:

```diff
-function loadGsap() {
+export function loadGsap() {
   gsapPromise ??= import("gsap").then((module) => module.default);
   return gsapPromise;
 }
```

## 3. `src/components/ui/animated-toggle-group.tsx` (novo arquivo)

```tsx
import { useEffect, useRef } from "react";

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

export function AnimatedToggleGroup<T extends string>({
  value,
  onChange,
  options,
  className,
}: AnimatedToggleGroupProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const hasMounted = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const pill = pillRef.current;
    const activeButton = buttonRefs.current.get(value);
    if (!container || !pill || !activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const x = buttonRect.left - containerRect.left;
    const width = buttonRect.width;

    let cancelled = false;
    let cleanup = () => {};

    void loadGsap().then((gsap) => {
      if (cancelled || !pillRef.current) return;
      const ctx = gsap.context(() => {
        if (!hasMounted.current) {
          gsap.set(pill, { x, width });
          hasMounted.current = true;
        } else {
          gsap.to(pill, { x, width, duration: 0.3, ease: "power2.out" });
        }
      }, containerRef);
      cleanup = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-flex rounded-md border border-border bg-surface p-0.5",
        className,
      )}
    >
      <div
        ref={pillRef}
        className="absolute inset-y-0.5 left-0 rounded-full bg-toggle-active"
        style={{ willChange: "transform, width" }}
      />
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
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 px-3 py-1.5 text-xs rounded-[4px] transition-colors",
              isActive
                ? "text-toggle-active-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
```

> Nota: como a pílula é posicionada com `x`/`width` via GSAP (transform), o
> container usa `position: relative` e a pílula `position: absolute`. O `z-10`
> nos botões garante que o texto fique acima da pílula.

## 4. `src/routes/_authenticated/admin.index.tsx` (alterações)

### Import novo

```diff
 import { StatusBadge, departmentLabel } from "@/components/status-badge";
+import { AnimatedToggleGroup } from "@/components/ui/animated-toggle-group";
 import { useAdmin, type Department } from "@/hooks/use-admin";
```

### Substituir a seção de filtros (linhas ~144–165)

```diff
       <section className="mt-8 flex flex-wrap gap-2">
         {depts.length > 1 && (
-          <FilterGroup
+          <AnimatedToggleGroup
             value={dept}
             onChange={(v) => setDept(v as Department | "all")}
             options={[
               { value: "all", label: "Todos" },
               ...depts.map((d) => ({ value: d, label: departmentLabel(d) })),
             ]}
           />
         )}
-        <FilterGroup
+        <AnimatedToggleGroup
           value={status}
           onChange={(v) => setStatus(v as StatusFilter)}
           options={[
             { value: "all", label: "Todos status" },
             { value: "pending", label: "Pendentes" },
             { value: "in_progress", label: "Em andamento" },
             { value: "resolved", label: "Resolvidos" },
           ]}
         />
       </section>
```

### Remover a função `FilterGroup` (linhas ~252–279)

```diff
-function FilterGroup<T extends string>({
-  value,
-  onChange,
-  options,
-}: {
-  value: T;
-  onChange: (v: T) => void;
-  options: { value: T; label: string }[];
-}) {
-  return (
-    <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
-      {options.map((o) => (
-        <button
-          key={o.value}
-          onClick={() => onChange(o.value)}
-          className={cn(
-            "px-3 py-1.5 text-xs rounded-[4px] transition-colors",
-            value === o.value
-              ? "bg-surface-2 text-foreground"
-              : "text-muted-foreground hover:text-foreground",
-          )}
-        >
-          {o.label}
-        </button>
-      ))}
-    </div>
-  );
-}
```

`StatCard` continua igual e permanece no arquivo.

## Verificação manual sugerida

1. `npm run dev`, abrir `/admin` autenticado como admin.
2. Clicar entre as opções de departamento/status e confirmar que a pílula
   roxa desliza e redimensiona suavemente, sem "pulo" no primeiro render.
3. Confirmar que a troca de filtro ainda dispara a query `admin-tickets`
   corretamente (lista atualiza).
4. `tsc`/`npm run lint` para garantir tipagem do genérico `<T extends string>`.
