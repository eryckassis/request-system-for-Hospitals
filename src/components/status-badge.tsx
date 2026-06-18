import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["ticket_status"];

const MAP: Record<Status, { label: string; className: string; Icon: typeof Clock }> = {
  pending: {
    label: "Pendente",
    className: "bg-warning/10 text-warning border-warning/30",
    Icon: Clock,
  },
  in_progress: {
    label: "Em andamento",
    className: "bg-white/10 text-foreground border-white/20",
    Icon: Loader2,
  },
  resolved: {
    label: "Resolvido",
    className: "bg-success/10 text-success border-success/30",
    Icon: CheckCircle2,
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, className, Icon } = MAP[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

export const departmentLabel = (d: "ti" | "manutencao") =>
  d === "ti" ? "TI" : "Manutenção";
