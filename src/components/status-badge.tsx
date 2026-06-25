/* eslint-disable prettier/prettier */
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["ticket_status"];

const MAP: Record<Status, { label: string; className: string; Icon: typeof Clock }> = {
  pending: {
    label: "Pendente",
    className: "bg-[#f84131] text-white ",
    Icon: Clock,
  },
  in_progress: {
    label: "Em andamento",
    className: "bg-[#5227FF] text-white ",
    Icon: Loader2,
  },
  resolved: {
    label: "Resolvido",
    className: `bg-[#a1ff62] text-[#333]`,
    Icon: CheckCircle2,
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, className, Icon } = MAP[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[5px] border px-3 py-1.5 text-[1.1rem] font-medium ${className}`}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

export const departmentLabel = (d: "ti" | "manutencao") => (d === "ti" ? "TI" : "Manutenção");
