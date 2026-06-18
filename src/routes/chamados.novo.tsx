import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  dept: z.enum(["ti", "manutencao"]).optional(),
});

export const Route = createFileRoute("/chamados/novo")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Novo chamado — Sistema de Chamados" },
      { name: "description", content: "Abra um novo chamado para TI ou Manutenção." },
    ],
  }),
  component: NewTicketPage,
});

function NewTicketPage() {
  const { dept } = Route.useSearch();
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {dept === "ti" ? "TI" : dept === "manutencao" ? "Manutenção" : "Chamado"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Formulário em construção
        </h1>
        <p className="mt-3 text-muted-foreground text-sm">
          Esta etapa será implementada na Fase 2.
        </p>
      </div>
    </div>
  );
}
