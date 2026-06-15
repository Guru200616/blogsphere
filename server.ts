import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db';
import apiRouter from './server/routes/api';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB Connection (loads real Mongo if present, or robust JSON fallback otherwise)
  await connectDB();

  // ==================================================
  // SECURITY MIDDLEWARE & HEADERS (Custom Helmet & CORS)
  // ==================================================
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Custom Security Headers (Helmet equivalents for iframe and security assurance)
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    
    // Custom CORS Rules
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Simple In-Memory Rate Limiter to protect endpoints
  const rateLimitMap = new Map<string, { count: number; lastTime: number }>();
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'anonymous';
    const now = Date.now();
    const timeframe = 60 * 1000; // 1 minute
    const maxRequests = 100; // 100 requests per minute

    const record = rateLimitMap.get(ip);
    if (!record) {
      rateLimitMap.set(ip, { count: 1, lastTime: now });
      next();
    } else {
      if (now - record.lastTime < timeframe) {
        if (record.count >= maxRequests) {
          res.status(429).json({ message: 'Too many requests. Please slow down.' });
          return;
        }
        record.count++;
        next();
      } else {
        rateLimitMap.set(ip, { count: 1, lastTime: now });
        next();
      }
    }
  });

  // ==================================================
  // MOUNT API ROUTER
  // ==================================================
  app.use('/api', apiRouter);

  // ==================================================
  // MOUNT VITE WEB PREVIEW
  // ==================================================
  if (process.env.NODE_ENV !== 'production') {
    console.log('Mounting Vite Web Server in Development Mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production-ready pre-compiled builds...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BlogSphere Ready] Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('CRITICAL: Server crashed during initialization:', err);
});
