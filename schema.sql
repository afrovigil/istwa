-- ==========================================================
-- ISTWAMONITOR - Supabase Database Schema & Realtime Setup
-- ==========================================================
-- Copy and paste this script into your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==========================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  mail TEXT NOT NULL UNIQUE,
  telephones JSONB DEFAULT '[]'::jsonb,
  habilitation TEXT DEFAULT 'opérateur',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Partners Table
CREATE TABLE IF NOT EXISTS public.partners (
  id TEXT PRIMARY KEY,
  libelle TEXT NOT NULL,
  type TEXT,
  niveau TEXT,
  superviseur TEXT,
  contacts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Characteristics Tables
CREATE TABLE IF NOT EXISTS public.activity_characteristics (
  id TEXT PRIMARY KEY DEFAULT 'default',
  types JSONB DEFAULT '[]'::jsonb,
  pmds JSONB DEFAULT '[]'::jsonb,
  plan_vpd JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partner_characteristics (
  id TEXT PRIMARY KEY DEFAULT 'default',
  types JSONB DEFAULT '[]'::jsonb,
  niveaux JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Activities Table
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  libelle TEXT NOT NULL,
  type TEXT,
  pmds TEXT,
  plan_vpd TEXT,
  deadline DATE,
  partenaires JSONB DEFAULT '[]'::jsonb,
  responsables TEXT,
  urgent TEXT DEFAULT 'Non',
  etapes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) & Policies for Anonymous/Public Access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_characteristics ENABLE ROW LEVEL SECURITY;

-- RLS Policies allowing SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Allow public full access users" ON public.users;
DROP POLICY IF EXISTS "Allow public full access partners" ON public.partners;
DROP POLICY IF EXISTS "Allow public full access activities" ON public.activities;
DROP POLICY IF EXISTS "Allow public full access act_chars" ON public.activity_characteristics;
DROP POLICY IF EXISTS "Allow public full access part_chars" ON public.partner_characteristics;

CREATE POLICY "Allow public full access users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access partners" ON public.partners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access act_chars" ON public.activity_characteristics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access part_chars" ON public.partner_characteristics FOR ALL USING (true) WITH CHECK (true);

-- 6. Enable Realtime Replication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_characteristics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_characteristics;
