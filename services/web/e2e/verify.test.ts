import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { randomUUID } from 'crypto';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@localhost:5433/test';

// ============================================================================
// HTTP Helpers
// ============================================================================

type CookieJar = string[];

async function post(path: string, body: Record<string, unknown>, cookies: CookieJar = []): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: BASE_URL,
      ...(cookies.length > 0 ? { Cookie: cookies.join('; ') } : {}),
    },
    body: JSON.stringify(body),
    redirect: 'manual',
  });
}

async function get(
  path: string,
  cookies: CookieJar = [],
  extraHeaders: Record<string, string> = {}
): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Origin: BASE_URL,
      ...(cookies.length > 0 ? { Cookie: cookies.join('; ') } : {}),
      ...extraHeaders,
    },
    redirect: 'manual',
  });
}

function extractCookies(response: Response): CookieJar {
  const setCookies = response.headers.getSetCookie?.() ?? [];
  return setCookies.map((c) => c.split(';')[0]);
}

async function configsEndpoint(apiKey: string, projectKey: string, envKey: string): Promise<Response> {
  return get(`/api/v1/configs?projectKey=${projectKey}&environmentKey=${envKey}`, [], {
    'X-API-Key': apiKey,
  });
}

// ============================================================================
// Auth Helpers
// ============================================================================

async function signUp(name: string, email: string, password: string): Promise<CookieJar> {
  const res = await post('/api/auth/sign-up/email', { name, email, password });
  expect(res.status).toBe(200);
  const cookies = extractCookies(res);
  expect(cookies.length).toBeGreaterThan(0);
  return cookies;
}

async function getSession(cookies: CookieJar): Promise<{ user: { id: string; name: string; email: string } }> {
  const res = await get('/api/auth/get-session', cookies);
  expect(res.status).toBe(200);
  return res.json() as Promise<{ user: { id: string; name: string; email: string } }>;
}

async function createApiKey(cookies: CookieJar, name: string): Promise<{ key: string; id: string }> {
  const res = await post('/api/auth/api-key/create', { name }, cookies);
  expect(res.status).toBe(200);
  const body = (await res.json()) as { key: string; id: string };
  expect(body.key).toBeTruthy();
  return body;
}

// ============================================================================
// DB Seeding
// ============================================================================

