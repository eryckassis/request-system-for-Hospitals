import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Acesso admin — Sistema de Chamados" }],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Painel administrativo
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Login</h1>
        <p className="mt-3 text-muted-foreground text-sm">
          O fluxo de login será implementado na Fase 3.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar ao início
        </Link>
      </div>
    </div>
  );
}
