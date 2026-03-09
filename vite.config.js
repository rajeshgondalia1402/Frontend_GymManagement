import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { versionPlugin } from './plugins/versionPlugin';
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, __dirname, 'VITE_');
    return {
        plugins: [
            react(),
            versionPlugin(), // generates dist/version.json on every build
        ],
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
            },
        },
        build: {
            // Content-hash in filenames ensures JS/CSS are never stale
            rollupOptions: {
                output: {
                    entryFileNames: 'assets/[name]-[hash].js',
                    chunkFileNames: 'assets/[name]-[hash].js',
                    assetFileNames: 'assets/[name]-[hash].[ext]',
                },
            },
        },
        server: {
            port: Number(env.VITE_PORT) || 3005,
            strictPort: true,
            proxy: {
                '/api': {
                    target: env.VITE_BACKEND_URL || 'http://localhost:5000',
                    changeOrigin: true,
                },
            },
        },
    };
});
