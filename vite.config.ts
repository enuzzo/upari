import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version), __BUILD__: JSON.stringify(Date.now().toString(36)) },
  build: { target: 'es2022', chunkSizeWarningLimit: 1200, assetsInlineLimit: 0 },
  test: { include: ['src/**/*.test.ts'] },
});
