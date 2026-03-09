/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** development | production */
  readonly VITE_APP_ENV: string;
  /** Backend base URL without /api/v1 e.g. http://localhost:5000 */
  readonly VITE_BACKEND_URL: string;
  /** Full API URL e.g. http://localhost:5000/api/v1 */
  readonly VITE_API_URL: string;
  /** Dev server port */
  readonly VITE_PORT: string;
  /** Enable debug console logs (true/false) */
  readonly VITE_ENABLE_DEBUG: string;
  /** App title for browser tab */
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
