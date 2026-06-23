import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const [{ data: admins, error: aErr }, { data: roles, error: rErr }] =
      await Promise.all([
        supabaseAdmin
          .from("admins")
          .select("id, name, email, created_at")
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("user_roles").select("user_id, role"),
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
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name },
    });
    if (error || !created.user) {
      const msg = error?.message ?? "Falha ao criar usuário";
      if (/already|exists|registered/i.test(msg)) {
        throw new Error(`Já existe uma conta com o e-mail ${data.email}.`);
      }
      throw new Error(msg);
    }
    const userId = created.user.id;
    const { error: aErr } = await supabaseAdmin
      .from("admins")
      .upsert({ id: userId, name: data.name, email: data.email });
    if (aErr) throw new Error(`Erro ao salvar admin: ${aErr.message}`);
    const { error: roleErr } = await supabaseAdmin
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
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    if (data.name) {
      const { error } = await supabaseAdmin
        .from("admins")
        .update({ name: data.name })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    if (data.password) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
        password: data.password,
      });
      if (error) throw new Error(error.message);
    }
    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
      const { error } = await supabaseAdmin
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
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
