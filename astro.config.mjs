import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  base: '/rce/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  outDir: 'dist'
});
