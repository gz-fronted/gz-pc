import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@lishenchan/gz-pc/fetch': fileURLToPath(
        new URL('./src/fetch/index.ts', import.meta.url),
      ),
      '@lishenchan/gz-pc/hooks': fileURLToPath(
        new URL('./src/hooks/index.ts', import.meta.url),
      ),
      '@lishenchan/gz-pc/utils': fileURLToPath(
        new URL('./src/utils/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
    },
  },
});
