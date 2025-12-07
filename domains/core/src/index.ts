export type {
  ActorId,
  ProjectId,
  EnvironmentId,
  FlagId,
  FlagEnvironmentConfigId,
  GateId,
} from './types/identifiers.ts';

export type {
  Project,
  Environment,
  Flag,
  FlagValueType,
  FlagValueTypeMap,
  FlagEnvironmentConfig,
} from './types/entities.js';

export type { Actor, GateType, BooleanGate, ActorsGate, Gate } from './types/value-objects.js';

export type { EvaluationContext, EvaluationResult } from './types/evaluation.js';

export { evaluateFlag } from './evaluation/evaluator.js';
export { matchesGate } from './evaluation/gate-matcher.js';

export { validateFlag, FlagValidationError } from './validation/flag-validator.js';
export { validateGates, GateValidationError } from './validation/gate-validator.js';
export { validateEnvironment, EnvironmentValidationError } from './validation/environment-validator.js';
export { KEY_REGEX, validateKey } from './validation/key-validator.js';

export {
  FlagNotFoundError,
  EnvironmentNotFoundError,
  ProjectNotFoundError,
  FlagEnvironmentConfigNotFoundError,
} from './errors/domain-errors.js';
