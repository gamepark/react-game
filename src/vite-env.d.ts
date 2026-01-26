/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Enable i18next debug logging.
   * Set to 'true' in your .env file to enable: VITE_I18N_DEBUG=true
   */
  readonly VITE_I18N_DEBUG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
