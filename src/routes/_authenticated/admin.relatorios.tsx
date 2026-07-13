/* eslint-disable prettier/prettier */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { Download, FileSpreadsheet } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge, departmentLabel } from "@/components/status-badge";
import { AnimatedToggleGroup } from "@/components/ui/animated-toggle-group";
import { useAdmin, type Department } from "@/hooks/use-admin";
import { usePageEnter, buttonTextSlideHoverHandlers } from "@/hooks/use-gsap";

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  component: ReportsPage,
});

type StatusFilter = "all" | "pending" | "in_progress" | "resolved";
type DeptFilter = Department | "all";

const isoDate = (d: Date) => format(d, "yyyy-MM-dd");

const STATUS_LABEL: Record<Exclude<StatusFilter, "all">, string> = {
  pending: "Pendentes",
  in_progress: "Em andamento",
  resolved: "Concluídos",
};

function ReportsPage() {
  const ref = usePageEnter<HTMLDivElement>();
  const { data: admin } = useAdmin();
  const depts = admin?.departments ?? [];

  const today = new Date();
  const [from, setFrom] = useState(isoDate(startOfMonth(today)));
  const [to, setTo] = useState(isoDate(endOfMonth(today)));
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dept, setDept] = useState<DeptFilter>("all");

  const effectiveDepts = useMemo(
    () => (dept === "all" ? depts : [dept]),
    [dept, depts],
  );

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["report-tickets", effectiveDepts, from, to, status],
    enabled: effectiveDepts.length > 0,
    queryFn: async () => {
      let q = supabase
        .from("tickets")
        .select(
          "id, title, description, status, department, created_at, resolved_at, resolved_successfully, resolution_notes, user_name_snapshot, sector:sectors(name), resolver:admins(name)",
        )
        .in("department", effectiveDepts)
        .gte("created_at", `${from}T00:00:00`)
        .lte("created_at", `${to}T23:59:59`)
        .order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const resolved = tickets.filter((t) => t.status === "resolved");
    const success = resolved.filter((t) => t.resolved_successfully).length;
    return {
      total: tickets.length,
      pending: tickets.filter((t) => t.status === "pending").length,
      inProgress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: resolved.length,
      success,
    };
  }, [tickets]);

  const exportCsv = () => {
    // Sanitiza texto para Excel: remove quebras de linha e evita injeção de fórmulas
    const safe = (v: string | null | undefined) => {
      const s = (v ?? "").replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ").trim();
      return /^[=+\-@]/.test(s) ? `'${s}` : s;
    };

    const rows = tickets.map((t) => ({
      ID: safe(t.id),
      Titulo: safe(t.title),
      Descricao: safe(t.description),
      Departamento: safe(departmentLabel(t.department)),
      Setor: safe(t.sector?.name),
      Solicitante: safe(t.user_name_snapshot),
      Status:
        t.status === "pending"
          ? "Pendente"
          : t.status === "in_progress"
            ? "Em andamento"
            : "Concluído",
      "Aberto em": format(new Date(t.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      "Resolvido em": t.resolved_at
        ? format(new Date(t.resolved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
        : "",
      Responsavel: safe(t.resolver?.name),
      Sucesso:
        t.resolved_successfully === null ? "" : t.resolved_successfully ? "Sim" : "Não",
      Observacoes: safe(t.resolution_notes),
    }));

    const csv = Papa.unparse(rows, {
      quotes: true,
      delimiter: ";",
      newline: "\r\n",
    });
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const suffix = status === "all" ? "todos" : status;
    a.href = url;
    a.download = `chamados_${suffix}_${from}_a_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXlsx = async () => {
    // Sanitiza contra injeção de fórmulas, PRESERVANDO quebras de linha (\n)
    const safe = (v: string | null | undefined) => {
      const s = (v ?? "").replace(/\r\n/g, "\n").trim();
      return /^[=+\-@]/.test(s) ? `'${s}` : s;
    };

    const wb = new ExcelJS.Workbook();
    wb.creator = "Sistema de Chamados";
    wb.created = new Date();
    const ws = wb.addWorksheet("Chamados", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    // Colunas com largura personalizada — as colunas de texto longo têm mais espaço
    ws.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Título", key: "title", width: 32 },
      { header: "Descrição", key: "description", width: 60 },
      { header: "Departamento", key: "department", width: 18 },
      { header: "Setor", key: "sector", width: 22 },
      { header: "Solicitante", key: "requester", width: 24 },
      { header: "Status", key: "status", width: 16 },
      { header: "Aberto em", key: "opened_at", width: 18 },
      { header: "Resolvido em", key: "resolved_at", width: 18 },
      { header: "Responsável", key: "resolver", width: 22 },
      { header: "Sucesso", key: "success", width: 10 },
      { header: "Observações", key: "notes", width: 60 },
    ];

    // Estilo do cabeçalho
    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF5227FF" },
    };
    header.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    header.height = 22;

    tickets.forEach((t) => {
      ws.addRow({
        id: safe(t.id),
        title: safe(t.title),
        description: safe(t.description),
        department: safe(departmentLabel(t.department)),
        sector: safe(t.sector?.name),
        requester: safe(t.user_name_snapshot),
        status:
          t.status === "pending"
            ? "Pendente"
            : t.status === "in_progress"
              ? "Em andamento"
              : "Concluído",
        opened_at: format(new Date(t.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        resolved_at: t.resolved_at
          ? format(new Date(t.resolved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
          : "",
        resolver: safe(t.resolver?.name),
        success:
          t.resolved_successfully === null ? "" : t.resolved_successfully ? "Sim" : "Não",
        notes: safe(t.resolution_notes),
      });
    });

    // Wrap text + alinhamento em todas as células de dados
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.alignment = { vertical: "top", wrapText: true };
    });

    // AutoFilter no cabeçalho (permite filtrar dentro do Excel também)
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: ws.columns.length },
    };

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const suffix = status === "all" ? "todos" : status;
    a.href = url;
    a.download = `chamados_${suffix}_${from}_a_${to}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div ref={ref} className="px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-instrument italic tracking-tight">Relatórios</h1>
          <p className="mt-1 text-[1rem] font-aeonik-regular text-muted-foreground">
            Filtre por status e período, e exporte em CSV.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={tickets.length === 0}
          {...buttonTextSlideHoverHandlers()}
          className="inline-flex cursor-pointer items-center gap-2 rounded bg-[#5227FF] px-3 py-2 text-[1.15rem] font-[420] text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-4 shrink-0" />
          <span className="relative font-aeonik-regular inline-flex h-[1.4em] flex-col overflow-hidden">
            <span className="button-slide-text inline-flex h-[1.4em] items-center will-change-transform">
              Exportar CSV
            </span>
            <span className="button-slide-text inline-flex h-[1.4em] items-center will-change-transform">
              Exportar CSV
            </span>
          </span>
        </button>
      </header>

      {/* Filtros */}
      <section className="mt-6 rounded-[10px] border border-border bg-surface/40 p-4 md:p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="from" className="text-[0.95rem] font-aeonik-regular text-muted-foreground">
              De
            </Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="to" className="text-[0.95rem] font-aeonik-regular text-muted-foreground">
              Até
            </Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {depts.length > 1 && (
            <AnimatedToggleGroup
              value={dept}
              onChange={(v) => setDept(v as DeptFilter)}
              options={[
                { value: "all", label: "Todos setores" },
                ...depts.map((d) => ({ value: d, label: departmentLabel(d) })),
              ]}
            />
          )}
          <AnimatedToggleGroup
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
            options={[
              { value: "all", label: "Todos" },
              { value: "pending", label: "Pendentes" },
              { value: "in_progress", label: "Em andamento" },
              { value: "resolved", label: "Concluídos" },
            ]}
          />
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 font-aeonik-regular">
        <Stat label="Total no período" value={stats.total} />
        <Stat label="Pendentes" value={stats.pending} />
        <Stat label="Em andamento" value={stats.inProgress} />
        <Stat label="Concluídos" value={stats.resolved} />
      </section>

      {/* Tabela */}
      <section className="mt-4 rounded-[10px] border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center">
            <FileSpreadsheet className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhum chamado{status !== "all" ? ` ${STATUS_LABEL[status].toLowerCase()}` : ""} no período selecionado.
            </p>
          </div>
        ) : (
          <table className="w-full text-[1rem]">
            <thead className="bg-surface text-[0.9rem] font-aeonik-regular uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-aeonik-regular">Chamado</th>
                <th className="text-left px-4 py-3 font-aeonik-regular">Setor</th>
                <th className="text-left px-4 py-3 font-aeonik-regular">Status</th>
                <th className="text-left px-4 py-3 font-aeonik-regular">Aberto</th>
                <th className="text-left px-4 py-3 font-aeonik-regular">Resolvido</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-aeonik-regular">{t.title}</p>
                    <p className="text-[0.9rem] text-muted-foreground mt-0.5">
                      {t.user_name_snapshot} · {departmentLabel(t.department)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.sector?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[0.9rem]">
                    {format(new Date(t.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[0.9rem]">
                    {t.resolved_at
                      ? format(new Date(t.resolved_at), "dd/MM HH:mm", { locale: ptBR })
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
    <div className="rounded-[10px] border border-border bg-surface px-4 py-3">
      <p className="text-[0.85rem] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
