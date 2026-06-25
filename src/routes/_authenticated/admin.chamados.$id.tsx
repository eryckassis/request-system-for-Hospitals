/* eslint-disable prettier/prettier */
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, departmentLabel } from "@/components/status-badge";
import { useAdmin } from "@/hooks/use-admin";
import { usePageEnter, buttonTextSlideHoverHandlers } from "@/hooks/use-gsap";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["ticket_status"];

export const Route = createFileRoute("/_authenticated/admin/chamados/$id")({
  component: AdminTicketPage,
});

function AdminTicketPage() {
  const { id } = Route.useParams();
  const ref = usePageEnter<HTMLDivElement>();
  const { data: admin } = useAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          "id, title, description, department, status, images, user_name_snapshot, created_at, resolved_at, resolution_notes, resolved_successfully, sector:sectors(name)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { resolveTicketImageUrls } = await import("@/lib/image-url");
      const imageUrls = await resolveTicketImageUrls(data.images ?? []);
      return { ...data, imageUrls };
    },
  });

  const [status, setStatus] = useState<Status>("pending");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolvedSuccessfully, setResolvedSuccessfully] = useState<"true" | "false">("true");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setResolutionNotes(ticket.resolution_notes ?? "");
      setResolvedSuccessfully(ticket.resolved_successfully === false ? "false" : "true");
    }
  }, [ticket]);

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Chamado não encontrado.</p>
        <Link to="/admin" className="mt-4 inline-block text-sm underline">
          Voltar
        </Link>
      </div>
    );
  }

  const canManage = admin?.isSuper || admin?.departments.includes(ticket.department);

  const onSave = async () => {
    if (!canManage) return;
    setSaving(true);
    const willResolve = status === "resolved";
    const update: Database["public"]["Tables"]["tickets"]["Update"] = {
      status,
      resolution_notes: willResolve ? resolutionNotes || null : null,
      resolved_successfully: willResolve ? resolvedSuccessfully === "true" : null,
      resolved_at: willResolve ? new Date().toISOString() : null,
      resolved_by: willResolve ? admin!.id : null,
    };
    const { error } = await supabase.from("tickets").update(update).eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Chamado atualizado");
    qc.invalidateQueries({ queryKey: ["ticket", id] });
    qc.invalidateQueries({ queryKey: ["admin-tickets"] });
    if (willResolve) navigate({ to: "/admin" });
  };

  return (
    <div ref={ref} className="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
      <Link
        to="/admin"
        {...buttonTextSlideHoverHandlers()}
        className="inline-flex cursor-pointer items-center gap-2 rounded bg-[#5227FF] px-2 py-2 text-[1.30rem] font-[420] text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <ArrowLeft className="size-4" />
        <span className="relative inline-flex h-[1.4em] flex-col overflow-hidden">
          <span className="button-slide-text inline-flex h-[1.4em] items-center will-change-transform">
            Dashboard
          </span>
          <span className="button-slide-text inline-flex h-[1.4em] items-center will-change-transform">
            Dashboard
          </span>
        </span>
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={ticket.status} />
        <span className="text-xs text-muted-foreground">
          {departmentLabel(ticket.department)} · {ticket.sector?.name ?? "—"}
        </span>
      </div>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{ticket.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Aberto por <span className="text-foreground">{ticket.user_name_snapshot}</span> em{" "}
        {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      </p>

      <section className="mt-6">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Descrição</h2>
        <p className="mt-2 whitespace-pre-wrap leading-relaxed text-[15px]">{ticket.description}</p>
      </section>

      {ticket.imageUrls.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Imagens</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {ticket.imageUrls.map((src) => (
              <a
                key={src}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="block aspect-square rounded-md overflow-hidden border border-border bg-surface"
              >
                <img src={src} alt="" loading="lazy" className="size-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}

      {canManage ? (
        <section className="mt-8 rounded-md border border-border bg-surface p-5">
          <h2 className="text-sm font-medium">Atualizar chamado</h2>

          <div className="mt-4 grid gap-4">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === "resolved" && (
              <>
                <div>
                  <Label>Resultado</Label>
                  <Select
                    value={resolvedSuccessfully}
                    onValueChange={(v) => setResolvedSuccessfully(v as "true" | "false")}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Resolvido com sucesso</SelectItem>
                      <SelectItem value="false">Encerrado sem resolução</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notas de resolução</Label>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={4}
                    className="mt-1.5"
                    placeholder="Descreva o que foi feito…"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end">
              <Button onClick={onSave} disabled={saving}>
                {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Você não tem permissão para editar este chamado.
        </p>
      )}
    </div>
  );
}
