/* eslint-disable prettier/prettier */
// eslint-disable-next-line prettier/prettier

import { useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { usePageEnter, buttonTextSlideHoverHandlers, loadGsap } from "@/hooks/use-gsap";
import { useLenisGsap } from "@/hooks/use-lenis-gsap";
//import GradualBlur from "@/components/GradualBlur";
import { HomeFooter } from "@/components/HomeFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sistema de Chamados — Abrir chamado" },
      {
        name: "description",
        content: "Abra um chamado para o time de TI ou Manutenção em segundos. Sem cadastro.",
      },
      { property: "og:title", content: "Sistema de Chamados" },
      {
        property: "og:description",
        content: "Abra um chamado para TI ou Manutenção em segundos.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const ref = usePageEnter<HTMLDivElement>();
  const heroRef = useRef<HTMLDivElement | null>(null);
  const scrollToTop = useLenisGsap();

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    void loadGsap().then((gsap) => {
      if (cancelled || !heroRef.current) return;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          "[data-hero-reveal]",
          { yPercent: 120, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power4.out",
            stagger: 0.08,
            delay: 0.12,
          },
        );
      }, heroRef);

      cleanup = () => ctx.revert();
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative isolate min-h-screen overflow-hidden bg-[#f4f4f8] text-[#0a0a0a] flex flex-col"
    >
      <header className="relative z-30">
        <div className="relative z-30 mt-10 w-full px-8 py-6 flex items-center justify-between sm:px-12 lg:px-16">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo do Sistema de Chamados"
              className="size-14 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-aeonik-regular text-[1.30rem] tracking-tight text-[#0a0a0a]">
                Hospital Ubarana
              </span>
              <span className="font-aeonik-regular text-[0.89rem] text-[#0a0a0a]/60">
                Sistema de Chamados
              </span>
            </div>
          </div>
          <Link
            to="/admin/login"
            data-lenis-prevent
            {...buttonTextSlideHoverHandlers()}
            className="relative z-40 inline-flex cursor-pointer rounded bg-[#5227FF] px-5 py-2.5 text-[1rem] font-[420] text-white focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <span className="relative text-[1.28rem] inline-flex h-[1.8em] flex-col overflow-hidden">
              <span className="button-slide-text inline-flex h-[1.8em] items-center will-change-transform">
                Acesso admin
              </span>
              <span className="button-slide-text inline-flex h-[1.8em] items-center will-change-transform">
                Acesso admin
              </span>
            </span>
          </Link>
        </div>
      </header>

      <main className="relative z-0 flex-1 flex flex-col">
        <div className="mt-0 w-full px-8 pt-8 pb-20 sm:px-12 lg:px-16">
          {/* <div
            ref={heroRef}
            className="grid  grid-cols-[minmax(0,1fr)_clamp(3rem,7vw,8.5rem)] items-start gap-[clamp(0.75rem,2vw,2rem)]"
          >
            <div className="min-w-0">
              <h1 className="font-aeonik-regular text-[clamp(5.5rem,17.1vw,19rem)] uppercase leading-[0.82] tracking-normal text-[#0a0a0a]">
                <span className="block overflow-hidden whitespace-nowrap">
                  <span data-hero-reveal className="inline-block will-change-transform">
                    Hospital
                  </span>
                </span>
              </h1>
              <p className="mt-3 ml-2 overflow-hidden font-aeonik-regular uppercase tracking-normal leading-none text-[2rem] text-[#0a0a0a]/50 sm:ml-4 sm:text-[2.75rem] md:text-[3.5rem] lg:ml-3 lg:text-[7.25rem]">
                <span data-hero-reveal className="inline-block will-change-transform">
                  Ubarana
                </span>
              </p>
            </div>

            <div className="flex w-[clamp(3rem,7vw,8.5rem)] shrink-0 flex-col items-end pt-[clamp(0.45rem,1.8vw,2rem)] font-aeonik-regular text-[#0a0a0a]/70">
              <span className="mr-[clamp(0.25rem,1vw,2rem)] overflow-hidden text-[clamp(1.125rem,4vw,4.5rem)] leading-none">
                <span data-hero-reveal className="inline-block will-change-transform">
                  26
                </span>
              </span>
              <span
                data-hero-reveal
                className="mt-[clamp(2rem,5.25vw,5.5rem)] inline-block overflow-hidden will-change-transform"
              >
                <ArrowDownRight
                  strokeWidth={0.8}
                  className="size-[clamp(2.5rem,7vw,9.75rem)] text-black"
                  aria-hidden="true"
                />
              </span>
            </div>
          </div> */}

          <div className="mt-48 grid grid-cols-[repeat(auto-fit,minmax(min(100%,28rem),1fr))] items-start justify-items-center gap-x-10 gap-y-14 font-aeonik-regular text-black">
            <DeptCard
              to="/chamados/novo"
              dept="ti"
              title="Suporte TI"
              categories={["computadores", "redes", "sistemas", "periféricos"]}
              image="/images/suporte-tii.jpg"
            />
            <DeptCard
              to="/chamados/novo"
              dept="manutencao"
              title="Manutenção"
              categories={["infraestrutura", "elétrica", "mobiliário"]}
              image="/images/manutencao1.jpg"
            />
          </div>
        </div>
      </main>

      <HomeFooter onScrollToTop={scrollToTop} />
    </div>
  );
}

function DeptCard({
  to,
  dept,
  title,
  categories,
  image,
}: {
  to: "/chamados/novo";
  dept: "ti" | "manutencao";
  title: string;
  categories: string[];
  image: string;
}) {
  return (
    <Link
      to={to}
      search={{ dept }}
      className="dept-card group flex w-full max-w-180 flex-col focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="aspect-5/3 w-full overflow-hidden rounded-md">
        <img src={image} alt={title} className="h-full w-full object-cover" />
      </div>

      <div className="mt-5 flex w-full min-w-0 flex-nowrap items-center gap-x-[clamp(0.25rem,0.7vw,0.5rem)] overflow-hidden whitespace-nowrap font-aeonik-regular text-[clamp(0.95rem,1.30vw,1.45rem)] uppercase tracking-[0.14em] text-black">
        {categories.map((category, index) => (
          <span
            key={category}
            className="inline-flex shrink-0 items-center gap-x-[clamp(0.25rem,0.7vw,0.5rem)]"
          >
            {index > 0 && <span aria-hidden="true">•</span>}
            <span>{category}</span>
          </span>
        ))}
      </div>

      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
        <h2 className="min-w-0 flex-1 font-aeonik-regular text-[2rem] tracking-tight text-[#0a0a0a] sm:text-[2.5rem] lg:text-[3rem]">
          {title}
        </h2>
        <span
          {...buttonTextSlideHoverHandlers()}
          className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#5227FF]  transition-opacity duration-200 group-hover:opacity-100 sm:size-11"
        >
          <span className="relative inline-flex h-5 w-5 flex-col overflow-hidden">
            <ArrowRight className="button-slide-text size-5 shrink-0 text-white will-change-transform" />
            <ArrowRight className="button-slide-text size-5 shrink-0 text-white will-change-transform" />
          </span>
        </span>
      </div>
    </Link>
  );
}
