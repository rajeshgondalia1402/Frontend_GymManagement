/**
 * Centralized environment configuration
 *
 * All environment-dependent values should be read from here
 * instead of accessing import.meta.env directly in components.
 */

export const config = {
  /** Current environment: 'development' | 'production' */
  env: import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development',

  /** true when running in development mode */
  isDev: (import.meta.env.VITE_APP_ENV || import.meta.env.MODE) === 'development',

  /** true when running in production mode */
  isProd: (import.meta.env.VITE_APP_ENV || import.meta.env.MODE) === 'production',

  /** Backend server base URL (without /api/v1) — used for static files, images */
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',

  /** Full API base URL (with /api/v1 prefix) */
  apiUrl: import.meta.env.VITE_API_URL || `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/v1`,

  /** Dev server port */
  port: Number(import.meta.env.VITE_PORT) || 3005,

  /** Whether to enable debug console output */
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',

  /** App title */
  appTitle: import.meta.env.VITE_APP_TITLE || 'GymPro',
} as const;

export default config;
