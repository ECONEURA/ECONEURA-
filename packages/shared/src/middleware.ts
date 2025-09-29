import { IncomingMessage, ServerResponse } from 'http';

// Middleware types
export type Middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

export type AsyncMiddleware = (req: IncomingMessage, res: ServerResponse, next: () => Promise<void>) => Promise<void>;

// CORS middleware
export function corsMiddleware(origin = '*'): Middleware {
  return (_req: IncomingMessage, res: ServerResponse, next: () => void) => {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (_req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    next();
  };
}

// JSON body parser middleware (simplified)
export function jsonBodyParser(): AsyncMiddleware {
  return async (req: IncomingMessage, res: ServerResponse, next: () => Promise<void>) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const chunks: Buffer[] = [];

      try {
        for await (const chunk of req) {
          chunks.push(chunk);
        }

        const body = Buffer.concat(chunks).toString();
        (req as any).body = body ? JSON.parse(body) : {};
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
    }

    await next();
  };
}

// Request logging middleware
export function requestLogger(): Middleware {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const start = Date.now();
    const { method, url } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${method} ${url} - ${res.statusCode} - ${duration}ms`);
    });

    next();
  };
}

// Error handling middleware (simplified)
export function errorHandler(): Middleware {
  return (_req: IncomingMessage, res: ServerResponse, next: () => void) => {
    // Simplified error handling - just log errors
    const originalWriteHead = res.writeHead;
    res.writeHead = function(statusCode: number) {
      if (statusCode >= 400 && !res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
      }
      return originalWriteHead.call(this, statusCode);
    };
    next();
  };
}