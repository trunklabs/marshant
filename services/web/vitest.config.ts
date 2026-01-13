import { defineProject } from 'vitest/config';
import path from 'path';

export default defineProject({
  test: {
    name: '@marshant/web',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@/db': path.resolve(__dirname, './src/db/index.ts'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/utils': path.resolve(__dirname, './src/lib/utils'),
      '@/ui': path.resolve(__dirname, './src/components/ui'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
});
