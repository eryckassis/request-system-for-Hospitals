/* eslint-disable prettier/prettier */
// eslint-disable-next-line prettier/prettier
import { createFileRoute, Link } from "@tanstack/react-router";
import { Monitor, Wrench, ArrowRight, ShieldCheck } from "lucide-react";
import { usePageEnter, buttonHoverHandlers } from "@/hooks/use-gsap";
import Silk from "@/components/Silk";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sistema de Chamados — Abrir chamado" },
      {
        name: "description",
        content:
          "Abra um chamado para o time de TI ou Manutenção em segundos. Sem cadastro.",
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

  return (
    <div ref={ref}
     className="relative isolate min-h-screen overflow-hidden bg-background flex flex-col">
      <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      >
        <Silk
        speed={3}
        scale={1}
        color="#5227FF"
        noiseIntensity={1.2}
        rotation={0}
         />
         <div className="absolute inset-0 bg-background/20" />
      </div>
      <header className="relative z-10  border-b border-border bg-background/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
           <img 
              src="/logo.png"
              alt="Logo do Sistema de Chamados"
              className="size-9 object-contain"
            />
            <div className="flex flex-col">
            <span className="font-semibold tracking-tight">
              Hospital Ubarana
              </span>

              <span className=" font-instrument italic text-xs text-muted-foreground">
                Sistema de Chamados
              </span>
            </div>
          </div>
          <Link
            to="/admin/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="size-4" />
            Acesso admin
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center">
        <div className="mx-auto max-w-5xl w-full px-6 py-16">
          <div className="max-w-2xl">
            <p className=" text-sm text-muted-foreground mb-3 uppercase tracking-widest">
              Sistema interno
            </p>
            <h1 className="font-instrument italic text-5xl sm:text-6xl font-light tracking-tight leading-[1.09]">
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
              title="TI"
              subtitle="Computadores, rede, sistemas e periféricos."
              Icon={Monitor}
            />
            <DeptCard
              to="/chamados/novo"
              dept="manutencao"
              title="Manutenção"
              subtitle="Elétrica, hidráulica, mobiliário e infraestrutura."
              Icon={Wrench}
            />
          </div>

          <div className="mt-10 text-sm text-muted-foreground">
            Já tem um número de chamado? Acesse{" "}
            <span className="text-foreground">/chamados/&lt;ID&gt;</span> para
            acompanhar.
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Sistema de Chamados.
        </div>
      </footer>
    </div>
  );
}

function DeptCard({
  to,
  dept,
  title,
  subtitle,
  Icon,
}: {
  to: "/chamados/novo";
  dept: "ti" | "manutencao";
  title: string;
  subtitle: string;
  Icon: typeof Monitor;
}) {
  return (
    <Link
      to={to}
      search={{ dept }}
      {...buttonHoverHandlers()}
      className="group block rounded-md border border-border bg-surface p-6 transition-colors hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="flex items-start justify-between">
        <div className="size-11 rounded-md bg-white/5 border border-border flex items-center justify-center">
          <Icon className="size-5" />
        </div>
        <ArrowRight className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </Link>
  );

}
