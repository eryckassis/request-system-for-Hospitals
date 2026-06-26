/* eslint-disable prettier/prettier */
// eslint-disable-next-line prettier/prettier

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { usePageEnter, buttonTextSlideHoverHandlers } from "@/hooks/use-gsap";
import { useLenisGsap } from "@/hooks/use-lenis-gsap";
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
  useLenis();
  const ref = usePageEnter<HTMLDivElement>();
  const scrollToTop = useLenisGsap();

  return (
    <div
      ref={ref}
      className="relative isolate min-h-screen overflow-hidden bg-[#f4f4f8] text-[#0a0a0a] flex flex-col"
    >
      <header className="relative z-10">
        <div className="w-full px-8 py-6 flex items-center justify-between sm:px-12 lg:px-16">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo do Sistema de Chamados"
              className="size-14 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-aeonik-regular text-[1.25rem] tracking-tight text-[#0a0a0a]">
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
            className="inline-flex cursor-pointer rounded bg-[#5227FF] px-5 py-2.5 text-[1rem] font-[420] text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-ring"
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

      <main className="relative z-10 flex-1 flex flex-col">
        <div className="w-full px-8 pt-8 pb-20 sm:px-12 lg:px-16">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-5 sm:gap-8">
            <div className="min-w-0">
              <h1 className="font-aeonik-regular uppercase tracking-normal leading-[0.82] text-[5.5rem] text-[#0a0a0a] sm:text-[8rem] md:text-[12rem] lg:text-[16rem] xl:text-[19rem] 2xl:text-[22rem]">
                Hospital
              </h1>
              <p className="mt-5 ml-2 font-aeonik-regular uppercase tracking-normal leading-none text-[2rem] text-[#0a0a0a]/50 sm:ml-4 sm:text-[2.75rem] md:text-[3.5rem] lg:ml-5 lg:text-[4.25rem]">
                Ubarana
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end pt-3 font-aeonik-regular text-[#0a0a0a]/70 sm:pt-6 lg:pt-7">
              <span className="mr-2 text-lg leading-none sm:mr-4 sm:text-3xl lg:mr-8 lg:text-7xl">
                26
              </span>
              <ArrowDownRight
                strokeWidth={0.8}
                className="text-black  mt-8 size-10 sm:mt-16 sm:size-14 lg:mt-19 lg:size-39"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="font-aeonik-regular text-black mt-20 grid justify-items-center gap-10 sm:grid-cols-2">
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
              categories={["hidráulica", "elétrica", "mobiliário", "infraestrutura"]}
              image="/images/manutencao.jpg"
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
      data-lenis-prevent
      {...buttonTextSlideHoverHandlers()}
      className="group block max-w-[720px] focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="aspect-5/3 overflow-hidden rounded-md">
        <img
          src={image}
          alt={title}
          className="card-parallax-img h-full w-full scale-100 object-cover will-change-transform"
        />
      </div>

      <p className="mt-5 font-aeonik-regular text-[1.20rem] uppercase tracking-widest text-black">
        {categories.join(" • ")}
      </p>

      <div className="mt-2 flex items-center gap-4">
        <h2 className="font-aeonik-regular text-4xl sm:text-5xl tracking-tight text-[#0a0a0a]">
          {title}
        </h2>
        <span className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-[#5227FF] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="relative inline-flex h-5 w-5 flex-col overflow-hidden">
            <ArrowRight className="button-slide-text size-5 shrink-0 text-white will-change-transform" />
            <ArrowRight className="button-slide-text size-5 shrink-0 text-white will-change-transform" />
          </span>
        </span>
      </div>
    </Link>
  );
}
