import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

import { readSupabaseConfig } from './src/lib/services/supabase-config.ts';

export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/hu-web/' : '/',
  plugins: [react(), tailwindcss()],
  envPrefix: 'VITE_API_',
  define: {
    __HU_CHARACTER_LIFECYCLE__: JSON.stringify(
      mode !== 'github-pages' &&
        loadEnv(mode, process.cwd(), 'VITE_CHARACTER_')
          .VITE_CHARACTER_LIFECYCLE_ENABLED === 'true',
    ),
    __HU_STAFF_REVIEWS__: JSON.stringify(
      mode !== 'github-pages' &&
        loadEnv(mode, process.cwd(), 'VITE_STAFF_')
          .VITE_STAFF_REVIEWS_ENABLED === 'true',
    ),
    __HU_SUPABASE_CONFIG__: JSON.stringify(
      readSupabaseConfig(
        loadEnv(mode, process.cwd(), 'VITE_SUPABASE_'),
        mode === 'github-pages',
      ),
    ),
  },
  resolve: { tsconfigPaths: true },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
}));
