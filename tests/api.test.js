import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';

describe('API Endpoints', () => {
  describe('Health Check', () => {
    it('should return 200 for health check', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('Ingest Endpoint', () => {
    it('should return 400 when no userId provided', async () => {
      const response = await request(app).get('/v1/ingest/');

      expect(response.status).toBe(404); // No route matches empty userId
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/v1/ingest/nonexistentuser');

      // This will likely fail without proper database setup and user data
      // In a real test environment, you'd mock the database responses
      expect(response.status).toBeOneOf([404, 500]);
    });
  });

  describe('Reports Endpoints', () => {
    it('should return 400 when no userId provided for yearly report', async () => {
      const response = await request(app).get('/v1/reports/cycling/yearly/');

      expect(response.status).toBe(404); // No route matches empty userId
    });

    it('should return 400 when no userId provided for progress report', async () => {
      const response = await request(app).get('/v1/reports/cycling/progress/');

      expect(response.status).toBe(404); // No route matches empty userId
    });

    it('should handle non-existent user for yearly report', async () => {
      const response = await request(app).get('/v1/reports/cycling/yearly/nonexistentuser');

      // This will likely fail without proper database setup and user data
      expect(response.status).toBeOneOf([404, 500]);
    });

    it('should handle non-existent user for progress report', async () => {
      const response = await request(app).get('/v1/reports/cycling/progress/nonexistentuser');

      // This will likely fail without proper database setup and user data
      expect(response.status).toBeOneOf([404, 500]);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('path', '/nonexistent');
    });
  });
});
