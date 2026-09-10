/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute base URL used to build canonical/OG links. */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * hls.js ships types for its full build only. The light build has the same
 * API minus alternate audio and subtitle handling, neither of which this
 * player uses, so it borrows the full build's declarations.
 */
declare module "hls.js/light" {
  export * from "hls.js";
  export { default } from "hls.js";
}
