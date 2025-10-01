import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthChecker, healthChecker, createHealthCheck, databaseHealthCheck, redisHealthCheck } from '../health';

describe('HealthChecker', () => {
  let checker: HealthChecker;

  beforeEach(() => {
    checker = new HealthChecker();
  });

  describe('constructor', () => {
    it('should create a new HealthChecker instance', () => {
      expect(checker).toBeInstanceOf(HealthChecker);
    });
  });

  describe('registerService', () => {
    it('should register a service check', async () => {
      const mockCheck = vi.fn().mockResolvedValue(true);
      checker.registerService('test-service', mockCheck);

      const health = await checker.checkHealth();
      expect(health.services['test-service']).toEqual({
        status: 'up',
        responseTime: expect.any(Number)
      });
      expect(mockCheck).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkHealth', () => {
    it('should return healthy status when all services are up', async () => {
      checker.registerService('service1', async () => true);
      checker.registerService('service2', async () => true);

      const health = await checker.checkHealth();

      expect(health.status).toBe('healthy');
      expect(health.services.service1.status).toBe('up');
      expect(health.services.service2.status).toBe('up');
      expect(health.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(health.version).toBeDefined();
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy status when any service is down', async () => {
      checker.registerService('service1', async () => true);
      checker.registerService('service2', async () => false);

      const health = await checker.checkHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.services.service1.status).toBe('up');
      expect(health.services.service2.status).toBe('down');
    });

    it('should handle service check errors', async () => {
      checker.registerService('failing-service', async () => {
        throw new Error('Connection failed');
      });

      const health = await checker.checkHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.services['failing-service'].status).toBe('down');
      expect(health.services['failing-service'].error).toBe('Connection failed');
    });

    it('should measure response time', async () => {
      checker.registerService('slow-service', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return true;
      });

      const health = await checker.checkHealth();

      expect(health.services['slow-service'].responseTime).toBeGreaterThanOrEqual(10);
    });
  });

  describe('getUptime', () => {
    it('should return uptime in milliseconds', () => {
      const uptime = checker.getUptime();
      expect(uptime).toBeGreaterThanOrEqual(0);
      expect(typeof uptime).toBe('number');
    });
  });

  describe('helper functions', () => {
    describe('createHealthCheck', () => {
      it('should return the check function', () => {
        const check = async () => true;
        expect(createHealthCheck(check)).toBe(check);
      });
    });

    describe('databaseHealthCheck', () => {
      it('should return true for valid connection string', async () => {
        const result = await databaseHealthCheck('postgresql://user:pass@localhost:5432/db');
        expect(result).toBe(true);
      });

      it('should return false for empty connection string', async () => {
        const result = await databaseHealthCheck('');
        expect(result).toBe(false);
      });
    });

    describe('redisHealthCheck', () => {
      it('should return true for valid redis URL', async () => {
        const result = await redisHealthCheck('redis://localhost:6379');
        expect(result).toBe(true);
      });

      it('should return false for invalid redis URL', async () => {
        const result = await redisHealthCheck('invalid-url');
        expect(result).toBe(false);
      });
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton healthChecker instance', () => {
      expect(healthChecker).toBeInstanceOf(HealthChecker);
    });
  });
});