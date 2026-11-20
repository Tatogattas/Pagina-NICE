import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({command, isPreview}) => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'dual-dev-and-github-pages-root-sync',
        // In dev mode, serve app.html (live TSX entry) at "/" instead of the compiled root index.html
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const urlPath = req.url?.split('?')[0];
            if (urlPath === '/' || urlPath === '/index.html') {
              try {
                const template = fs.readFileSync(
                  path.resolve(rootDir, 'app.html'),
                  'utf-8'
                );
                const transformed = await server.transformIndexHtml(
                  req.url || '/',
                  template
                );
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end(transformed);
                return;
              } catch (err) {
                next(err);
                return;
              }
            }
            next();
          });
        },
        apply: undefined,
      },
      {
        name: 'github-pages-static-output',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(rootDir, 'dist');
          const srcAssets = path.resolve(rootDir, 'src/assets');
          const distSrcAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distSrcAssets, {recursive: true, force: true});
          }

          // Rename dist/app.html -> dist/index.html
          const distAppHtml = path.resolve(distDir, 'app.html');
          const distIndex = path.resolve(distDir, 'index.html');
          if (fs.existsSync(distAppHtml)) {
            fs.renameSync(distAppHtml, distIndex);
          }

          if (fs.existsSync(distIndex)) {
            const dist404 = path.resolve(distDir, '404.html');
            const distNojekyll = path.resolve(distDir, '.nojekyll');
            fs.copyFileSync(distIndex, dist404);
            fs.writeFileSync(distNojekyll, '');

            // Sync compiled static files (index.html, 404.html, .nojekyll, assets/)
            // to the repository root when building with relative './' paths so
            // GitHub Pages works out-of-the-box even with "Deploy from a branch (main / root)".
            const activeBase = process.env.VITE_BASE_PATH || './';
            if (activeBase === './') {
              fs.copyFileSync(distIndex, path.resolve(rootDir, 'index.html'));
              fs.copyFileSync(dist404, path.resolve(rootDir, '404.html'));
              fs.writeFileSync(path.resolve(rootDir, '.nojekyll'), '');

              const distAssetsDir = path.resolve(distDir, 'assets');
              const rootAssetsDir = path.resolve(rootDir, 'assets');
              if (fs.existsSync(distAssetsDir)) {
                fs.rmSync(rootAssetsDir, {recursive: true, force: true});
                fs.cpSync(distAssetsDir, rootAssetsDir, {
                  recursive: true,
                  force: true,
                });
              }

              for (const discoveryFile of [
                'robots.txt',
                'sitemap.xml',
                'llms.txt',
                'llms-full.txt',
              ]) {
                const srcFile = path.resolve(distDir, discoveryFile);
                if (fs.existsSync(srcFile)) {
                  fs.copyFileSync(srcFile, path.resolve(rootDir, discoveryFile));
                }
              }
            }
          }
        },
      },
    ],
    envPrefix: ['VITE_', 'GOOGLE_MAPS_'],
    base:
      command === 'serve' && !isPreview
        ? '/'
        : process.env.VITE_BASE_PATH || './',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(rootDir, 'app.html'),
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
