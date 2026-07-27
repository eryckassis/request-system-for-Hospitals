import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AppRole = "super" | "ti" | "manutencao";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  role: z.enum(["super", "ti", "manutencao"]),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(["super", "ti", "manutencao"]).optional(),
  password: z.string().min(8).max(72).optional(),
});

const deleteSchema = z.object({ id: z.string().uuid() });

async function assertSuper(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "super",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuper(context.supabase, context.userId);
    const [{ data: admins, error: aErr }, { data: roles, error: rErr }] =
      await Promise.all([
        context.supabase
          .from("admins")
          .select("id, name, email, created_at")
          .order("created_at", { ascending: false }),
        context.supabase.from("user_roles").select("user_id, role"),
      ]);
    if (aErr) throw new Error(aErr.message);
    if (rErr) throw new Error(rErr.message);
    const roleMap = new Map<string, AppRole[]>();
    for (const r of roles ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      roleMap.set(r.user_id, arr);
    }
    return (admins ?? []).map((a) => ({
      ...a,
      roles: roleMap.get(a.id) ?? [],
    }));
  });

export const createAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuper(context.supabase, context.userId);

    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;

    // Fresh isolated client so signUp doesn't touch the caller's session.
    const publicClient = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { data: signUp, error: signUpErr } = await publicClient.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name } },
    });

    if (signUpErr || !signUp.user) {
      const msg = signUpErr?.message ?? "Falha ao criar usuário";
      if (/already|exists|registered/i.test(msg)) {
        throw new Error(`Já existe uma conta com o e-mail ${data.email}.`);
      }
      throw new Error(msg);
    }

    const userId = signUp.user.id;

    // Ensure admins row (trigger handle_new_admin already inserts, but keep name/email fresh).
    const { error: aErr } = await context.supabase
      .from("admins")
      .upsert({ id: userId, name: data.name, email: data.email });
    if (aErr) throw new Error(`Erro ao salvar admin: ${aErr.message}`);

    const { error: roleErr } = await context.supabase
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (roleErr) throw new Error(`Erro ao definir papel: ${roleErr.message}`);

    return { id: userId };
  });

export const updateAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuper(context.supabase, context.userId);

    if (data.password) {
      throw new Error(
        "Redefinição de senha não está disponível neste ambiente. Peça ao admin para usar 'Esqueci minha senha' na tela de login.",
      );
    }

    if (data.name) {
      const { error } = await context.supabase
        .from("admins")
        .update({ name: data.name })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }

    if (data.role) {
      const { error: delErr } = await context.supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.id);
      if (delErr) throw new Error(delErr.message);
      const { error } = await context.supabase
        .from("user_roles")
        .insert({ user_id: data.id, role: data.role });
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });

export const deleteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuper(context.supabase, context.userId);
    if (data.id === context.userId) {
      throw new Error("Você não pode excluir a própria conta");
    }

    // Revoga acesso removendo papéis e o registro de admin.
    // Observação: a conta em auth.users permanece órfã (sem permissões).
    const { error: rErr } = await context.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.id);
    if (rErr) throw new Error(rErr.message);

    const { error: aErr } = await context.supabase
      .from("admins")
      .delete()
      .eq("id", data.id);
    if (aErr) throw new Error(aErr.message);

    return { ok: true };
  });
