import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };
// The mark of this build: the page asks for the files of the day with it (src/engine/fresh.ts),
// and the publish workflow reads it from dist/.build to check upari.earth the same way.
const build = Date.now().toString(36);

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version), __BUILD__: JSON.stringify(build) },
  plugins: [{ name: 'build-mark', generateBundle() { this.emitFile({ type: 'asset', fileName: '.build', source: build }); } }],
  build: { target: 'es2022', chunkSizeWarningLimit: 1200, assetsInlineLimit: 0 },
  test: { include: ['src/**/*.test.ts'] },
});
