/* eslint-disable prettier/prettier */
// eslint-disable-next-line prettier/prettier
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { usePageEnter, cardHoverHandlers, buttonTextSlideHoverHandlers } from "@/hooks/use-gsap";
import Silk from "@/components/Silk";
import { Cast } from "@/components/animate-ui/icons/cast";
import { Hammer } from "@/components/animate-ui/icons/hammer";
import { useLenisGsap } from "@/hooks/use-lenis-gsap";
import { HomeFooter} from "@/components/HomeFooter";

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
  const scrollToTop = useLenisGsap();

  return (
    <div
      ref={ref}
      className="relative isolate min-h-screen overflow-hidden bg-background flex flex-col"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <Silk speed={3} scale={1} color="#5227FF" noiseIntensity={1.2} rotation={0} />
        <div className="absolute inset-0 bg-background/20" />
      </div>
      <header className="relative z-10   border-border bg-background/20 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo do Sistema de Chamados"
              className="size-15 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-[1.4rem] tracking-tight">Hospital Ubarana</span>

              <span className="text-[1.1rem] text-muted-foreground">Sistema de Chamados</span>
            </div>
          </div>
          <Link
            to="/admin/login"
            data-lenis-prevent
            {...buttonTextSlideHoverHandlers()}
            className=" inline-flex cursor-pointer rounded bg-[#5227FF] px-2 py-2 text-[1.30rem] font-[420] text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <span className="relative inline-flex h-[1.4em] flex-col overflow-hidden">
              <span className="button-slide-text inline-flex h-[1.4em] items-center will-change-transform">
                Acesso admin
              </span>
              <span className="button-slide-text inline-flex h-[1.4em] items-center will-change-transform">
                Acesso admin
              </span>
            </span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center">
        <div className="mx-auto max-w-5xl w-full px-6 py-16">
          <div className="max-w-2xl">
            <p className=" text-sm text-muted-foreground mb-3 uppercase tracking-widest">
              Sistema interno
            </p>
            <h1 className="font-instrument-serif italic text-6xl sm:text-7xl  tracking-tight leading-[1.09]">
              Abra um chamado em segundos.
            </h1>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl">
              Escolha o departamento responsável. Sem cadastro, sem login.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <DeptCard
              to="/chamados/novo"
              dept="ti"
              title="Suporte de TI"
              subtitle="Computadores, rede, sistemas e periféricos."
              Icon={Cast}
              animateIcon
            />
            <DeptCard
              to="/chamados/novo"
              dept="manutencao"
              title="Manutenção"
              subtitle="Elétrica, hidráulica, mobiliário e infraestrutura."
              Icon={Hammer}
              animateIcon
            />
          </div>

          <div className="mt-10 text-sm text-muted-foreground">
            Já tem um número de chamado? Acesse{" "}
            <span className="text-foreground">/chamados/&lt;ID&gt;</span> para acompanhar.
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
  subtitle,
  Icon,
  animateIcon = false,
}: {
  to: "/chamados/novo";
  dept: "ti" | "manutencao";
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{
    className?: string;
    animateOnHover?: boolean;
  }>;
  animateIcon?: boolean;
}) {
  return (
    <Link
      to={to}
      search={{ dept }}
      data-lenis-prevent
      {...cardHoverHandlers()}
      className="group block rounded-[10px] border border-border bg-surface p-6 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="flex items-start justify-between">
        <div className="size-11 rounded-md bg-white/5 border border-border flex items-center justify-center">
          <Icon className="size-6" animateOnHover={animateIcon} />
        </div>
        <span className="card-arrow-bg flex size-9 items-center justify-center overflow-hidden rounded-[5px] bg-[#5227FF] border border-white/10 will-change-transform">
          <span className="relative inline-flex h-5 flex-col overflow-hidden">
            <ArrowRight className="card-arrow-icon size-5 shrink-0 text-white will-change-transform" />
            <ArrowRight className="card-arrow-icon size-5 shrink-0 text-white will-change-transform" />
          </span>
        </span>
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </Link>
  );
}
