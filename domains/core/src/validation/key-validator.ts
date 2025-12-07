export const KEY_REGEX = /^[a-z0-9][a-z0-9-_]*[a-z0-9]$/;
export const MAX_KEY_LENGTH = 100;

/**
 * Validates a universally used key format and length.
 * Throws the provided Error class on failure.
 */
export function validateKey(
  key: string | undefined,
  entityLabel: string,
  ErrorClass: new (message: string) => Error
): void {
  if (!key) {
    throw new ErrorClass(`${entityLabel} key is required`);
  }

  if (key.length > MAX_KEY_LENGTH) {
    throw new ErrorClass(`${entityLabel} key must be ${MAX_KEY_LENGTH} characters or less`);
  }

  if (!KEY_REGEX.test(key)) {
    throw new ErrorClass(
      `${entityLabel} key must start and end with alphanumeric characters and contain only lowercase letters, numbers, hyphens, and underscores`
    );
  }
}
