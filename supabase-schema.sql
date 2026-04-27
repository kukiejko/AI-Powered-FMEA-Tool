-- ============================================================================
-- FMEA Tool Supabase Schema
-- Run this SQL in your Supabase SQL Editor
-- ============================================================================

-- 1. CREATE PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username varchar(50) UNIQUE NOT NULL,
  full_name varchar(255),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREATE PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id varchar(50) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  mode varchar(20) DEFAULT 'simple',
  description text,
  fmea_id varchar(255),
  company varchar(255),
  location varchar(255),
  customer varchar(255),
  program varchar(255),
  owner varchar(255),
  confidentiality varchar(255),
  team varchar(255),
  hidden_cols jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE FMEA_ROWS TABLE
CREATE TABLE IF NOT EXISTS public.fmea_rows (
  id varchar(50) PRIMARY KEY,
  project_id varchar(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step varchar(255),
  failure_mode text,
  effect text,
  cause text,
  sev integer CHECK (sev >= 1 AND sev <= 10),
  occ integer CHECK (occ >= 1 AND occ <= 10),
  det integer CHECK (det >= 1 AND det <= 10),
  action text,
  owner varchar(255),
  due_date date,
  pct_complete integer CHECK (pct_complete >= 0 AND pct_complete <= 100),
  curr_pc varchar(255),
  curr_dc varchar(255),
  prev_action text,
  det_action text,
  action_status varchar(50),
  rsev integer,
  rocc integer,
  rdet integer,
  source_file varchar(255),
  source_page varchar(255),
  comment text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS public.incidents (
  id varchar(50) PRIMARY KEY,
  project_id varchar(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  num integer,
  timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  description text,
  fmea_row_id varchar(50) REFERENCES public.fmea_rows(id) ON DELETE SET NULL,
  file_name varchar(255),
  file_data bytea,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- 5. CREATE API_KEYS TABLE
CREATE TABLE IF NOT EXISTS public.api_keys (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider varchar(50) NOT NULL,
  api_key_encrypted varchar(500),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

-- 6. CREATE PROVIDER_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.provider_settings (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider varchar(50) NOT NULL,
  setting_name varchar(100) NOT NULL,
  setting_value varchar(255),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider, setting_name)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fmea_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PROJECTS RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FMEA_ROWS RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own fmea rows"
  ON public.fmea_rows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fmea rows"
  ON public.fmea_rows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fmea rows"
  ON public.fmea_rows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fmea rows"
  ON public.fmea_rows FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- INCIDENTS RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own incidents"
  ON public.incidents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incidents"
  ON public.incidents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own incidents"
  ON public.incidents FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- API_KEYS RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own api keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROVIDER_SETTINGS RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own provider settings"
  ON public.provider_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own provider settings"
  ON public.provider_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own provider settings"
  ON public.provider_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own provider settings"
  ON public.provider_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES (for performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_fmea_rows_project_id ON public.fmea_rows(project_id);
CREATE INDEX IF NOT EXISTS idx_fmea_rows_user_id ON public.fmea_rows(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_project_id ON public.incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON public.incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_settings_user_id ON public.provider_settings(user_id);

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- All tables, RLS policies, and indexes have been created.
-- The app will now use Supabase for authentication and storage.
