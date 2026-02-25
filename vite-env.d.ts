/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Nebius AI Token Factory
  readonly VITE_NEBIUS_API_KEY?: string;

  // Supabase
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
