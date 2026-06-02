import 'dotenv/config';
import request from 'supertest';
import { sequelize, User } from '../../models/index';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';
import express from 'express';
import app from '../../index';

const TEST_EMAIL    = `test_wp04_${Date.now()}@sea-test.local`;
const TEST_USERNAME = `testuser_${Date.now()}`;
const TEST_PASSWORD = 'TestPw123!';

let token = '';

afterAll(async () => {
  await User.destroy({ where: { email: TEST_EMAIL } });
  await sequelize.close();
});

// ── Abnahmekriterium 1: Register → Login → /me ───────────────

describe('POST /api/auth/register', () => {
  it('legt Benutzer an und gibt Token zurück', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: TEST_USERNAME, email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    token = res.body.token;
  });

  it('doppelte E-Mail → 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'other', email: TEST_EMAIL, password: 'x' });

    expect(res.status).toBe(409);
  });

  it('fehlende Felder → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@x.de' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('gültige Credentials → 200 + Token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('falsches Passwort → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('unbekannte E-Mail → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@sea-test.local', password: 'x' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('gibt Profil ohne password_hash zurück', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_EMAIL);
    expect(res.body.password_hash).toBeUndefined();
    expect(res.body.role).toBe('trainee');
  });
});

// ── Abnahmekriterium 2: Ungültiger Token → 401 ───────────────

describe('Auth-Middleware — ungültiger Token', () => {
  it('kein Authorization-Header → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('gefälschter Token → 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.fake');
    expect(res.status).toBe(401);
  });
});

// ── Abnahmekriterium 3: Trainee auf Admin-Route → 403 ────────

describe('Admin-Middleware', () => {
  it('Trainee-Token → 403', async () => {
    const protectedApp = express();
    protectedApp.use(express.json());
    protectedApp.get('/admin-test', authMiddleware, adminMiddleware, (_req, res) => {
      res.json({ ok: true });
    });

    const res = await request(protectedApp)
      .get('/admin-test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('kein Token → 401 (nicht 403)', async () => {
    const protectedApp = express();
    protectedApp.use(express.json());
    protectedApp.get('/admin-test', authMiddleware, adminMiddleware, (_req, res) => {
      res.json({ ok: true });
    });

    const res = await request(protectedApp).get('/admin-test');
    expect(res.status).toBe(401);
  });
});
