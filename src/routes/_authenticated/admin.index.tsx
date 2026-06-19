import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, departmentLabel } from "@/components/status-badge";
import { useAdmin, type Department } from "@/hooks/use-admin";
import { usePageEnter } from "@/hooks/use-gsap";
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

  const effectiveDepts = useMemo(
    () => (dept === "all" ? depts : [dept]),
    [dept, depts],
  );

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
    <div ref={ref} className="px-8 py-8 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral dos chamados em aberto.
          </p>
        </div>
        {admin?.isSuper && (
          <Link
            to="/admin/relatorios"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Ver relatórios →
          </Link>
        )}
      </header>

      <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pendentes" value={stats.pending} tone="warning" />
        <StatCard label="Em andamento" value={stats.inProgress} />
        <StatCard label="Resolvidos" value={stats.resolved} tone="success" />
      </section>

      <section className="mt-8 flex flex-wrap gap-2">
        {depts.length > 1 && (
          <FilterGroup
            value={dept}
            onChange={(v) => setDept(v as Department | "all")}
            options={[
              { value: "all", label: "Todos" },
              ...depts.map((d) => ({ value: d, label: departmentLabel(d) })),
            ]}
          />
        )}
        <FilterGroup
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

      <section className="mt-4 rounded-md border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando…
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum chamado encontrado.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Chamado</th>
                <th className="text-left px-4 py-3 font-medium">Setor</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Aberto</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-border hover:bg-surface/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/chamados/$id"
                      params={{ id: t.id }}
                      className="font-medium hover:underline"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.user_name_snapshot} · {departmentLabel(t.department)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.sector?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
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
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FilterGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1.5 text-xs rounded-[4px] transition-colors",
            value === o.value
              ? "bg-surface-2 text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
