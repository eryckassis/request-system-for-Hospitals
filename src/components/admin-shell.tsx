/* eslint-disable prettier/prettier */
import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  LogOut,
  Settings,
  FileText,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { buttonTextSlideHoverHandlers } from "@/hooks/use-gsap";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { AdminAvatar } from "@/components/admin-avatar";
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
  const [open, setOpen] = useState(false);

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

  const NavLinks = () => (
    <>
      {nav.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center font-aeonik-regular  gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-surface-2 text-foreground"
                : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
            )}
          >
            <item.icon className="size-8" />
            {item.label}
          </Link>
        );
      })}
      {admin.isSuper && (
        <>
          <Link
            to="/admin/relatorios"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/admin/relatorios")
                ? "bg-surface-2 text-foreground"
                : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
            )}
          >
            <FileText className="size-8" />
            Relatórios
          </Link>
          <Link
            to="/admin/configuracoes"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/admin/configuracoes")
                ? "bg-surface-2 text-foreground"
                : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
            )}
          >
            <Settings className="size-8" />
            Configurações
          </Link>
        </>
      )}
    </>
  );

  const SidebarBody = (
    <>
      <div className="px-5 py-5 border-b border-border">
        <Link
          to="/admin"
          onClick={() => setOpen(false)}
          className="text-2xl font-aeonik-regular tracking-tight"
        >
          Sistema de Chamados
        </Link>
        <p className="mt-1 text-[11px] uppercase font-aeonik-regular  text-muted-foreground">
          {admin.isSuper ? "Administrador Geral" : admin.departments.join(" · ") || "Admin"}
        </p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavLinks />
      </nav>

      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 pb-3">
          <AdminAvatar userId={admin.id} name={admin.name} avatarUrl={admin.avatarUrl} editable />
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate">{admin.name}</p>
            <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          {...buttonTextSlideHoverHandlers()}
          className="w-full font-aeonik-regular  flex cursor-pointer items-center justify-center gap-2 rounded-md bg-[#5227FF] px-3 py-2 text-sm font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-[#4521d9] focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <LogOut className="size-4 shrink-0" />
          <span className="relative inline-flex h-[1.25em] flex-col overflow-hidden">
            <span className="button-slide-text inline-flex h-[1.25em] items-center will-change-transform">
              Sair
            </span>
            <span className="button-slide-text inline-flex h-[1.25em] items-center will-change-transform">
              Sair
            </span>
          </span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen md:flex md:h-dvh md:overflow-hidden">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <Link to="/admin" className="text-sm font-semibold tracking-tight">
          Sistema de Chamados
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <aside
            className="absolute right-0 top-0 h-full w-72 bg-surface border-l border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="size-5" />
            </button>
            {SidebarBody}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        {SidebarBody}
      </aside>

      <main className="min-w-0 flex-1 md:h-dvh md:overflow-y-auto md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden">
        {children}
      </main>
    </div>
  );
}
