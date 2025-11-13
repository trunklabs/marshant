/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export default {
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 120,
  plugins: [require.resolve('prettier-plugin-tailwindcss')],
};
