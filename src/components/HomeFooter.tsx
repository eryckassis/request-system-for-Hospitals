/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUp, Heart, Plus } from "lucide-react";

import { buttonTextSlideHoverHandlers } from "@/hooks/use-gsap";

type HomeFooterProps = {
  onScrollToTop: () => void;
  adminLinkLabel?: string;
  adminLinkTo?: "/" | "/admin/login";
};

export function HomeFooter({
  onScrollToTop,
  adminLinkLabel = "Área administrativa",
  adminLinkTo = "/admin/login",
}: HomeFooterProps) {
  return (
    <footer className="relative z-10 overflow-hidden">
      <section className="border-border bg-[#5527FF]">
        <div className="grid w-full grid-cols-1 items-center gap-8 px-8 py-8 text-sm text-white sm:px-12 lg:grid-cols-[1fr_auto_1fr_auto] lg:px-16">
          <div className="justify-self-start">
            <p className="text-[1.25rem] uppercase font-aeonik-regular tracking-widest text-foreground">
              Sistema interno
            </p>
            <p className="text-[1.25rem] mt-3 max-w-sm font-aeonik-regular leading-relaxed">
              Gestão de chamados para TI e Manutenção do Hospital Ubarana.
            </p>
          </div>

          <div className=" text-[1.25rem] space-y-1 font-aeonik-regular lg:justify-self-center lg:text-center">
            <p className="text-foreground">Atendimento rápido</p>
            <p>Sem cadastro para abrir chamados.</p>
          </div>

          <div className="text-[1.25rem] space-y-2 font-aeonik-regular lg:justify-self-end lg:text-right">
            <p>© {new Date().getFullYear()} Sistema de Chamados.</p>
            <p className="inline-flex items-center gap-1">
              Feito para Hospital Ubarana
              <Heart className="size-4.5 fill-[#ff2756] text-[#ff2732]" aria-hidden="true" />
            </p>
          </div>

          <button
            type="button"
            data-lenis-prevent
            aria-label="Voltar ao topo"
            onClick={onScrollToTop}
            {...buttonTextSlideHoverHandlers(".footer-arrow-icon")}
            className="group flex size-18 shrink-0 cursor-pointer items-center justify-center rounded-full bg-foreground text-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background lg:justify-self-end"
          >
            <span className="relative inline-flex h-7 w-7 flex-col overflow-hidden">
              <ArrowUp
                className="footer-arrow-icon size-7 shrink-0 will-change-transform"
                aria-hidden="true"
              />
              <ArrowUp
                className="footer-arrow-icon size-7 shrink-0 will-change-transform"
                aria-hidden="true"
              />
            </span>
          </button>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto w-full px-8 py-12 sm:px-12 md:py-16 lg:px-16">
          <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="max-w-50 text-[1.25rem] font-aeonik-regular uppercase leading-tight text-foreground">
                Continue rolando
                <br />
                para saber mais
              </p>

              <h2 className="mt-12 text-5xl font-aeonik-regular tracking-tight text-foreground sm:text-6xl md:text-8xl">
                Hospital Ubarana
              </h2>
            </div>

            <Link
              to={adminLinkTo}
              data-lenis-prevent
              {...buttonTextSlideHoverHandlers()}
              className="inline-flex items-center gap-3 justify-self-end text-[2rem] font-aeonik-regular text-foreground focus:outline-none focus:ring-2 focus:ring-ring md:justify-self-end"
            >
              <span className="relative  inline-flex h-[1.4em] flex-col overflow-hidden">
                <span className="button-slide-text inline-flex h-[1.4em] items-center will-change-transform">
                  {adminLinkLabel}
                </span>
                <span className="button-slide-text inline-flex h-[1.4em] items-center will-change-transform">
                  {adminLinkLabel}
                </span>
              </span>

              <span
                className="hidden h-px w-28 bg-muted-foreground/40 sm:block"
                aria-hidden="true"
              />
              <span
                className="relative inline-flex h-7 w-7 flex-col overflow-hidden"
                aria-hidden="true"
              >
                <ArrowRight className="button-slide-text size-7  shrink-0 will-change-transform" />
                <ArrowRight className="button-slide-text size-7 shrink-0 will-change-transform" />
              </span>
            </Link>
          </div>
          <div className="relative left-1/2 mt-16 flex w-screen -translate-x-1/2 items-center justify-between px-8 text-foreground sm:px-12 lg:px-16">
            {Array.from({ length: 5 }).map((_, index) => (
              <Plus key={index} className="size-9" aria-hidden="true" />
            ))}
          </div>
        </div>
      </section>
    </footer>
  );
}
