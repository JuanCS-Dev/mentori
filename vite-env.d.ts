/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Google AI Studio (browser)
  readonly VITE_GEMINI_API_KEY?: string;

  // Vertex AI (optional - for server environments)
  readonly VITE_GOOGLE_CLOUD_PROJECT?: string;
  readonly VITE_GOOGLE_CLOUD_LOCATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
