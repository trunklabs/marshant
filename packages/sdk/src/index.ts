import type { Actor, EvaluationResult } from '@marshant/core';

export type ClientOptions = {
  apiKey: string;
  projectKey: string;
  environmentKey: string;
  baseUrl?: string;
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
  evaluateFlag(flagKey: string, actor: Actor): Promise<EvaluationResult>;

  /**
   * Checks if a feature flag is enabled for a given actor.
   * @param flagKey - The key of the flag to check
   * @param actor - The actor to check the flag for
   * @returns true if the flag is enabled, false otherwise
   */
  isEnabled(flagKey: string, actor: Actor): Promise<boolean>;

  /**
   * Gets the value of a feature flag for a given actor.
   * @param flagKey - The key of the flag to get the value for
   * @param actor - The actor to get the flag value for
   * @param defaultValue - The default value to return if evaluation fails
   * @returns The flag value or the default value
   */
  getValue<T>(flagKey: string, actor: Actor, defaultValue: T): Promise<T>;
};

/**
 * Error thrown when flag evaluation fails.
 */
export class EvaluationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = 'EvaluationError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

const DEFAULT_BASE_URL = 'http://localhost:3000';

/**
 * Creates a new Marshant SDK client.
 *
 * @example
 * ```ts
 * import { createClient } from '@marshant/sdk';
 *
 * const client = createClient({
 *   apiKey: 'marshant_pk_xxx',
 *   projectKey: 'my-project',
 *   environmentKey: 'production',
 *   baseUrl: 'https://your-app.example.com',
 * });
 *
 * const enabled = await client.isEnabled('new-feature', { id: 'user-123' });
 *
 * const result = await client.evaluateFlag('new-feature', { id: 'user-123' });
 *
 * const limit = await client.getValue('rate-limit', { id: 'user-123' }, 100);
 * ```
 */
export function createClient(options: ClientOptions): Client {
  const { apiKey, projectKey, environmentKey, baseUrl = DEFAULT_BASE_URL } = options;

  if (!apiKey) {
    throw new Error('apiKey is required');
  }

  if (!projectKey) {
    throw new Error('projectKey is required');
  }

  if (!environmentKey) {
    throw new Error('environmentKey is required');
  }

  async function evaluateFlag(flagKey: string, actor: Actor): Promise<EvaluationResult> {
    if (!flagKey) {
      throw new Error('flagKey is required');
    }

    if (!actor || !actor.id) {
      throw new Error('actor with id is required');
    }

    const response = await fetch(`${baseUrl}/api/v1/flags/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        projectKey,
        environmentKey,
        flagKey,
        actor,
      }),
    });

    const data = (await response.json()) as EvaluationResult | { error?: string; code?: string };

    if (!response.ok) {
      const errorData = data as { error?: string; code?: string };
      throw new EvaluationError(
        errorData.error || 'Flag evaluation failed',
        errorData.code || 'UNKNOWN_ERROR',
        response.status
      );
    }

    return data as EvaluationResult;
  }

  async function isEnabled(flagKey: string, actor: Actor): Promise<boolean> {
    try {
      const result = await evaluateFlag(flagKey, actor);
      return result.enabled;
    } catch {
      return false;
    }
  }

  async function getValue<T>(flagKey: string, actor: Actor, defaultValue: T): Promise<T> {
    try {
      const result = await evaluateFlag(flagKey, actor);
      return result.value as T;
    } catch {
      return defaultValue;
    }
  }

  return {
    evaluateFlag,
    isEnabled,
    getValue,
  };
}

export type { Actor, EvaluationResult } from '@marshant/core';
