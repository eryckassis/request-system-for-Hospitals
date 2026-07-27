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

    const email = data.email.toLowerCase();

    // 1) E-mail já pertence a um admin ATIVO? Bloqueia.
    const { data: activeAdmin, error: activeErr } = await context.supabase
      .from("admins")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (activeErr) throw new Error(activeErr.message);
    if (activeAdmin) {
      throw new Error(
        `Já existe um administrador ativo com o e-mail ${email}.`,
      );
    }

    // 2) E-mail pertence a um admin que foi EXCLUÍDO? Reativa reaproveitando a conta de auth.
    const { data: prior, error: priorErr } = await context.supabase
      .from("deleted_admins")
      .select("id, email, name")
      .ilike("email", email)
      .maybeSingle();
    if (priorErr) throw new Error(priorErr.message);

    if (prior) {
      // Recria os vínculos com o mesmo user_id do auth.users original.
      const { error: aErr } = await context.supabase
        .from("admins")
        .upsert({ id: prior.id, name: data.name, email });
      if (aErr) throw new Error(`Erro ao reativar admin: ${aErr.message}`);

      // Garante papel único.
      await context.supabase.from("user_roles").delete().eq("user_id", prior.id);
      const { error: roleErr } = await context.supabase
        .from("user_roles")
        .insert({ user_id: prior.id, role: data.role });
      if (roleErr) throw new Error(`Erro ao definir papel: ${roleErr.message}`);

      // Limpa o registro de exclusão.
      await context.supabase.from("deleted_admins").delete().eq("id", prior.id);

      return {
        id: prior.id,
        reactivated: true,
        message:
          "Este e-mail pertencia a um admin excluído. A conta foi reativada — peça ao usuário para usar 'Esqueci minha senha' na tela de login para definir uma nova senha (a senha informada aqui não é aplicada nessa reativação).",
      };
    }

    // 3) E-mail novo: cria via signUp público.
    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;

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
      email,
      password: data.password,
      options: { data: { name: data.name } },
    });

    if (signUpErr || !signUp.user) {
      const msg = signUpErr?.message ?? "Falha ao criar usuário";
      if (/already|exists|registered|duplicate/i.test(msg)) {
        // Auth já tem esse e-mail mas não temos registro nem em admins nem em deleted_admins:
        // conta órfã de outra origem. Não conseguimos reaproveitar sem service role.
        throw new Error(
          `O e-mail ${email} já está cadastrado no sistema de autenticação, mas não pertence a nenhum administrador. Use outro e-mail ou peça ao dono da conta para acessar via "Esqueci minha senha".`,
        );
      }
      throw new Error(msg);
    }

    const userId = signUp.user.id;

    const { error: aErr } = await context.supabase
      .from("admins")
      .upsert({ id: userId, name: data.name, email });
    if (aErr) throw new Error(`Erro ao salvar admin: ${aErr.message}`);

    const { error: roleErr } = await context.supabase
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (roleErr) throw new Error(`Erro ao definir papel: ${roleErr.message}`);

    return { id: userId, reactivated: false };
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

    // Snapshot para permitir reativar depois com o mesmo auth user.
    const { data: adminRow, error: fetchErr } = await context.supabase
      .from("admins")
      .select("id, name, email")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!adminRow) throw new Error("Administrador não encontrado.");

    // Registra a exclusão (upsert por id para tolerar reexclusão).
    const { error: dErr } = await context.supabase
      .from("deleted_admins")
      .upsert(
        {
          id: adminRow.id,
          email: adminRow.email.toLowerCase(),
          name: adminRow.name,
          deleted_at: new Date().toISOString(),
          deleted_by: context.userId,
        },
        { onConflict: "id" },
      );
    if (dErr) {
      // Se houver colisão por e-mail (outra conta já excluída com mesmo e-mail),
      // sobrescreve o registro antigo mantendo o id atual.
      if (/duplicate|unique/i.test(dErr.message)) {
        await context.supabase
          .from("deleted_admins")
          .delete()
          .ilike("email", adminRow.email);
        const { error: retryErr } = await context.supabase
          .from("deleted_admins")
          .insert({
            id: adminRow.id,
            email: adminRow.email.toLowerCase(),
            name: adminRow.name,
            deleted_by: context.userId,
          });
        if (retryErr) throw new Error(retryErr.message);
      } else {
        throw new Error(dErr.message);
      }
    }

    // Revoga acesso removendo papéis e o registro de admin.
    // A conta em auth.users permanece, mas sem permissões — e poderá ser
    // reativada por um novo cadastro com o mesmo e-mail.
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
