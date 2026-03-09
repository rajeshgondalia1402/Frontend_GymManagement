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
export function versionPlugin() {
    var outDir = 'dist';
    return {
        name: 'version-json',
        apply: 'build', // only runs during `npm run build`, not dev
        configResolved: function (config) {
            outDir = config.build.outDir || 'dist';
        },
        closeBundle: function () {
            var now = new Date().toISOString();
            var hash = createHash('md5').update(now + Math.random().toString()).digest('hex').slice(0, 12);
            var versionData = {
                version: hash,
                buildTime: now,
            };
            var filePath = resolve(outDir, 'version.json');
            writeFileSync(filePath, JSON.stringify(versionData, null, 2));
            console.log("\n\u2705 version.json generated \u2192 v".concat(hash, " (").concat(now, ")\n"));
        },
    };
}
