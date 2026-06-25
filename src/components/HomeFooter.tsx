/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUp, Heart, Plus } from "lucide-react";

import { circleArrowHoverHandlers, buttonTextSlideHoverHandlers } from "@/hooks/use-gsap";

type HomeFooterProps = {
  onScrollToTop: () => void;
};

export function HomeFooter({ onScrollToTop }: HomeFooterProps) {
  return (
    <footer className="relative z-10 overflow-hidden">
      <section className=" border-border bg-surface">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 text-sm text-muted-foreground md:grid-cols-[1fr_auto_auto] md:items-end">
          <div>
            <p className="text-xs uppercase tracking-widest text-foreground">Sistema interno</p>
            <p className="mt-3 max-w-sm leading-relaxed">
              Gestão de chamados para TI e Manutenção do Hospital Ubarana.
            </p>
          </div>

          <div className="space-y-1 md:text-center">
            <p className="text-foreground">Atendimento rápido</p>
            <p>Sem cadastro para abrir chamados.</p>
          </div>

          <div className="flex items-end justify-between gap-6 md:justify-end">
            <div className="space-y-2">
              <p>© {new Date().getFullYear()} Sistema de Chamados.</p>
              <p className="inline-flex items-center gap-1">
                Feito para Hospital Ubarana
                <Heart className="size-3.5 fill-[#5227FF] text-[#5227FF]" aria-hidden="true" />
              </p>
            </div>

            <button
              type="button"
              data-lenis-prevent
              aria-label="Voltar ao topo"
              onClick={onScrollToTop}
              {...circleArrowHoverHandlers()}
              className="group flex size-13 shrink-0 cursor-pointer items-center justify-center rounded-full bg-foreground text-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              <ArrowUp className="footer-arrow-icon size-5 will-change-transform" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="max-w-36 -ml-8 text-xs font-semibold uppercase leading-tight text-foreground lg:-ml-50">
                Continue rolando
                <br />
                para saber mais
              </p>

              <h2 className="mt-12 -ml-8 text-5xl font-medium tracking-tight text-foreground sm:text-6xl md:text-7xl lg:-ml-50">
                Hospital Ubarana
              </h2>
            </div>

            <Link
              to="/admin/login"
              data-lenis-prevent
              {...buttonTextSlideHoverHandlers()}
              className="inline-flex items-center gap-3 justify-self-start text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring md:justify-self-end"
            >
              <span className="relative  inline-flex h-[1.4em] flex-col overflow-hidden">
                <span className="button-slide-text inline-flex h-[1.4em] items-center will-change-transform">
                  Área administrativa
                </span>
                <span className="button-slide-text inline-flex h-[1.4em] items-center will-change-transform">
                  Área administrativa
                </span>
              </span>

              <span className="hidden h-px w-28 bg-muted-foreground/40 sm:block" aria-hidden="true" />
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="relative left-1/2 mt-12 flex w-screen -translate-x-1/2 items-center justify-between px-8 text-foreground sm:px-12 lg:px-16">
  {Array.from({ length: 5 }).map((_, index) => (
    <Plus key={index} className="size-5" aria-hidden="true" />
  ))}
</div>
        </div>
      </section>
    </footer>
  );
}
