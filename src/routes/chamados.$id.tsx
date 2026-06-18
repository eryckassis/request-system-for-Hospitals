import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, ImageOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, departmentLabel } from "@/components/status-badge";
import { usePageEnter } from "@/hooks/use-gsap";

const ticketQuery = (id: string) =>
  queryOptions({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          "id, title, description, department, status, images, user_name_snapshot, created_at, resolved_at, resolution_notes, resolved_successfully, sector:sectors(name), resolver:admins!tickets_resolved_by_fkey(name)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

export const Route = createFileRoute("/chamados/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(ticketQuery(params.id)),
  head: ({ params }) => ({
    meta: [{ title: `Chamado #${params.id.slice(0, 8)} — Sistema de Chamados` }],
  }),
  component: TicketViewPage,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Não foi possível carregar</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 text-sm underline text-muted-foreground hover:text-foreground"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Chamado não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verifique o link e tente novamente.
        </p>
        <Link to="/" className="mt-4 inline-block underline text-sm">
          Voltar
        </Link>
      </div>
    </div>
  ),
});

function TicketViewPage() {
  const { id } = Route.useParams();
  const { data: t } = useSuspenseQuery(ticketQuery(id));
  const ref = usePageEnter<HTMLDivElement>();

  return (
    <div ref={ref} className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Início
          </Link>
          <span className="text-xs text-muted-foreground font-mono">
            #{t.id.slice(0, 8)}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={t.status} />
          <span className="text-xs text-muted-foreground">
            {departmentLabel(t.department)} · {t.sector?.name ?? "—"}
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aberto por{" "}
          <span className="text-foreground">{t.user_name_snapshot}</span> em{" "}
          {format(new Date(t.created_at), "dd 'de' MMMM 'às' HH:mm", {
            locale: ptBR,
          })}
        </p>

        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
            Descrição
          </h2>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed text-[15px]">
            {t.description}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
            Imagens
          </h2>
          {t.images.length === 0 ? (
            <div className="mt-3 rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              <ImageOff className="mx-auto size-5 mb-2" />
              Nenhuma imagem anexada
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {t.images.map((src) => (
                <a
                  key={src}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-square rounded-md overflow-hidden border border-border bg-surface hover:border-white/40"
                >
                  <img
                    src={src}
                    alt="Anexo do chamado"
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </section>

        {t.status === "resolved" && (
          <section className="mt-8 rounded-md border border-success/30 bg-success/5 p-5">
            <h2 className="text-xs uppercase tracking-widest text-success">
              Resolução
            </h2>
            <p className="mt-2 text-sm">
              {t.resolved_successfully === false
                ? "Encerrado sem resolução."
                : "Resolvido com sucesso."}
              {t.resolver?.name && (
                <>
                  {" "}
                  por <span className="font-medium">{t.resolver.name}</span>
                </>
              )}
              {t.resolved_at && (
                <>
                  {" · "}
                  {format(new Date(t.resolved_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </>
              )}
            </p>
            {t.resolution_notes && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">
                {t.resolution_notes}
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
