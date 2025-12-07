import type { Environment } from '../types/entities.js';
import { validateKey } from './key-validator.js';

export class EnvironmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

const MAX_ENVIRONMENT_NAME_LENGTH = 200;

/**
 * Validates environment properties.
 * Throws EnvironmentValidationError if validation fails.
 */
export function validateEnvironment(env: Partial<Environment>): void {
  validateKey(env.key as string | undefined, 'Environment', EnvironmentValidationError);

  if (!env.name) {
    throw new EnvironmentValidationError('Environment name is required');
  }

  if (env.name.length > MAX_ENVIRONMENT_NAME_LENGTH) {
    throw new EnvironmentValidationError(`Environment name must be ${MAX_ENVIRONMENT_NAME_LENGTH} characters or less`);
  }
}
