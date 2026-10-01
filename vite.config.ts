import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const handleBrochureRequest = (req: any, res: any, next: any) => {
    try {
      const rawName = decodeURIComponent((req.url || '').split('?')[0].replace(/^\//, ''));
      if (!rawName) return next();
      const dir = path.resolve(__dirname, 'public/brochures');
      const candidates = [
        rawName,
        rawName.normalize('NFC'),
        rawName.normalize('NFD')
      ];
      let filePath = '';
      for (const c of candidates) {
        const p = path.join(dir, c);
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
          filePath = p;
          break;
        }
      }
      if (filePath) {
        const stat = fs.statSync(filePath);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(path.basename(filePath))}"`);
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    } catch (err) {
      console.error('Brochure serve error:', err);
    }
    next();
  };

  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'brochures-and-sheets-middleware',
        configureServer(server) {
          server.middlewares.use('/brochures', handleBrochureRequest);
          
          let inMemoryCsv = '';
          let lastFetchTime = 0;
          let isFetching = false;

          const refreshFromGoogle = async (force: boolean = false): Promise<string> => {
            const now = Date.now();
            if (!force && inMemoryCsv && (now - lastFetchTime < 3000)) {
              return inMemoryCsv;
            }
            if (isFetching && inMemoryCsv && !force) return inMemoryCsv;
            isFetching = true;
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 12000);
              const response = await fetch(
                `https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0&range=A1:Z10000&t=${Date.now()}`,
                {
                  signal: controller.signal,
                  headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                  }
                }
              );
              clearTimeout(timeoutId);
              if (response.ok) {
                const text = await response.text();
                if (text && (text.includes("ASESOR") || text.includes('"ASESOR"'))) {
                  inMemoryCsv = text;
                  lastFetchTime = Date.now();
                  return text;
                }
              }
            } catch (err) {
              console.warn('Google Sheets sync warning:', err);
            } finally {
              isFetching = false;
            }
            return inMemoryCsv;
          };

          server.middlewares.use('/api/sheets', async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            if (req.method === 'OPTIONS') {
              res.statusCode = 204;
              res.end();
              return;
            }

            const url = req.url || '';
            const force = url.includes('force=true');

            const fresh = await refreshFromGoogle(force);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.end(fresh || inMemoryCsv);
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use('/brochures', handleBrochureRequest);
          
          let inMemoryCsv = '';
          let lastFetchTime = 0;
          let isFetching = false;

          const refreshFromGoogle = async (force: boolean = false): Promise<string> => {
            const now = Date.now();
            if (!force && inMemoryCsv && (now - lastFetchTime < 3000)) {
              return inMemoryCsv;
            }
            if (isFetching && inMemoryCsv && !force) return inMemoryCsv;
            isFetching = true;
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 12000);
              const response = await fetch(
                `https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0&range=A1:Z10000&t=${Date.now()}`,
                {
                  signal: controller.signal,
                  headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                  }
                }
              );
              clearTimeout(timeoutId);
              if (response.ok) {
                const text = await response.text();
                if (text && (text.includes("ASESOR") || text.includes('"ASESOR"'))) {
                  inMemoryCsv = text;
                  lastFetchTime = Date.now();
                  return text;
                }
              }
            } catch (err) {
              console.warn('Google Sheets preview sync warning:', err);
            } finally {
              isFetching = false;
            }
            return inMemoryCsv;
          };

          server.middlewares.use('/api/sheets', async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            if (req.method === 'OPTIONS') {
              res.statusCode = 204;
              res.end();
              return;
            }

            const url = req.url || '';
            const force = url.includes('force=true');

            const fresh = await refreshFromGoogle(force);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.end(fresh || inMemoryCsv);
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
