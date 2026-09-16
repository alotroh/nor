import { defineConfig } from 'astro/config';

// https://astro.build
export default defineConfig({
  site: 'https://nor.example',
  server: { port: 4321, host: true },
  build: { inlineStylesheets: 'auto' },
});
