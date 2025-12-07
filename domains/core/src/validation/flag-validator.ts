import type { Flag } from '../types/entities.js';
import { validateKey } from './key-validator.js';

export class FlagValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FlagValidationError';
  }
}

const MAX_FLAG_NAME_LENGTH = 200;

/**
 * Validates flag properties.
 * Throws FlagValidationError if validation fails.
 */
export function validateFlag(flag: Partial<Flag>): void {
  validateKey(flag.key as string | undefined, 'Flag', FlagValidationError);

  if (!flag.name) {
    throw new FlagValidationError('Flag name is required');
  }

  if (flag.name.length > MAX_FLAG_NAME_LENGTH) {
    throw new FlagValidationError(`Flag name must be ${MAX_FLAG_NAME_LENGTH} characters or less`);
  }

  if (!flag.valueType) {
    throw new FlagValidationError('Flag value type is required');
  }

  if (flag.defaultValue === undefined || flag.defaultValue === null) {
    throw new FlagValidationError('Flag default value is required');
  }
}
