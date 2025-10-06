import { describe, it, expect } from 'vitest';
import { createApiResponse, createErrorResponse, type User, type ApiResponse } from './minimal';
import { fetchSafe, type FetchLike } from './utils/fetch-safe';

describe('shared smoke test', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should import shared modules', () => {
    // Basic smoke test - if this runs, imports work
    expect(true).toBe(true);
  });

  describe('minimal.ts', () => {
    it('should create API response', () => {
      const data = { id: 1, name: 'test' };
      const response = createApiResponse(data, 'Success');

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe('Success');
    });

    it('should create API response without message', () => {
      const data = { id: 1, name: 'test' };
      const response = createApiResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBeUndefined();
    });

    it('should create error response', () => {
      const message = 'Error occurred';
      const response = createErrorResponse(message);

      expect(response.success).toBe(false);
      expect(response.data).toBeNull();
      expect(response.message).toBe(message);
    });

    it('should validate User interface', () => {
      const user: User = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      expect(user.id).toBe('123');
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
    });

    it('should validate ApiResponse interface', () => {
      const response: ApiResponse<string> = {
        success: true,
        data: 'test data',
        message: 'optional message',
      };

      expect(response.success).toBe(true);
      expect(response.data).toBe('test data');
      expect(response.message).toBe('optional message');
    });
  });

  describe('utils/fetch-safe.ts', () => {
    it('should export fetchSafe function', () => {
      expect(typeof fetchSafe).toBe('function');
    });

    it('should export FetchLike type', () => {
      // Type test - if this compiles, the type is available
      const mockFetch: FetchLike = async () => new Response();
      expect(typeof mockFetch).toBe('function');
    });

    it('should call fetch with merged headers', async () => {
      const mockFetch: FetchLike = async (input, init) => {
        expect(init?.headers).toEqual({ 'custom-header': 'value' });
        return new Response('ok');
      };

      const result = await fetchSafe(mockFetch, 'http://example.com', {
        headers: { 'custom-header': 'value' },
      });

      expect(result.status).toBe(200);
    });

    it('should handle empty headers', async () => {
      const mockFetch: FetchLike = async (input, init) => {
        expect(init?.headers).toEqual({});
        return new Response('ok');
      };

      const result = await fetchSafe(mockFetch, 'http://example.com');
      expect(result.status).toBe(200);
    });
  });
});
