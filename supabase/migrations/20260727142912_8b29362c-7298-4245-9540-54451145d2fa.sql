CREATE TABLE public.deleted_admins (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  deleted_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deleted_admins TO authenticated;
GRANT ALL ON public.deleted_admins TO service_role;

ALTER TABLE public.deleted_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super can read deleted admins"
  ON public.deleted_admins FOR SELECT TO authenticated
  USING (public.is_super(auth.uid()));

CREATE POLICY "Super can insert deleted admins"
  ON public.deleted_admins FOR INSERT TO authenticated
  WITH CHECK (public.is_super(auth.uid()));

CREATE POLICY "Super can update deleted admins"
  ON public.deleted_admins FOR UPDATE TO authenticated
  USING (public.is_super(auth.uid()))
  WITH CHECK (public.is_super(auth.uid()));

CREATE POLICY "Super can delete deleted admins"
  ON public.deleted_admins FOR DELETE TO authenticated
  USING (public.is_super(auth.uid()));