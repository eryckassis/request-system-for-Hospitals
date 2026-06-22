import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Building2, Users, LogOut, Settings, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/setores", label: "Setores", icon: Building2 },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: admin, isLoading } = useAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!admin || admin.roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Sem permissão</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta ainda não tem papel atribuído. Contate o super-admin.
          </p>
          <button
            onClick={signOut}
            className="mt-4 text-sm underline text-muted-foreground hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-border bg-surface flex flex-col">
        <div className="px-5 py-5 border-b border-border">
          <Link to="/admin" className="text-sm font-semibold tracking-tight">
            Sistema de Chamados
          </Link>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            {admin.isSuper ? "Super admin" : admin.departments.join(" · ") || "Admin"}
          </p>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-surface-2 text-foreground"
                    : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
          {admin.isSuper && (
            <>
              <Link
                to="/admin/relatorios"
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  pathname.startsWith("/admin/relatorios")
                    ? "bg-surface-2 text-foreground"
                    : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                )}
              >
                <FileText className="size-4" />
                Relatórios
              </Link>
              <Link
                to="/admin/configuracoes"
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  pathname.startsWith("/admin/configuracoes")
                    ? "bg-surface-2 text-foreground"
                    : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                )}
              >
                <Settings className="size-4" />
                Configurações
              </Link>
            </>
          )}
        </nav>

        <div className="px-3 py-3 border-t border-border">
          <div className="px-2 pb-2">
            <p className="text-sm truncate">{admin.name}</p>
            <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-surface-2/60 hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
