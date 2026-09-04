/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute base URL used to build canonical/OG links. */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
