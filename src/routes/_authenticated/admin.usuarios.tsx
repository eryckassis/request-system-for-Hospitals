import { useMemo, useState } from "react";
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
import { useAdmin } from "@/hooks/use-admin";
import { usePageEnter } from "@/hooks/use-gsap";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: UsersPage,
});

function UsersPage() {
  const ref = usePageEnter<HTMLDivElement>();
  const { data: admin } = useAdmin();
  const qc = useQueryClient();
  const depts = admin?.departments ?? [];

  const [name, setName] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: sectors = [] } = useQuery({
    queryKey: ["sectors", depts],
    enabled: depts.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sectors")
        .select("id, name, department")
        .in("department", depts)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const sectorMap = useMemo(
    () => new Map(sectors.map((s) => [s.id, s])),
    [sectors],
  );

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", depts],
    enabled: sectors.length > 0,
    queryFn: async () => {
      const ids = sectors.map((s) => s.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("users")
        .select("id, name, sector_id, created_at")
        .in("sector_id", ids)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sectorId) return;
    setCreating(true);
    const { error } = await supabase
      .from("users")
      .insert({ name: name.trim(), sector_id: sectorId });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Usuário cadastrado");
    setName("");
    qc.invalidateQueries({ queryKey: ["users"] });
  };

  const onDelete = async (id: string) => {
    if (!confirm("Excluir este usuário?")) return;
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Usuário excluído");
    qc.invalidateQueries({ queryKey: ["users"] });
  };

  return (
    <div ref={ref} className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold tracking-tight">Usuários</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cadastre as pessoas vinculadas aos setores.
      </p>

      <form
        onSubmit={onCreate}
        className="mt-6 rounded-md border border-border bg-surface p-5 grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end"
      >
        <div>
          <Label htmlFor="user-name">Nome</Label>
          <Input
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5"
            placeholder="Nome completo"
            required
          />
        </div>
        <div>
          <Label>Setor</Label>
          <Select value={sectorId} onValueChange={setSectorId}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={creating || !name.trim() || !sectorId}>
          {creating && <Loader2 className="size-4 mr-2 animate-spin" />}
          Adicionar
        </Button>
      </form>

      <section className="mt-6 rounded-md border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum usuário cadastrado.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Setor</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(u.sector_id && sectorMap.get(u.sector_id)?.name) || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(u.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Excluir usuário"
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
