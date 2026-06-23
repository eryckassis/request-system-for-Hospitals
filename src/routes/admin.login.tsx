/* eslint-disable prettier/prettier */
import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageEnter } from "@/hooks/use-gsap";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Acesso admin — Sistema de Chamados" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const ref = usePageEnter<HTMLDivElement>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vindo de volta");
    navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div ref={ref} className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-widest text-muted-foreground text-center">
          Painel administrativo
        </p>
        <h1 className=" font-instrument italic mt-3 text-3xl  tracking-tight text-center">
          Entrar
        </h1>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
            Entrar
          </Button>
        </form>

        <Link
          to="/"
          className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar ao início
        </Link>
      </div>
    </div>
  );
}
