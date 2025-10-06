import { describe, it, expect, vi } from 'vitest';
import { corsMiddleware, requestLogger, errorHandler } from '../middleware.js';

// Simple mock objects
function createMockRequest(method = 'GET', url = '/'): any {
  return { method, url, headers: {} };
}

function createMockResponse(): any {
  return {
    setHeader: vi.fn(),
    writeHead: vi.fn(),
    end: vi.fn(),
    write: vi.fn(),
    headersSent: false,
    statusCode: 200,
    on: vi.fn((event, callback) => {
      if (event === 'finish') {
        // Simulate finish event immediately for testing
        setTimeout(callback, 0);
      }
    }),
  };
}

describe('Middleware Module', () => {
  describe('corsMiddleware', () => {
    it('should set CORS headers for regular requests', () => {
      const middleware = corsMiddleware();
      const req = createMockRequest('GET');
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      );
      expect(next).toHaveBeenCalled();
    });

    it('should handle OPTIONS requests', () => {
      const middleware = corsMiddleware();
      const req = createMockRequest('OPTIONS');
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.writeHead).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should use custom origin', () => {
      const middleware = corsMiddleware('https://example.com');
      const req = createMockRequest('GET');
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://example.com'
      );
    });
  });

  describe('requestLogger', () => {
    it('should log requests', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const middleware = requestLogger();
      const req = createMockRequest('GET', '/api/test');
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      // Wait for the finish event to be processed
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GET /api/test'));
      expect(next).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('errorHandler', () => {
    it('should intercept error status codes and set content type', () => {
      const middleware = errorHandler();
      const req = createMockRequest('GET');
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      // Simulate an error response
      res.writeHead(500);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(next).toHaveBeenCalled();
    });

    it('should not set content type for successful responses', () => {
      const middleware = errorHandler();
      const req = createMockRequest('GET');
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req, res, next);

      // Simulate a successful response
      res.writeHead(200);

      expect(res.setHeader).not.toHaveBeenCalledWith('Content-Type', 'application/json');
    });
  });
});
