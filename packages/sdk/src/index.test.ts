import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient, InitializationError } from './index.js';

const mockFlags = [
  {
    key: 'boolean-flag',
    valueType: 'boolean',
    enabled: true,
    defaultValue: false,
    gates: [{ id: 'gate-1', type: 'boolean', enabled: true, value: true }],
  },
  {
    key: 'disabled-flag',
    valueType: 'boolean',
    enabled: false,
    defaultValue: false,
    gates: [],
  },
  {
    key: 'number-flag',
    valueType: 'number',
    enabled: true,
    defaultValue: 50,
    gates: [{ id: 'gate-2', type: 'boolean', enabled: true, value: 100 }],
  },
  {
    key: 'string-flag',
    valueType: 'string',
    enabled: true,
    defaultValue: 'default',
    gates: [],
  },
  {
    key: 'actor-targeted-flag',
    valueType: 'boolean',
    enabled: true,
    defaultValue: false,
    gates: [{ id: 'gate-3', type: 'actors', enabled: true, actorIds: ['user-123', 'user-456'], value: true }],
  },
];

function createMockFetch(flags = mockFlags) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ flags }),
  });
}

describe('createClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = createMockFetch();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('validation', () => {
    it('throws when apiKey is missing', async () => {
      await expect(
        createClient({
          apiKey: '',
          projectKey: 'project-123',
          environmentKey: 'production',
        })
      ).rejects.toThrow('apiKey is required');
    });

    it('throws when projectKey is missing', async () => {
      await expect(
        createClient({
          apiKey: 'mc_test-key',
          projectKey: '',
          environmentKey: 'production',
        })
      ).rejects.toThrow('projectKey is required');
    });

    it('throws when environmentKey is missing', async () => {
      await expect(
        createClient({
          apiKey: 'mc_test-key',
          projectKey: 'project-123',
          environmentKey: '',
        })
      ).rejects.toThrow('environmentKey is required');
    });
  });

  describe('initialization', () => {
    it('fetches configs on creation', async () => {
      const client = await createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/configs?projectKey=project-123&environmentKey=production',
        expect.objectContaining({
          method: 'GET',
          headers: { 'X-API-Key': 'mc_test-key' },
        })
      );

      client.close();
    });

    it('uses custom baseUrl when provided', async () => {
      const client = await createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
        baseUrl: 'https://api.example.com',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/configs?projectKey=project-123&environmentKey=production',
        expect.any(Object)
      );

      client.close();
    });

    it('throws InitializationError when fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid API key', code: 'INVALID_API_KEY' }),
      });

      await expect(
        createClient({
          apiKey: 'mc_invalid-key',
          projectKey: 'project-123',
          environmentKey: 'production',
        })
      ).rejects.toThrow(InitializationError);

      try {
        await createClient({
          apiKey: 'mc_invalid-key',
          projectKey: 'project-123',
          environmentKey: 'production',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(InitializationError);
        const initError = error as InitializationError;
        expect(initError.message).toBe('Invalid API key');
        expect(initError.code).toBe('INVALID_API_KEY');
        expect(initError.statusCode).toBe(401);
      }
    });

    it('throws InitializationError on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        createClient({
          apiKey: 'mc_test-key',
          projectKey: 'project-123',
          environmentKey: 'production',
        })
      ).rejects.toThrow();
    });

    it('returns client with all methods', async () => {
      const client = await createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
      });

      expect(client.evaluateFlag).toBeInstanceOf(Function);
      expect(client.isEnabled).toBeInstanceOf(Function);
      expect(client.getValue).toBeInstanceOf(Function);
      expect(client.close).toBeInstanceOf(Function);

      client.close();
    });
  });

  describe('polling', () => {
    it('starts polling with default interval', async () => {
      vi.useFakeTimers();

      const client = await createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(15000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(15000);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      client.close();
    });

    it('uses custom refresh interval', async () => {
      vi.useFakeTimers();

      const client = await createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
        refreshInterval: 5000,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(5000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      client.close();
    });

    it('disables polling when refreshInterval is 0', async () => {
      vi.useFakeTimers();

      const client = await createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
        refreshInterval: 0,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(60000);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // No need to call close() but it shouldn't error
      client.close();
    });

    it('stops polling when close is called', async () => {
      vi.useFakeTimers();

      const client = await createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
        refreshInterval: 5000,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      client.close();

      await vi.advanceTimersByTimeAsync(10000);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('keeps cached configs when refresh fails', async () => {
      vi.useFakeTimers();
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const client = await createClient({
        apiKey: 'mc_test-key',
        projectKey: 'project-123',
        environmentKey: 'production',
        refreshInterval: 5000,
      });

      // First call succeeds
      expect(client.isEnabled('boolean-flag', { id: 'user-123' })).toBe(true);

      // Make subsequent fetches fail
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await vi.advanceTimersByTimeAsync(5000);

      // Should still work with cached configs
      expect(client.isEnabled('boolean-flag', { id: 'user-123' })).toBe(true);
      expect(consoleWarn).toHaveBeenCalled();

      client.close();
      consoleWarn.mockRestore();
    });
  });
});

describe('evaluateFlag', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = createMockFetch();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws when flagKey is missing', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    expect(() => client.evaluateFlag('', { id: 'user-123' })).toThrow('flagKey is required');
  });

  it('throws when actor is missing', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    expect(() => client.evaluateFlag('boolean-flag', null as any)).toThrow('actor with id is required');
  });

  it('throws when actor.id is missing', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    expect(() => client.evaluateFlag('boolean-flag', { id: '' })).toThrow('actor with id is required');
  });

  it('returns flag not found for unknown flags', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    const result = client.evaluateFlag('unknown-flag', { id: 'user-123' });

    expect(result.enabled).toBe(false);
    expect(result.reason).toBe('flag not found');
  });

  it('evaluates enabled flag with boolean gate', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    const result = client.evaluateFlag('boolean-flag', { id: 'user-123' });

    expect(result.flagKey).toBe('boolean-flag');
    expect(result.enabled).toBe(true);
    expect(result.value).toBe(true);
    expect(result.reason).toBe('gate matched');
  });

  it('evaluates disabled flag', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    const result = client.evaluateFlag('disabled-flag', { id: 'user-123' });

    expect(result.enabled).toBe(false);
    expect(result.reason).toBe('flag disabled');
  });

  it('evaluates flag with actor targeting - matching actor', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    const result = client.evaluateFlag('actor-targeted-flag', { id: 'user-123' });

    expect(result.enabled).toBe(true);
    expect(result.value).toBe(true);
    expect(result.reason).toBe('gate matched');
  });

  it('evaluates flag with actor targeting - non-matching actor', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    const result = client.evaluateFlag('actor-targeted-flag', { id: 'user-999' });

    expect(result.enabled).toBe(true);
    expect(result.value).toBe(false); // default value
    expect(result.reason).toBe('default value');
  });

  it('returns default value when no gates match', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    const result = client.evaluateFlag('string-flag', { id: 'user-123' });

    expect(result.enabled).toBe(true);
    expect(result.value).toBe('default');
    expect(result.reason).toBe('default value');
  });
});

