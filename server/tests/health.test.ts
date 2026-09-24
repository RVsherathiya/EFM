import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app/app.js';

describe('API Foundation & Health Check', () => {
  const app = createApp();

  it('GET /api/v1/health should return 200 with standard API response format', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.service).toBe('EFM Backend API');
  });

  it('GET /api/v1/unknown-endpoint should return 404 with standard error format', async () => {
    const res = await request(app).get('/api/v1/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
