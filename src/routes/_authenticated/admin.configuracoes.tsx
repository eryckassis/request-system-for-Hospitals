import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createAdmin,
  deleteAdmin,
  listAdmins,
  updateAdmin,
} from "@/lib/admins.functions";
import { useAdmin, type AppRole } from "@/hooks/use-admin";
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
import { usePageEnter } from "@/hooks/use-gsap";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: ConfigPage,
});

const roleLabel: Record<AppRole, string> = {
  super: "Super admin",
  ti: "TI",
  manutencao: "Manutenção",
};

function ConfigPage() {
  const ref = usePageEnter<HTMLDivElement>();
  const navigate = useNavigate();
  const { data: me, isLoading: meLoading } = useAdmin();
  const qc = useQueryClient();

  const list = useServerFn(listAdmins);
  const create = useServerFn(createAdmin);
  const update = useServerFn(updateAdmin);
  const remove = useServerFn(deleteAdmin);

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ["admins-list"],
    enabled: !!me?.isSuper,
    queryFn: () => list(),
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("ti");
  const [creating, setCreating] = useState(false);

  if (meLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!me?.isSuper) {
    navigate({ to: "/admin", replace: true });
    return null;
  }

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await create({ data: { name, email, password, role } });
      toast.success("Admin criado");
      setName("");
      setEmail("");
      setPassword("");
      setRole("ti");
      qc.invalidateQueries({ queryKey: ["admins-list"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro");
    } finally {
      setCreating(false);
    }
  };

  const onChangeRole = async (id: string, newRole: AppRole) => {
    try {
      await update({ data: { id, role: newRole } });
      toast.success("Papel atualizado");
      qc.invalidateQueries({ queryKey: ["admins-list"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro");
    }
  };

  const onResetPassword = async (id: string) => {
    const pwd = prompt("Nova senha (mínimo 8 caracteres):");
    if (!pwd || pwd.length < 8) return;
    try {
      await update({ data: { id, password: pwd } });
      toast.success("Senha atualizada");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Excluir este admin?")) return;
    try {
      await remove({ data: { id } });
      toast.success("Admin excluído");
      qc.invalidateQueries({ queryKey: ["admins-list"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro");
    }
  };

  return (
    <div ref={ref} className="px-8 py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gerencie os administradores do sistema.
      </p>

      <form
        onSubmit={onCreate}
        className="mt-6 rounded-md border border-border bg-surface p-5 grid gap-3 md:grid-cols-2"
      >
        <div>
          <Label htmlFor="ad-name">Nome</Label>
          <Input
            id="ad-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5"
            required
            minLength={2}
          />
        </div>
        <div>
          <Label htmlFor="ad-email">Email</Label>
          <Input
            id="ad-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
            required
          />
        </div>
        <div>
          <Label htmlFor="ad-pass">Senha</Label>
          <Input
            id="ad-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
            required
            minLength={8}
          />
        </div>
        <div>
          <Label>Papel</Label>
          <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ti">TI</SelectItem>
              <SelectItem value="manutencao">Manutenção</SelectItem>
              <SelectItem value="super">Super admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={creating}>
            {creating && <Loader2 className="size-4 mr-2 animate-spin" />}
            Criar admin
          </Button>
        </div>
      </form>

      <section className="mt-6 rounded-md border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando…
          </div>
        ) : admins.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum admin cadastrado.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 w-32" />
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const currentRole = (a.roles[0] ?? "ti") as AppRole;
                const isMe = a.id === me.id;
                return (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-3">{a.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={currentRole}
                        onValueChange={(v) =>
                          onChangeRole(a.id, v as AppRole)
                        }
                        disabled={isMe}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ti">{roleLabel.ti}</SelectItem>
                          <SelectItem value="manutencao">
                            {roleLabel.manutencao}
                          </SelectItem>
                          <SelectItem value="super">
                            {roleLabel.super}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onResetPassword(a.id)}
                          className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                          Senha
                        </button>
                        {!isMe && (
                          <button
                            onClick={() => onDelete(a.id)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Excluir"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
