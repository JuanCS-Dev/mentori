-- MENTORI OS - SUPABASE DATABASE SCHEMA
-- Version: 1.0 (Hybrid Cloud Sovereignty)

-- 1. QUESTIONS TABLE
-- Stores all contest questions
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  banca TEXT NOT NULL,
  concurso TEXT,
  ano INTEGER,
  cargo TEXT,
  numero INTEGER,
  disciplina TEXT NOT NULL,
  texto_id TEXT,
  texto_base TEXT,
  comando TEXT,
  enunciado TEXT NOT NULL,
  alternativas TEXT[] NOT NULL,
  gabarito INTEGER NOT NULL,
  tipo TEXT NOT NULL, -- 'certo_errado' or 'multipla_escolha'
  anulada BOOLEAN DEFAULT FALSE,
  explicacao JSONB, -- AI-generated content
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for questions (public read, admin write)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Questions" ON questions FOR SELECT USING (true);

-- 2. ATTEMPTS TABLE
-- Stores user answers for tracking and analytics
CREATE TABLE IF NOT EXISTS attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  question_id TEXT REFERENCES questions(id),
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  timestamp BIGINT NOT NULL,
  time_spent INTEGER, -- in seconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for attempts (user can only see/write their own)
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own attempts" ON attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own attempts" ON attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. PROFILES TABLE
-- Stores global user state (XP, Level, Elo, etc.)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) DEFAULT auth.uid(),
  username TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  overall_elo INTEGER DEFAULT 1000,
  discipline_stats JSONB DEFAULT '{}'::jsonb,
  streak_data JSONB DEFAULT '{}'::jsonb,
  badges TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPSERT WITH CHECK (auth.uid() = id);

-- 4. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_questions_banca ON questions(banca);
CREATE INDEX IF NOT EXISTS idx_questions_disciplina ON questions(disciplina);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_is_correct ON attempts(is_correct);
