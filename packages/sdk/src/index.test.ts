import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient, EvaluationError } from './index.js';
import type { EvaluationResult } from '@marshant/core';

describe('createClient', () => {
  describe('validation', () => {
    it('throws when apiKey is missing', () => {
      expect(() =>
        createClient({
          apiKey: '',
          projectKey: 'project-123',
          environmentKey: 'production',
        })
      ).toThrow('apiKey is required');
    });

    it('throws when projectKey is missing', () => {
      expect(() =>
        createClient({
          apiKey: 'mc_test-key',
          projectKey: '',
          environmentKey: 'production',
        })
      ).toThrow('projectKey is required');
    });

    it('throws when environmentKey is missing', () => {
      expect(() =>
        createClient({
          apiKey: 'mc_test-key',
          projectKey: 'project-123',
          environmentKey: '',
        })
      ).toThrow('environmentKey is required');
    });

    it('creates client with valid options', () => {
      const client = createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
      });

      expect(client).toBeDefined();
      expect(client.evaluateFlag).toBeInstanceOf(Function);
      expect(client.isEnabled).toBeInstanceOf(Function);
      expect(client.getValue).toBeInstanceOf(Function);
    });

    it('uses default baseUrl when not provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ flagKey: 'test', enabled: true, value: true, reason: 'default' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
      });

      await client.evaluateFlag('test-flag', { id: 'user-123' });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/flags/evaluate', expect.any(Object));

      vi.unstubAllGlobals();
    });

    it('uses custom baseUrl when provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ flagKey: 'test', enabled: true, value: true, reason: 'default' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
        baseUrl: 'https://api.example.com',
      });

      await client.evaluateFlag('test-flag', { id: 'user-123' });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/api/v1/flags/evaluate', expect.any(Object));

      vi.unstubAllGlobals();
    });
  });
});

describe('evaluateFlag', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('validation', () => {
    it('throws when flagKey is missing', async () => {
      const client = createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
      });

      await expect(client.evaluateFlag('', { id: 'user-123' })).rejects.toThrow('flagKey is required');
    });

    it('throws when actor is missing', async () => {
      const client = createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
      });

      await expect(client.evaluateFlag('test-flag', null as any)).rejects.toThrow('actor with id is required');
    });

    it('throws when actor.id is missing', async () => {
      const client = createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
      });

      await expect(client.evaluateFlag('test-flag', { id: '' })).rejects.toThrow('actor with id is required');
    });

    it('throws when actor has no id property', async () => {
      const client = createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
      });

      await expect(client.evaluateFlag('test-flag', {} as any)).rejects.toThrow('actor with id is required');
    });
  });

  describe('API request', () => {
    it('sends correct request format', async () => {
      const mockResult: EvaluationResult = {
        flagKey: 'test-flag',
        enabled: true,
        value: 'variant-a',
        reason: 'gate matched',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      const client = createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'staging',
        baseUrl: 'https://api.test.com',
      });

      await client.evaluateFlag('test-flag', { id: 'user-456', attributes: { plan: 'premium' } });

      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/api/v1/flags/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'mc_test-key',
        },
        body: JSON.stringify({
          projectKey: 'project-123',
          environmentKey: 'staging',
          flagKey: 'test-flag',
          actor: { id: 'user-456', attributes: { plan: 'premium' } },
        }),
      });
    });

    it('returns evaluation result on success', async () => {
      const mockResult: EvaluationResult = {
        flagKey: 'feature-x',
        enabled: true,
        value: { variant: 'control' },
        reason: 'boolean gate',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      const client = createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
      });

      const result = await client.evaluateFlag('feature-x', { id: 'user-789' });

      expect(result).toEqual(mockResult);
    });
  });

  describe('error handling', () => {
    it('throws EvaluationError on API error with error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Flag not found', code: 'FLAG_NOT_FOUND' }),
      });

      const client = createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
      });

      await expect(client.evaluateFlag('unknown-flag', { id: 'user-123' })).rejects.toThrow(EvaluationError);

      try {
        await client.evaluateFlag('unknown-flag', { id: 'user-123' });
      } catch (error) {
        expect(error).toBeInstanceOf(EvaluationError);
        const evalError = error as EvaluationError;
        expect(evalError.message).toBe('Flag not found');
        expect(evalError.code).toBe('FLAG_NOT_FOUND');
        expect(evalError.statusCode).toBe(404);
      }
    });

    it('throws EvaluationError with defaults when API returns no error details', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      const client = createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
      });

      try {
        await client.evaluateFlag('test-flag', { id: 'user-123' });
      } catch (error) {
        expect(error).toBeInstanceOf(EvaluationError);
        const evalError = error as EvaluationError;
        expect(evalError.message).toBe('Flag evaluation failed');
        expect(evalError.code).toBe('UNKNOWN_ERROR');
        expect(evalError.statusCode).toBe(500);
      }
    });

    it('throws EvaluationError on 401 unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid API key', code: 'INVALID_API_KEY' }),
      });

      const client = createClient({
        apiKey: 'mc_invalid-key',
        projectKey: 'project-123',
        environmentKey: 'production',
      });

      try {
        await client.evaluateFlag('test-flag', { id: 'user-123' });
      } catch (error) {
        expect(error).toBeInstanceOf(EvaluationError);
        const evalError = error as EvaluationError;
        expect(evalError.message).toBe('Invalid API key');
        expect(evalError.code).toBe('INVALID_API_KEY');
        expect(evalError.statusCode).toBe(401);
      }
    });

    it('throws EvaluationError on 403 forbidden', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Environment not allowed', code: 'ENVIRONMENT_NOT_ALLOWED' }),
      });

      const client = createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'restricted-env',
      });

      try {
        await client.evaluateFlag('test-flag', { id: 'user-123' });
      } catch (error) {
        expect(error).toBeInstanceOf(EvaluationError);
        const evalError = error as EvaluationError;
        expect(evalError.message).toBe('Environment not allowed');
        expect(evalError.code).toBe('ENVIRONMENT_NOT_ALLOWED');
        expect(evalError.statusCode).toBe(403);
      }
    });
  });
});

