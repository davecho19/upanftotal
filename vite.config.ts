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
          server.middlewares.use('/api/sheets', async (req, res) => {
            try {
              const response = await fetch("https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0&range=A1:Z5000");
              const csvText = await response.text();
              res.setHeader('Content-Type', 'text/csv; charset=utf-8');
              res.end(csvText);
            } catch (e) {
              res.statusCode = 500;
              res.end("Error fetching sheets");
            }
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use('/brochures', handleBrochureRequest);
          server.middlewares.use('/api/sheets', async (req, res) => {
            try {
              const response = await fetch("https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0&range=A1:Z5000");
              const csvText = await response.text();
              res.setHeader('Content-Type', 'text/csv; charset=utf-8');
              res.end(csvText);
            } catch (e) {
              res.statusCode = 500;
              res.end("Error fetching sheets");
            }
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
