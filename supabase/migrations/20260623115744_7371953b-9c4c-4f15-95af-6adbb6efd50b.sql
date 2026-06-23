CREATE POLICY "Anyone can insert users for ticket form"
  ON public.users FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update users for ticket form"
  ON public.users FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);