describe('isEnabled', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when flag is enabled', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ flagKey: 'feature', enabled: true, value: true, reason: 'default' }),
    });

    const client = createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
    });

    const result = await client.isEnabled('feature', { id: 'user-123' });

    expect(result).toBe(true);
  });

  it('returns false when flag is disabled', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ flagKey: 'feature', enabled: false, value: false, reason: 'disabled' }),
    });

    const client = createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
    });

    const result = await client.isEnabled('feature', { id: 'user-123' });

    expect(result).toBe(false);
  });

  it('returns false on API error (graceful fallback)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal error', code: 'INTERNAL_ERROR' }),
    });

    const client = createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
    });

    const result = await client.isEnabled('feature', { id: 'user-123' });

    expect(result).toBe(false);
  });

  it('returns false on network error (graceful fallback)', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const client = createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
    });

    const result = await client.isEnabled('feature', { id: 'user-123' });

    expect(result).toBe(false);
  });

  it('returns false on flag not found (graceful fallback)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Flag not found', code: 'FLAG_NOT_FOUND' }),
    });

    const client = createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
    });

    const result = await client.isEnabled('nonexistent-flag', { id: 'user-123' });

    expect(result).toBe(false);
  });
});

describe('getValue', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns flag value on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ flagKey: 'rate-limit', enabled: true, value: 100, reason: 'default' }),
    });

    const client = createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
    });

    const result = await client.getValue('rate-limit', { id: 'user-123' }, 50);

    expect(result).toBe(100);
  });

  it('returns string value', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ flagKey: 'theme', enabled: true, value: 'dark', reason: 'default' }),
    });

    const client = createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
    });

    const result = await client.getValue('theme', { id: 'user-123' }, 'light');

    expect(result).toBe('dark');
  });

  it('returns object value', async () => {
    const configValue = { maxItems: 10, showBanner: true };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ flagKey: 'config', enabled: true, value: configValue, reason: 'default' }),
    });

    const client = createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
    });

    const result = await client.getValue('config', { id: 'user-123' }, { maxItems: 5, showBanner: false });

    expect(result).toEqual(configValue);
  });

  it('returns default value on API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal error', code: 'INTERNAL_ERROR' }),
    });

    const client = createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
    });

    const result = await client.getValue('rate-limit', { id: 'user-123' }, 50);

    expect(result).toBe(50);
  });

  it('returns default value on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const client = createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
    });

    const result = await client.getValue('rate-limit', { id: 'user-123' }, 50);

    expect(result).toBe(50);
  });

  it('returns default value on flag not found', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Flag not found', code: 'FLAG_NOT_FOUND' }),
    });

    const client = createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
    });

    const result = await client.getValue('nonexistent-flag', { id: 'user-123' }, 'default-value');

    expect(result).toBe('default-value');
  });
});

describe('EvaluationError', () => {
  it('has correct name property', () => {
    const error = new EvaluationError('Test error', 'TEST_CODE', 400);

    expect(error.name).toBe('EvaluationError');
  });

  it('has correct message property', () => {
    const error = new EvaluationError('Something went wrong', 'ERROR_CODE', 500);

    expect(error.message).toBe('Something went wrong');
  });

  it('has correct code property', () => {
    const error = new EvaluationError('Test error', 'CUSTOM_ERROR', 422);

    expect(error.code).toBe('CUSTOM_ERROR');
  });

  it('has correct statusCode property', () => {
    const error = new EvaluationError('Test error', 'TEST', 418);

    expect(error.statusCode).toBe(418);
  });

  it('is an instance of Error', () => {
    const error = new EvaluationError('Test error', 'TEST', 400);

    expect(error).toBeInstanceOf(Error);
  });

  it('is an instance of EvaluationError', () => {
    const error = new EvaluationError('Test error', 'TEST', 400);

    expect(error).toBeInstanceOf(EvaluationError);
  });
});
