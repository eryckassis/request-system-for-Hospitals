import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Sistema de Chamados" }] }),
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});
