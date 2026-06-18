import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/chamados/$id")({
  head: () => ({
    meta: [{ title: "Chamado — Sistema de Chamados" }],
  }),
  component: TicketViewPage,
});

function TicketViewPage() {
  const { id } = Route.useParams();
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Chamado
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">#{id.slice(0, 8)}</h1>
        <p className="mt-3 text-muted-foreground text-sm">
          Visualização será implementada na Fase 2.
        </p>
      </div>
    </div>
  );
}
