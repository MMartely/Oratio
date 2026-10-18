import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `--mode preview` produit un seul fichier HTML autonome (aperçu partageable),
// le mode normal produit la PWA installable.
export default defineConfig(({ mode }) => ({
  // Chemins relatifs : l'application fonctionne à la racine d'un domaine comme dans un sous-dossier (GitHub Pages).
  base: './',
  plugins: [
    react(),
    mode === 'preview'
      ? viteSingleFile()
      : VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icon.svg'],
          manifest: {
            name: 'Oratio — Prise de parole en public',
            short_name: 'Oratio',
            description: 'Vaincre le trac et parler avec confiance, avec un coach IA.',
            theme_color: '#8B7FD1',
            background_color: '#FBF8F4',
            display: 'standalone',
            orientation: 'portrait',
            start_url: '.',
            scope: '.',
            icons: [
              { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
            ],
          },
        }),
  ],
  build: { outDir: mode === 'preview' ? 'dist-preview' : 'dist' },
}));
