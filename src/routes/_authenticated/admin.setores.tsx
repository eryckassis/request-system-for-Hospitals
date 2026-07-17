/* eslint-disable prettier/prettier */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdmin, type Department } from "@/hooks/use-admin";
import { departmentLabel } from "@/components/status-badge";
import { usePageEnter, buttonTextSlideHoverHandlers } from "@/hooks/use-gsap";

export const Route = createFileRoute("/_authenticated/admin/setores")({
  component: SectorsPage,
});

function SectorsPage() {
  const ref = usePageEnter<HTMLDivElement>();
  const { data: admin } = useAdmin();
  const qc = useQueryClient();
  const depts = admin?.departments ?? [];
  const [name, setName] = useState("");
  const [dept, setDept] = useState<Department | "">("");
  const [creating, setCreating] = useState(false);
  const { data: sectors = [], isLoading } = useQuery({
    queryKey: ["sectors", depts],
    enabled: depts.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sectors")
        .select("id, name, department, created_at")
        .in("department", depts)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dept || !name.trim()) return;
    setCreating(true);
    const { error } = await supabase
      .from("sectors")
      .insert({ name: name.trim(), department: dept });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Setor criado");
    setName("");
    qc.invalidateQueries({ queryKey: ["sectors"] });
  };

  const onDelete = async (id: string) => {
    if (!confirm("Excluir este setor?")) return;
    const { error } = await supabase.from("sectors").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Setor excluído");
    qc.invalidateQueries({ queryKey: ["sectors"] });
  };

  return (
    <div ref={ref} className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-instrument italic tracking-tight">Setores</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cadastre os setores disponíveis para abertura de chamados.
      </p>

      <form
        onSubmit={onCreate}
        className="mt-6 rounded-md border border-border bg-surface p-5 grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end"
      >
        <div>
          <Label htmlFor="sector-name">Nome</Label>
          <Input
            id="sector-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5"
            placeholder="Ex.: Recepção"
            required
          />
        </div>
        <div>
          <Label>Departamento</Label>
          <Select value={dept} onValueChange={(v) => setDept(v as Department)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {depts.map((d) => (
                <SelectItem key={d} value={d}>
                  {departmentLabel(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          disabled={creating || !name.trim() || !dept}
          {...buttonTextSlideHoverHandlers()}
          className="gap-2 bg-[#5227FF] text-white hover:bg-[#4521d9]"
        >
          {creating && <Loader2 className="size-4 shrink-0 animate-spin" />}
          <span className="relative inline-flex h-[1.25em] flex-col overflow-hidden">
            <span className="button-slide-text inline-flex h-[1.25em] items-center will-change-transform">
              Adicionar
            </span>
            <span className="button-slide-text inline-flex h-[1.25em] items-center will-change-transform">
              Adicionar
            </span>
          </span>
        </Button>
      </form>

      <section className="mt-6 rounded-md border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : sectors.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum setor cadastrado.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Departamento</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {sectors.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {departmentLabel(s.department)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(s.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Excluir setor"
                    >
                      <Trash2 className="size-4" />
                    </button>
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
