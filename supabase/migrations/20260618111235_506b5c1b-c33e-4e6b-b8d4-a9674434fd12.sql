
-- ========== ENUMS ==========
CREATE TYPE public.department AS ENUM ('ti', 'manutencao');
CREATE TYPE public.ticket_status AS ENUM ('pending', 'in_progress', 'resolved');
CREATE TYPE public.app_role AS ENUM ('super', 'ti', 'manutencao');

-- ========== SECTORS ==========
CREATE TABLE public.sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department public.department NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sectors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sectors TO authenticated;
GRANT ALL ON public.sectors TO service_role;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- ========== USERS (end-users, no auth) ==========
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ========== ADMINS (linked to auth.users) ==========
CREATE TABLE public.admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- ========== USER_ROLES (secure role storage) ==========
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ========== SECURITY DEFINER HELPERS ==========
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'super');
$$;

-- True if admin has rights over a given department
CREATE OR REPLACE FUNCTION public.can_manage_department(_user_id uuid, _dept public.department)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user_id, 'super')
    OR (
      _dept = 'ti'::public.department AND public.has_role(_user_id, 'ti')
    )
    OR (
      _dept = 'manutencao'::public.department AND public.has_role(_user_id, 'manutencao')
    );
$$;

-- ========== TICKETS ==========
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  department public.department NOT NULL,
  sector_id uuid NOT NULL REFERENCES public.sectors(id),
  user_id uuid REFERENCES public.users(id),
  user_name_snapshot text NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'pending',
  images text[] NOT NULL DEFAULT '{}',
  resolution_notes text,
  resolved_successfully boolean,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.admins(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.tickets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE INDEX tickets_department_idx ON public.tickets (department);
CREATE INDEX tickets_status_idx ON public.tickets (status);
CREATE INDEX tickets_created_at_idx ON public.tickets (created_at DESC);
CREATE INDEX tickets_sector_id_idx ON public.tickets (sector_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER tickets_touch_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ========== RLS POLICIES ==========

-- sectors
CREATE POLICY "Anyone can read sectors" ON public.sectors FOR SELECT USING (true);
CREATE POLICY "Admins of department can insert sectors" ON public.sectors
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_department(auth.uid(), department));
CREATE POLICY "Admins of department can update sectors" ON public.sectors
  FOR UPDATE TO authenticated
  USING (public.can_manage_department(auth.uid(), department))
  WITH CHECK (public.can_manage_department(auth.uid(), department));
CREATE POLICY "Admins of department can delete sectors" ON public.sectors
  FOR DELETE TO authenticated
  USING (public.can_manage_department(auth.uid(), department));

-- users
CREATE POLICY "Anyone can read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Authenticated admins can insert users" ON public.users
  FOR INSERT TO authenticated WITH CHECK (
    sector_id IS NULL OR EXISTS (
      SELECT 1 FROM public.sectors s
      WHERE s.id = sector_id AND public.can_manage_department(auth.uid(), s.department)
    )
  );
CREATE POLICY "Authenticated admins can update users" ON public.users
  FOR UPDATE TO authenticated USING (
    sector_id IS NULL OR EXISTS (
      SELECT 1 FROM public.sectors s
      WHERE s.id = sector_id AND public.can_manage_department(auth.uid(), s.department)
    )
  ) WITH CHECK (
    sector_id IS NULL OR EXISTS (
      SELECT 1 FROM public.sectors s
      WHERE s.id = sector_id AND public.can_manage_department(auth.uid(), s.department)
    )
  );
CREATE POLICY "Authenticated admins can delete users" ON public.users
  FOR DELETE TO authenticated USING (
    sector_id IS NULL OR EXISTS (
      SELECT 1 FROM public.sectors s
      WHERE s.id = sector_id AND public.can_manage_department(auth.uid(), s.department)
    )
  );

-- admins
CREATE POLICY "Authenticated users can read admins" ON public.admins
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can update own row" ON public.admins
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Super can insert admins" ON public.admins
  FOR INSERT TO authenticated WITH CHECK (public.is_super(auth.uid()));
CREATE POLICY "Super can update any admin" ON public.admins
  FOR UPDATE TO authenticated USING (public.is_super(auth.uid())) WITH CHECK (public.is_super(auth.uid()));
CREATE POLICY "Super can delete admins" ON public.admins
  FOR DELETE TO authenticated USING (public.is_super(auth.uid()));

-- user_roles
CREATE POLICY "Authenticated users can read roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_super(auth.uid()))
  WITH CHECK (public.is_super(auth.uid()));

-- tickets
CREATE POLICY "Anyone can read tickets" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Anyone can create tickets" ON public.tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins of department can update tickets" ON public.tickets
  FOR UPDATE TO authenticated
  USING (public.can_manage_department(auth.uid(), department))
  WITH CHECK (public.can_manage_department(auth.uid(), department));
CREATE POLICY "Admins of department can delete tickets" ON public.tickets
  FOR DELETE TO authenticated
  USING (public.can_manage_department(auth.uid(), department));

-- ========== AUTO-CREATE ADMIN ROW ON SIGNUP ==========
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admins (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin();
