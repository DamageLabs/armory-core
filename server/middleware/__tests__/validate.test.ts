import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validate } from '../validate';

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  optional: z.string().optional(),
});

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.post('/test', validate(testSchema), (_req, res) => {
    res.json({ success: true, body: _req.body });
  });
  return app;
}

describe('validate middleware', () => {
  const app = createTestApp();

  it('passes valid body through to handler', async () => {
    const res = await request(app)
      .post('/test')
      .send({ name: 'Test', quantity: 5 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('applies defaults from schema', async () => {
    const res = await request(app)
      .post('/test')
      .send({ name: 'Test', quantity: 0 });
    expect(res.status).toBe(200);
    expect(res.body.body.name).toBe('Test');
  });

  it('returns 400 for missing required field', async () => {
    const res = await request(app)
      .post('/test')
      .send({ quantity: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
      ]),
    );
  });

  it('returns 400 for wrong type', async () => {
    const res = await request(app)
      .post('/test')
      .send({ name: 'Test', quantity: 'not-a-number' });
    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'quantity' }),
      ]),
    );
  });

  it('returns 400 for negative value', async () => {
    const res = await request(app)
      .post('/test')
      .send({ name: 'Test', quantity: -1 });
    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'quantity',
          message: 'Quantity cannot be negative',
        }),
      ]),
    );
  });

  it('returns multiple errors together', async () => {
    const res = await request(app)
      .post('/test')
      .send({ quantity: -1 });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThanOrEqual(2);
  });

  it('strips unknown fields', async () => {
    const res = await request(app)
      .post('/test')
      .send({ name: 'Test', quantity: 5, evil: 'payload' });
    expect(res.status).toBe(200);
    expect(res.body.body.evil).toBeUndefined();
  });
});
