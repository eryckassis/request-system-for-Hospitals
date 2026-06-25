/* eslint-disable prettier/prettier */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import Papa from "papaparse";
import { Download } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge, departmentLabel } from "@/components/status-badge";
import { useAdmin } from "@/hooks/use-admin";
import { usePageEnter, buttonTextSlideHoverHandlers } from "@/hooks/use-gsap";

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  component: ReportsPage,
});

const isoDate = (d: Date) => format(d, "yyyy-MM-dd");

function ReportsPage() {
  const ref = usePageEnter<HTMLDivElement>();
  const { data: admin } = useAdmin();
  const depts = admin?.departments ?? [];

  const today = new Date();
  const [from, setFrom] = useState(isoDate(startOfMonth(today)));
  const [to, setTo] = useState(isoDate(endOfMonth(today)));

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["report-tickets", depts, from, to],
    enabled: depts.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          "id, title, description, status, department, created_at, resolved_at, resolved_successfully, resolution_notes, user_name_snapshot, sector:sectors(name), resolver:admins(name)",
        )
        .in("department", depts)
        .gte("created_at", `${from}T00:00:00`)
        .lte("created_at", `${to}T23:59:59`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const resolved = tickets.filter((t) => t.status === "resolved");
    const success = resolved.filter((t) => t.resolved_successfully).length;
    return {
      total: tickets.length,
      resolved: resolved.length,
      success,
      pending: tickets.filter((t) => t.status !== "resolved").length,
    };
  }, [tickets]);

  const exportCsv = () => {
    const rows = tickets.map((t) => ({
      ID: t.id,
      Titulo: t.title,
      Departamento: departmentLabel(t.department),
      Setor: t.sector?.name ?? "",
      Solicitante: t.user_name_snapshot,
      Status: t.status,
      "Aberto em": format(new Date(t.created_at), "dd/MM/yyyy HH:mm", {
        locale: ptBR,
      }),
      "Resolvido em": t.resolved_at
        ? format(new Date(t.resolved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
        : "",
      Responsavel: t.resolver?.name ?? "",
      Sucesso: t.resolved_successfully === null ? "" : t.resolved_successfully ? "Sim" : "Não",
      Observacoes: t.resolution_notes ?? "",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chamados-${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={ref} className="px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-instrument italic tracking-tight">Relatórios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Exporte chamados por período.</p>
        </div>
        <Button
          onClick={exportCsv}
          disabled={tickets.length === 0}
          {...buttonTextSlideHoverHandlers()}
          className="gap-2 bg-[#5227FF] text-white hover:bg-[#4521d9]"
        >
          <Download className="size-4 shrink-0" />
          <span className="relative inline-flex h-[1.25em] flex-col overflow-hidden">
            <span className="button-slide-text inline-flex h-[1.25em] items-center will-change-transform">
              Exportar CSV
            </span>
            <span className="button-slide-text inline-flex h-[1.25em] items-center will-change-transform">
              Exportar CSV
            </span>
          </span>
        </Button>
      </header>

      <section className="mt-6 grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div>
          <Label htmlFor="from">De</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="to">Até</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1.5"
          />
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total" value={stats.total} />
        <Stat label="Em aberto" value={stats.pending} />
        <Stat label="Resolvidos" value={stats.resolved} />
        <Stat label="Com sucesso" value={stats.success} />
      </section>

      <section className="mt-4 rounded-md border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum chamado no período.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Chamado</th>
                <th className="text-left px-4 py-3 font-medium">Setor</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Aberto</th>
                <th className="text-left px-4 py-3 font-medium">Resolvido</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.user_name_snapshot} · {departmentLabel(t.department)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.sector?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {format(new Date(t.created_at), "dd/MM HH:mm", {
                      locale: ptBR,
                    })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {t.resolved_at
                      ? format(new Date(t.resolved_at), "dd/MM HH:mm", {
                          locale: ptBR,
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
