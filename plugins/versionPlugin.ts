import { Plugin } from 'vite';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';

/**
 * Vite plugin that generates a version.json file in the build output.
 *
 * On every production build, it writes:
 *   dist/version.json → { "version": "<hash>", "buildTime": "<ISO timestamp>" }
 *
 * The frontend polls this file to detect new deployments and prompt users to refresh.
 */
export function versionPlugin(): Plugin {
  let outDir = 'dist';

  return {
    name: 'version-json',
    apply: 'build', // only runs during `npm run build`, not dev

    configResolved(config) {
      outDir = config.build.outDir || 'dist';
    },

    closeBundle() {
      const now = new Date().toISOString();
      const hash = createHash('md5').update(now + Math.random().toString()).digest('hex').slice(0, 12);

      const versionData = {
        version: hash,
        buildTime: now,
      };

      const filePath = resolve(outDir, 'version.json');
      writeFileSync(filePath, JSON.stringify(versionData, null, 2));
      console.log(`\n✅ version.json generated → v${hash} (${now})\n`);
    },
  };
}
