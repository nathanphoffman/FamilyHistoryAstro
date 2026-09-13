// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // 'file' emits dist/trees/lorene_lewis.html rather than dist/trees/lorene_lewis/index.html
  build: { format: 'file' },
  // The chart is one Preact island (src/components/tree/Chart.tsx, which
  // renders BioPopup internally); it prefetches a box's .json on hover/focus
  // itself (useBioData's prefetchBioData), so Astro's own link-prefetch
  // feature isn't needed — the tree's boxes are real Preact onClick handlers,
  // not <a data-astro-prefetch> links Astro would warm for us.
  integrations: [preact()],
  // Tailwind v4 as a plain build-time Vite plugin — emits static CSS, no runtime.
  vite: { plugins: [tailwindcss()] },
});
