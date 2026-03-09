import { Plugin } from 'vite';
/**
 * Vite plugin that generates a version.json file in the build output.
 *
 * On every production build, it writes:
 *   dist/version.json → { "version": "<hash>", "buildTime": "<ISO timestamp>" }
 *
 * The frontend polls this file to detect new deployments and prompt users to refresh.
 */
export declare function versionPlugin(): Plugin;
