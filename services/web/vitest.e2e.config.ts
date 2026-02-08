import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: '@marshant/web-e2e',
    include: ['e2e/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@marshant/sdk': path.resolve(__dirname, '../../packages/sdk/dist/index.js'),
    },
  },
});
