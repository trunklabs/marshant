import {
  evaluateFlag,
  type Actor,
  type EvaluationResult,
  type FlagEnvironmentConfig,
  type Gate,
  type FlagValueType,
  type FlagValueTypeMap,
} from '@marshant/core';

export type ClientOptions = {
  apiKey: string;
  projectKey: string;
  environmentKey: string;
  baseUrl?: string;
  /**
   * Interval in milliseconds to refresh flag configs.
   * Set to 0 to disable polling (useful for serverless).
   * @default 15000 (15 seconds)
   */
  refreshInterval?: number;
};

type FlagConfig = {
  key: string;
  valueType: FlagValueType;
  enabled: boolean;
  defaultValue: FlagValueTypeMap[FlagValueType];
  gates: Gate[];
};

type GetConfigsResponse = {
  flags: FlagConfig[];
};

/**
 * The Marshant SDK client interface.
 */
export type Client = {
  /**
   * Evaluates a feature flag for a given actor.
   * @param flagKey - The key of the flag to evaluate
   * @param actor - The actor to evaluate the flag for
   * @returns The evaluation result containing enabled status, value, and reason
   */
  evaluateFlag(flagKey: string, actor: Actor): EvaluationResult;

  /**
   * Checks if a feature flag is enabled for a given actor.
   * @param flagKey - The key of the flag to check
   * @param actor - The actor to check the flag for
   * @returns true if the flag is enabled, false otherwise
   */
  isEnabled(flagKey: string, actor: Actor): boolean;

  /**
   * Gets the value of a feature flag for a given actor.
   * @param flagKey - The key of the flag to get the value for
   * @param actor - The actor to get the flag value for
   * @param defaultValue - The default value to return if the flag is not found
   * @returns The flag value or the default value
   */
  getValue<T>(flagKey: string, actor: Actor, defaultValue: T): T;

  /**
   * Stops the background polling for flag config updates.
   * Call this when you're done using the client to clean up resources.
   */
  close(): void;
};

/**
 * Error thrown when the client fails to initialize.
 */
export class InitializationError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'InitializationError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

const DEFAULT_BASE_URL = 'http://localhost:3000';
const DEFAULT_REFRESH_INTERVAL = 15000;

/**
 * Creates a new Marshant SDK client.
 *
 * The client fetches all flag configurations on initialization and evaluates
 * flags locally for fast, synchronous access. Background polling keeps the
 * configs up to date.
 *
 * @example
 * ```ts
 * import { createClient } from '@marshant/sdk';
 *
 * const client = await createClient({
 *   apiKey: 'mc_xxx',
 *   projectKey: 'my-project',
 *   environmentKey: 'production',
 *   baseUrl: 'https://your-app.example.com',
 * });
 *
 * // Synchronous flag evaluation
 * const enabled = client.isEnabled('new-feature', { id: 'user-123' });
 * const limit = client.getValue('rate-limit', { id: 'user-123' }, 100);
 *
 * // Clean up when done
 * client.close();
 * ```
 *
 * @example Serverless usage (no polling)
 * ```ts
 * const client = await createClient({
 *   apiKey: 'mc_xxx',
 *   projectKey: 'my-project',
 *   environmentKey: 'production',
 *   refreshInterval: 0, // disable polling
 * });
 *
 * const enabled = client.isEnabled('flag', { id: 'user-123' });
 * // No need to call close() - no background polling running
 * ```
 */
export async function createClient(options: ClientOptions): Promise<Client> {
  const {
    apiKey,
    projectKey,
    environmentKey,
    baseUrl = DEFAULT_BASE_URL,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
  } = options;

  if (!apiKey) {
    throw new Error('apiKey is required');
  }

  if (!projectKey) {
    throw new Error('projectKey is required');
  }

  if (!environmentKey) {
    throw new Error('environmentKey is required');
  }

  // Internal state
  let configs: Map<string, FlagConfig> = new Map();
  let pollingInterval: ReturnType<typeof setInterval> | null = null;

  async function fetchConfigs(): Promise<Map<string, FlagConfig>> {
    const url = new URL(`${baseUrl}/api/v1/configs`);
    url.searchParams.set('projectKey', projectKey);
    url.searchParams.set('environmentKey', environmentKey);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
      throw new InitializationError(
        data.error || 'Failed to fetch flag configs',
        data.code || 'FETCH_ERROR',
        response.status
      );
    }

    const data = (await response.json()) as GetConfigsResponse;
    const configMap = new Map<string, FlagConfig>();

    for (const flag of data.flags) {
      configMap.set(flag.key, flag);
    }

    return configMap;
  }

  async function refresh(): Promise<void> {
    try {
      configs = await fetchConfigs();
    } catch (error) {
      // Graceful degradation: keep using cached configs if refresh fails
      console.warn('[marshant-sdk] Failed to refresh flag configs, using cached values:', error);
    }
  }

  function toFlagEnvironmentConfig(config: FlagConfig): FlagEnvironmentConfig {
    return {
      id: '' as FlagEnvironmentConfig['id'],
      flagId: '' as FlagEnvironmentConfig['flagId'],
      environmentId: '' as FlagEnvironmentConfig['environmentId'],
      enabled: config.enabled,
      defaultValue: config.defaultValue,
      gates: config.gates,
    };
  }

  function doEvaluateFlag(flagKey: string, actor: Actor): EvaluationResult {
    if (!flagKey) {
      throw new Error('flagKey is required');
    }

    if (!actor || !actor.id) {
      throw new Error('actor with id is required');
    }

    const config = configs.get(flagKey);

    if (!config) {
      return {
        flagKey,
        value: false,
        enabled: false,
        reason: 'flag not found',
      };
    }

    return evaluateFlag(flagKey, toFlagEnvironmentConfig(config), actor);
  }

  function doIsEnabled(flagKey: string, actor: Actor): boolean {
    try {
      const result = doEvaluateFlag(flagKey, actor);
      return result.enabled;
    } catch {
      return false;
    }
  }

  function doGetValue<T>(flagKey: string, actor: Actor, defaultValue: T): T {
    try {
      const result = doEvaluateFlag(flagKey, actor);
      if (!result.enabled) {
        return defaultValue;
      }
      return result.value as T;
    } catch {
      return defaultValue;
    }
  }

  function close(): void {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  // Initial fetch (throws on failure)
  configs = await fetchConfigs();

  // Start polling if enabled
  if (refreshInterval > 0) {
    pollingInterval = setInterval(refresh, refreshInterval);
  }

  return {
    evaluateFlag: doEvaluateFlag,
    isEnabled: doIsEnabled,
    getValue: doGetValue,
    close,
  };
}

export type { Actor, EvaluationResult } from '@marshant/core';