async function seedProjectWithFlags(
  pool: pg.Pool,
  userId: string,
  projectName: string,
  projectKey: string
): Promise<{ projectId: string; envId: string }> {
  const projectId = randomUUID();
  const envId = randomUUID();

  // Project + owner
  await pool.query('INSERT INTO projects (id, name) VALUES ($1, $2)', [projectId, projectName]);
  await pool.query(
    'INSERT INTO project_owners (id, user_id, project_id, key, created_by, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
    [randomUUID(), userId, projectId, projectKey, userId]
  );

  // Environment
  await pool.query('INSERT INTO environments (id, project_id, name, key) VALUES ($1, $2, $3, $4)', [
    envId,
    projectId,
    'Production',
    'production',
  ]);

  // Boolean flag with a boolean gate (value=true)
  const boolFlagId = randomUUID();
  await pool.query(
    'INSERT INTO flags (id, project_id, key, name, value_type, default_value) VALUES ($1, $2, $3, $4, $5, $6)',
    [boolFlagId, projectId, 'dark-mode', 'Dark Mode', 'boolean', JSON.stringify(false)]
  );
  await pool.query(
    'INSERT INTO flag_environment_configs (id, flag_id, environment_id, enabled, default_value, gates) VALUES ($1, $2, $3, $4, $5, $6)',
    [
      randomUUID(),
      boolFlagId,
      envId,
      true,
      JSON.stringify(false),
      JSON.stringify([{ id: randomUUID(), type: 'boolean', enabled: true, value: true }]),
    ]
  );

  // String flag with actor-targeted gate + boolean fallback gate
  const strFlagId = randomUUID();
  await pool.query(
    'INSERT INTO flags (id, project_id, key, name, value_type, default_value) VALUES ($1, $2, $3, $4, $5, $6)',
    [strFlagId, projectId, 'welcome-msg', 'Welcome Message', 'string', JSON.stringify('Hello')]
  );
  await pool.query(
    'INSERT INTO flag_environment_configs (id, flag_id, environment_id, enabled, default_value, gates) VALUES ($1, $2, $3, $4, $5, $6)',
    [
      randomUUID(),
      strFlagId,
      envId,
      true,
      JSON.stringify('Hello'),
      JSON.stringify([
        { id: randomUUID(), type: 'actors', enabled: true, value: 'VIP Welcome!', actorIds: ['user-vip-1'] },
        { id: randomUUID(), type: 'boolean', enabled: true, value: 'Hello World' },
      ]),
    ]
  );

  return { projectId, envId };
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Marshant E2E', () => {
  let pool: pg.Pool;
  const ts = Date.now();

  // Shared state across tests
  let userACookies: CookieJar;
  let userBCookies: CookieJar;
  let userAId: string;
  let userBId: string;
  let userAEmail: string;
  let apiKeyA: { key: string; id: string };
  let apiKeyB: { key: string; id: string };

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: DATABASE_URL });

    // Sign up two users
    userACookies = await signUp('User A', `usera-${ts}@test.local`, 'password123456');
    const sessionA = await getSession(userACookies);
    userAId = sessionA.user.id;
    userAEmail = sessionA.user.email;

    userBCookies = await signUp('User B', `userb-${ts}@test.local`, 'password123456');
    const sessionB = await getSession(userBCookies);
    userBId = sessionB.user.id;

    // Create API keys
    apiKeyA = await createApiKey(userACookies, 'e2e-key-a');
    apiKeyB = await createApiKey(userBCookies, 'e2e-key-b');

    // Seed projects
    await seedProjectWithFlags(pool, userAId, 'Project Alpha', `project-alpha-${ts}`);
    await seedProjectWithFlags(pool, userBId, 'Project Beta', `project-beta-${ts}`);
  });

  afterAll(async () => {
    await pool.end();
  });

  // --------------------------------------------------------------------------
  // Health
  // --------------------------------------------------------------------------

  describe('Health', () => {
    it('returns 200 with ok status', async () => {
      const res = await get('/api/health');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { status: string };
      expect(body.status).toBe('ok');
    });
  });

  // --------------------------------------------------------------------------
  // Auth
  // --------------------------------------------------------------------------

  describe('Auth', () => {
    it('can sign in to an existing account', async () => {
      const res = await post('/api/auth/sign-in/email', {
        email: userAEmail,
        password: 'password123456',
      });
      expect(res.status).toBe(200);
      expect(extractCookies(res).length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // API Validation
  // --------------------------------------------------------------------------

  describe('API Validation', () => {
    it('returns 401 without API key', async () => {
      const res = await get('/api/v1/configs?projectKey=test&environmentKey=dev');
      expect(res.status).toBe(401);
    });

    it('returns 401 with invalid API key', async () => {
      const res = await configsEndpoint('invalid-key', 'test', 'dev');
      expect(res.status).toBe(401);
    });

    it('returns 400 without projectKey', async () => {
      const res = await get('/api/v1/configs?environmentKey=dev', [], { 'X-API-Key': apiKeyA.key });
      expect(res.status).toBe(400);
    });

    it('returns 400 without environmentKey', async () => {
      const res = await get('/api/v1/configs?projectKey=test', [], { 'X-API-Key': apiKeyA.key });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent project', async () => {
      const res = await configsEndpoint(apiKeyA.key, 'non-existent', 'dev');
      expect(res.status).toBe(404);
    });
  });

  // --------------------------------------------------------------------------
  // Owner Access
  // --------------------------------------------------------------------------

  describe('Owner Access', () => {
    it('User A can access own project with correct flags', async () => {
      const res = await configsEndpoint(apiKeyA.key, `project-alpha-${ts}`, 'production');
      expect(res.status).toBe(200);

      const body = (await res.json()) as {
        flags: Array<{ key: string; enabled: boolean; gates: unknown[]; valueType: string }>;
      };
      expect(body.flags).toHaveLength(2);

      const darkMode = body.flags.find((f) => f.key === 'dark-mode');
      expect(darkMode).toBeDefined();
      expect(darkMode!.enabled).toBe(true);
      expect(darkMode!.valueType).toBe('boolean');
      expect(darkMode!.gates).toHaveLength(1);

      const welcomeMsg = body.flags.find((f) => f.key === 'welcome-msg');
      expect(welcomeMsg).toBeDefined();
      expect(welcomeMsg!.enabled).toBe(true);
      expect(welcomeMsg!.valueType).toBe('string');
      expect(welcomeMsg!.gates).toHaveLength(2);
    });

    it('User B can access own project', async () => {
      const res = await configsEndpoint(apiKeyB.key, `project-beta-${ts}`, 'production');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { flags: unknown[] };
      expect(body.flags).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------------
  // Cross-User Isolation
  // --------------------------------------------------------------------------

  describe('Cross-User Isolation', () => {
    it('User A cannot access User B project', async () => {
      const res = await configsEndpoint(apiKeyA.key, `project-beta-${ts}`, 'production');
      expect(res.status).toBe(404);
    });

    it('User B cannot access User A project', async () => {
      const res = await configsEndpoint(apiKeyB.key, `project-alpha-${ts}`, 'production');
      expect(res.status).toBe(404);
    });
  });

  // --------------------------------------------------------------------------
  // SDK Integration
  // --------------------------------------------------------------------------

  describe('SDK Integration', () => {
    it('evaluates boolean flag correctly', async () => {
      const { createClient } = await import('@marshant/sdk');
      const client = await createClient({
        apiKey: apiKeyA.key,
        projectKey: `project-alpha-${ts}`,
        environmentKey: 'production',
        baseUrl: BASE_URL,
        refreshInterval: 0,
      });

      const result = client.evaluateFlag('dark-mode', { id: 'any-user' });
      expect(result.enabled).toBe(true);
      expect(result.value).toBe(true);
      expect(client.isEnabled('dark-mode', { id: 'any-user' })).toBe(true);

      client.close();
    });

    it('evaluates actor-targeted string flag correctly', async () => {
      const { createClient } = await import('@marshant/sdk');
      const client = await createClient({
        apiKey: apiKeyA.key,
        projectKey: `project-alpha-${ts}`,
        environmentKey: 'production',
        baseUrl: BASE_URL,
        refreshInterval: 0,
      });

      // VIP user gets targeted value
      const vipResult = client.evaluateFlag('welcome-msg', { id: 'user-vip-1' });
      expect(vipResult.enabled).toBe(true);
      expect(vipResult.value).toBe('VIP Welcome!');

      // Regular user gets boolean gate fallback
      const regularResult = client.evaluateFlag('welcome-msg', { id: 'regular-user' });
      expect(regularResult.enabled).toBe(true);
      expect(regularResult.value).toBe('Hello World');

      client.close();
    });

    it('returns defaults for missing flags', async () => {
      const { createClient } = await import('@marshant/sdk');
      const client = await createClient({
        apiKey: apiKeyA.key,
        projectKey: `project-alpha-${ts}`,
        environmentKey: 'production',
        baseUrl: BASE_URL,
        refreshInterval: 0,
      });

      expect(client.getValue('non-existent', { id: 'user-1' }, 100)).toBe(100);
      expect(client.isEnabled('non-existent', { id: 'user-1' })).toBe(false);

      client.close();
    });

    it('throws when accessing another user project', async () => {
      const { createClient } = await import('@marshant/sdk');

      await expect(
        createClient({
          apiKey: apiKeyA.key,
          projectKey: `project-beta-${ts}`,
          environmentKey: 'production',
          baseUrl: BASE_URL,
          refreshInterval: 0,
        })
      ).rejects.toThrow();
    });
  });
});
