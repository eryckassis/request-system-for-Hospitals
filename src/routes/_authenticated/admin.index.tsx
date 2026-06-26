/* eslint-disable prettier/prettier */
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, departmentLabel } from "@/components/status-badge";
import { useAdmin, type Department } from "@/hooks/use-admin";
import { AnimatedToggleGroup } from "@/components/ui/animated-toggle-group";
import { usePageEnter, buttonTextSlideHoverHandlers } from "@/hooks/use-gsap";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "pending" | "in_progress" | "resolved";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: DashboardPage,
});

function DashboardPage() {
  const ref = usePageEnter<HTMLDivElement>();
  const { data: admin } = useAdmin();
  const depts = admin?.departments ?? [];
  const [dept, setDept] = useState<Department | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const qc = useQueryClient();

  const effectiveDepts = useMemo(() => (dept === "all" ? depts : [dept]), [dept, depts]);

  // Realtime: novos chamados chegam sem recarregar + popup
  useEffect(() => {
    if (effectiveDepts.length === 0) return;

    const channel = supabase
      .channel("tickets-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tickets" },
        (payload) => {
          const row = payload.new as {
            department: Department;
            title: string;
            user_name_snapshot: string;
            id: string;
          };
          if (!effectiveDepts.includes(row.department)) return;
          qc.invalidateQueries({ queryKey: ["admin-tickets"] });
          toast(
            <div className="flex items-start gap-3">
              <BellRing className="size-4 mt-0.5 text-warning shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Novo chamado</p>
                <p className="text-muted-foreground">
                  {row.user_name_snapshot} — {row.title}
                </p>
              </div>
            </div>,
            {
              action: {
                label: "Abrir",
                onClick: () => {
                  window.location.href = `/admin/chamados/${row.id}`;
                },
              },
              duration: 8000,
            },
          );
        },
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tickets" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveDepts, qc]);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-tickets", effectiveDepts, status],
    enabled: effectiveDepts.length > 0,
    queryFn: async () => {
      let q = supabase
        .from("tickets")
        .select(
          "id, title, status, department, created_at, user_name_snapshot, sector:sectors(name)",
        )
        .in("department", effectiveDepts)
        .order("created_at", { ascending: false })
        .limit(100);
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const pending = tickets.filter((t) => t.status === "pending").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    return { total: tickets.length, pending, inProgress, resolved };
  }, [tickets]);

  return (
    <div ref={ref} className="px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-instrument italic  text-4xl  tracking-tight">Dashboard</h1>
          <p className="mt-1 text-[1rem] font-aeonik-regular  text-muted-foreground">
            Visão geral dos chamados em aberto.
          </p>
        </div>
        {admin?.isSuper && (
          <Link
            to="/admin/relatorios"
            {...buttonTextSlideHoverHandlers()}
            className="inline-flex cursor-pointer rounded bg-[#5227FF] px-2 py-2 text-[1.30rem] font-[420] text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <span className="relative font-aeonik-regular  inline-flex h-[1.4em] flex-col overflow-hidden">
              <span className="button-slide-text inline-flex h-[1.4em] items-center will-change-transform">
                Ver relatórios
              </span>
              <span className="button-slide-text inline-flex h-[1.4em] items-center will-change-transform">
                Ver relatórios
              </span>
            </span>
          </Link>
        )}
      </header>

      <section className="mt-6 font-aeonik-regular  grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pendentes" value={stats.pending} tone="warning" />
        <StatCard label="Em andamento" value={stats.inProgress} />
        <StatCard label="Resolvidos" value={stats.resolved} tone="success" />
      </section>

      <section className="mt-8 flex flex-wrap gap-2">
        {depts.length > 1 && (
          <AnimatedToggleGroup
            value={dept}
            onChange={(v) => setDept(v as Department | "all")}
            options={[
              { value: "all", label: "Todos" },
              ...depts.map((d) => ({ value: d, label: departmentLabel(d) })),
            ]}
          />
        )}
        <AnimatedToggleGroup
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={[
            { value: "all", label: "Todos status" },
            { value: "pending", label: "Pendentes" },
            { value: "in_progress", label: "Em andamento" },
            { value: "resolved", label: "Resolvidos" },
          ]}
        />
      </section>

      <section className="mt-4 rounded-[10px] border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum chamado encontrado.
          </div>
        ) : (
          <table className="w-full text-[1rem]">
            <thead className="bg-surface text-[1rem] font-aeonik-regular  uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-aeonik-regular ">Chamado</th>
                <th className="text-left px-4 py-3 font-aeonik-regular ">Setor</th>
                <th className="text-left px-4 py-3 font-aeonik-regular ">Status</th>
                <th className="text-left px-4 py-3 font-aeonik-regular ">Aberto</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/chamados/$id"
                      params={{ id: t.id }}
                      className="font-aeonik-regular  hover:underline"
                    >
                      {t.title}
                    </Link>
                    <p className="text-[1rem] text-muted-foreground mt-0.5">
                      {t.user_name_snapshot} · {departmentLabel(t.department)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.sector?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 font-aeonik-regular  text-muted-foreground text-[1rem]">
                    {format(new Date(t.created_at), "dd/MM HH:mm", {
                      locale: ptBR,
                    })}
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

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning";
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-aeonik-regular  tabular-nums",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </p>
    </div>
  );
}
