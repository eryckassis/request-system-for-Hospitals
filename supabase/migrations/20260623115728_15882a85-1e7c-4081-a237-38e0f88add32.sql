CREATE UNIQUE INDEX IF NOT EXISTS users_name_unique_idx ON public.users (lower(name));
-- upsert por name precisa de constraint nomeada, criamos uma equivalente
ALTER TABLE public.users ADD CONSTRAINT users_name_key UNIQUE (name);