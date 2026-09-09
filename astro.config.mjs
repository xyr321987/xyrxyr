// @ts-check
import { defineConfig } from 'astro/config';
import glsl from 'vite-plugin-glsl';

// https://astro.build/config
export default defineConfig({
  site: 'https://xyr321987.github.io',
  base: '/xyrxyr/',
  vite: {
    plugins: [glsl()],
  },
  devToolbar: {
    enabled: false,
  },
});