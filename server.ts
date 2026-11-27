import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import healthHandler from './api/health.ts';
import trendsHandler from './api/trends.ts';
import channelHandler from './api/youtube/channel.ts';
import searchHandler from './api/youtube/search.ts';
import verifyVideoHandler from './api/youtube/verify-video.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes (identical signatures to Vercel serverless functions in /api)
  app.get('/api/health', (req, res) => healthHandler(req, res));
  app.get('/api/trends', (req, res) => trendsHandler(req, res));
  app.get('/api/youtube/channel', (req, res) => channelHandler(req, res));
  app.get('/api/youtube/search', (req, res) => searchHandler(req, res));
  app.get('/api/youtube/verify-video', (req, res) => verifyVideoHandler(req, res));
  app.post('/api/youtube/verify-video', (req, res) => verifyVideoHandler(req, res));

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CreatorBridge server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start CreatorBridge server:', err);
  process.exit(1);
});
