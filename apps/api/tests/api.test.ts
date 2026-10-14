import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('API Integration & Security Tests', () => {
  it('GET /api/health returns valid system status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.database).toHaveProperty('connected', true);
    expect(res.body.blockchain).toHaveProperty('mode');
  });

  it('POST /api/auth/login succeeds with valid seed credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@meditrace.internal',
        password: 'Admin@123456'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('role', 'ADMIN');
  });

  it('POST /api/auth/login rejects invalid passwords', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@meditrace.internal',
        password: 'WrongPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/batches denies unauthenticated access', async () => {
    const res = await request(app).get('/api/batches');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/products denies Pharmacist role (enforces role boundary)', async () => {
    // 1. Login as pharmacist
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'pharmacist@apollo-central.com',
        password: 'Pharm@123456'
      });

    const token = loginRes.body.token;

    // 2. Try to create product
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Unauthorized Drug',
        genericName: 'Sample',
        gtin: '00300010099999',
        dosageForm: 'Tablet',
        strength: '10mg',
        description: 'Test',
        minTempCelsius: 15,
        maxTempCelsius: 25,
        regulatoryApprovalId: 'TEST-123'
      });

    expect(createRes.status).toBe(403);
    expect(createRes.body.code).toBe('FORBIDDEN_ROLE');
  });
});