describe('isEnabled', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = createMockFetch();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when flag is enabled', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    expect(client.isEnabled('boolean-flag', { id: 'user-123' })).toBe(true);
  });

  it('returns false when flag is disabled', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    expect(client.isEnabled('disabled-flag', { id: 'user-123' })).toBe(false);
  });

  it('returns false for unknown flags', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    expect(client.isEnabled('unknown-flag', { id: 'user-123' })).toBe(false);
  });

  it('returns false on validation error (graceful fallback)', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    expect(client.isEnabled('boolean-flag', null as any)).toBe(false);
  });
});

describe('getValue', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = createMockFetch();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns flag value when enabled', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    expect(client.getValue('number-flag', { id: 'user-123' }, 0)).toBe(100);
  });

  it('returns default value when flag is disabled', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    expect(client.getValue('disabled-flag', { id: 'user-123' }, true)).toBe(true);
  });

  it('returns default value for unknown flags', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    expect(client.getValue('unknown-flag', { id: 'user-123' }, 'fallback')).toBe('fallback');
  });

  it('returns default value on validation error', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    expect(client.getValue('number-flag', null as any, 42)).toBe(42);
  });

  it('returns string flag value', async () => {
    const client = await createClient({
      apiKey: 'mc_test-key',
      projectKey: 'project-123',
      environmentKey: 'production',
      refreshInterval: 0,
    });

    expect(client.getValue('string-flag', { id: 'user-123' }, 'fallback')).toBe('default');
  });
});

describe('InitializationError', () => {
  it('has correct name property', () => {
    const error = new InitializationError('Test error', 'TEST_CODE', 400);

    expect(error.name).toBe('InitializationError');
  });

  it('has correct message property', () => {
    const error = new InitializationError('Something went wrong', 'ERROR_CODE', 500);

    expect(error.message).toBe('Something went wrong');
  });

  it('has correct code property', () => {
    const error = new InitializationError('Test error', 'CUSTOM_ERROR', 422);

    expect(error.code).toBe('CUSTOM_ERROR');
  });

  it('has correct statusCode property', () => {
    const error = new InitializationError('Test error', 'TEST', 418);

    expect(error.statusCode).toBe(418);
  });

  it('is an instance of Error', () => {
    const error = new InitializationError('Test error', 'TEST', 400);

    expect(error).toBeInstanceOf(Error);
  });
});
