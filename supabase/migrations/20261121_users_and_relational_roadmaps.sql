-- Syllaba Database Schema Upgrade: Unified public.users + Relational roadmaps + Cascade Delete
-- Execute this migration in Supabase SQL Editor (idempotent / safe for existing data).

-- 1. Create public.users as single source of truth (Email + E-Wallet)
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  wallet_address text UNIQUE,
  auth_provider text NOT NULL DEFAULT 'email', -- 'email' | 'wallet' | 'both'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Trigger: automatically insert/update public.users whenever a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, auth_user_id, email, full_name, auth_provider)
  VALUES (
    'user_' || NEW.id::text,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'email'
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. Backfill existing auth.users into public.users
INSERT INTO public.users (id, auth_user_id, email, full_name, auth_provider)
SELECT
  'user_' || id::text,
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'email'
FROM auth.users
ON CONFLICT (auth_user_id) DO NOTHING;

-- 3b. Backfill existing wallet addresses from legacy user_roadmaps into public.users
INSERT INTO public.users (id, wallet_address, full_name, auth_provider)
SELECT DISTINCT
  'wallet_' || lower(trim(wallet_address)),
  lower(trim(wallet_address)),
  left(lower(trim(wallet_address)), 6) || '...' || right(lower(trim(wallet_address)), 4),
  'wallet'
FROM public.user_roadmaps
WHERE wallet_address IS NOT NULL AND trim(wallet_address) <> ''
ON CONFLICT (id) DO NOTHING;

-- 4. Add ownership columns to roadmaps so primary key id stays pure ("roadmap_...")
ALTER TABLE public.roadmaps
  ADD COLUMN IF NOT EXISTS user_id text REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_scope text;

CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_owner_scope ON public.roadmaps(owner_scope);

-- 5. Enable ON DELETE CASCADE on foreign keys so deleting a roadmap cleans child rows
ALTER TABLE public.curated_resources
  DROP CONSTRAINT IF EXISTS curated_resources_roadmap_id_fkey,
  ADD CONSTRAINT curated_resources_roadmap_id_fkey
    FOREIGN KEY (roadmap_id) REFERENCES public.roadmaps(id) ON DELETE CASCADE;

ALTER TABLE public.onchain_proofs
  DROP CONSTRAINT IF EXISTS onchain_proofs_roadmap_id_fkey,
  ADD CONSTRAINT onchain_proofs_roadmap_id_fkey
    FOREIGN KEY (roadmap_id) REFERENCES public.roadmaps(id) ON DELETE CASCADE;
