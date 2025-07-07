import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import auth from 'auth-astro';
import vercel from '@astrojs/vercel';

import react from '@astrojs/react';

export default defineConfig({
  vite: { plugins: [tailwindcss()] },
  integrations: [auth(), react()],
  adapter: vercel(),
});