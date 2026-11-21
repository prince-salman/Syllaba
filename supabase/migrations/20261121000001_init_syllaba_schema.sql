CREATE TABLE IF NOT EXISTS public.roadmaps (
  id text PRIMARY KEY,
  course_title text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.curated_resources (
  id text PRIMARY KEY,
  roadmap_id text NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  module_topic text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  source_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onchain_proofs (
  id text PRIMARY KEY,
  roadmap_id text NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  roadmap_hash text NOT NULL,
  ipfs_cid text,
  tx_hash text NOT NULL,
  chain_id integer NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.roadmaps TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.curated_resources TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.onchain_proofs TO anon, authenticated;

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onchain_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public hackathon access roadmaps" ON public.roadmaps;
CREATE POLICY "Public hackathon access roadmaps"
  ON public.roadmaps FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public hackathon access resources" ON public.curated_resources;
CREATE POLICY "Public hackathon access resources"
  ON public.curated_resources FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public hackathon access proofs" ON public.onchain_proofs;
CREATE POLICY "Public hackathon access proofs"
  ON public.onchain_proofs FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);
