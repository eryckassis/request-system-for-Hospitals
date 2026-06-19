import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type Department = Database["public"]["Enums"]["department"];

export type AdminContext = {
  id: string;
  email: string;
  name: string;
  roles: AppRole[];
  isSuper: boolean;
  departments: Department[];
};

async function fetchAdminContext(): Promise<AdminContext | null> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return null;

  const [{ data: admin }, { data: rolesRows }] = await Promise.all([
    supabase.from("admins").select("id, email, name").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const roles = (rolesRows ?? []).map((r) => r.role as AppRole);
  const isSuper = roles.includes("super");
  const departments: Department[] = isSuper
    ? ["ti", "manutencao"]
    : roles.filter((r): r is Department => r === "ti" || r === "manutencao");

  return {
    id: user.id,
    email: admin?.email ?? user.email ?? "",
    name: admin?.name ?? user.email ?? "Admin",
    roles,
    isSuper,
    departments,
  };
}

export function useAdmin() {
  return useQuery({
    queryKey: ["admin-context"],
    queryFn: fetchAdminContext,
    staleTime: 60_000,
  });
}
