import { describe, test, expect, vi } from 'vitest';
import { corsMiddleware, jsonBodyParser, requestLogger, errorHandler } from '../middleware';
import { PassThrough } from 'stream';

describe('middleware', () => {
  test('corsMiddleware sets headers and handles OPTIONS', () => {
    const req: any = { method: 'OPTIONS' };
    const res: any = {
      headers: {},
      setHeader(k: string, v: string) {
        this.headers[k] = v;
      },
      writeHead(status: number) {
        this.statusCode = status;
      },
      end() {
        this.ended = true;
      },
    };

    const mw = corsMiddleware('https://example.com');
    const next = vi.fn();
    mw(req, res, next as any);

    expect(res.headers['Access-Control-Allow-Origin']).toBe('https://example.com');
    expect(res.ended).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });

  test('jsonBodyParser parses JSON and handles invalid JSON', async () => {
    // valid JSON
    const stream = new PassThrough();
    const req: any = stream;
    req.method = 'POST';
    const res: any = {
      writeHead: vi.fn(),
      end: vi.fn(),
    };

    const parser = jsonBodyParser();
    const next = vi.fn(async () => {});

    const p = parser(req, res, next as any);
    stream.end(JSON.stringify({ a: 1 }));
    await p;
    expect((req as any).body).toEqual({ a: 1 });

    // invalid JSON
    const badStream = new PassThrough();
    const badReq: any = badStream;
    badReq.method = 'POST';
    const badRes: any = { writeHead: vi.fn(), end: vi.fn() };
    const p2 = parser(badReq, badRes, next as any);
    badStream.end('{ invalid');
    await p2;
    expect((badRes.writeHead as any).mock.calls[0][0]).toBe(400);
  });

  test('requestLogger logs on finish', () => {
    const req: any = { method: 'GET', url: '/x' };
    const res: any = {
      on: (ev: string, fn: any) => {
        if (ev === 'finish') fn();
      },
      statusCode: 200,
    };
    const next = vi.fn();
    const mw = requestLogger();
    mw(req, res, next as any);
    expect(next).toHaveBeenCalled();
  });

  test('errorHandler decorates writeHead', () => {
    const req: any = {};
    const res: any = {
      headersSent: false,
      setHeader: vi.fn(),
      writeHead: function (s: number) {
        this._status = s;
      },
    };
    const next = vi.fn();
    const mw = errorHandler();
    mw(req, res, next as any);
    // calling overridden writeHead with 500 should set content-type
    (res.writeHead as any)(500);
    expect((res.setHeader as any).mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(next).toHaveBeenCalled();
  });
});
