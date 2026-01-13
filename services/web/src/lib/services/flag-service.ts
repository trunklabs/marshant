import { FlagRepository } from '@/lib/repositories/flag-repository';
import { FlagConfigRepository } from '@/lib/repositories/flag-config-repository';
import { EnvironmentRepository } from '@/lib/repositories/environment-repository';
import { ProjectRepository } from '@/lib/repositories/project-repository';
import {
  validateFlag,
  validateGates,
  evaluateFlag,
  FlagNotFoundError,
  ProjectNotFoundError,
  EnvironmentNotFoundError,
  FlagEnvironmentConfigNotFoundError,
} from '@marshant/core';
import type {
  Flag,
  FlagId,
  ProjectId,
  EnvironmentId,
  FlagValueType,
  FlagValueTypeMap,
  FlagEnvironmentConfig,
  Gate,
  Actor,
  EvaluationResult,
} from '@marshant/core';

export class FlagService {
  private flagRepo: FlagRepository;
  private configRepo: FlagConfigRepository;
  private environmentRepo: EnvironmentRepository;
  private projectRepo: ProjectRepository;

  constructor() {
    this.flagRepo = new FlagRepository();
    this.configRepo = new FlagConfigRepository();
    this.environmentRepo = new EnvironmentRepository();
    this.projectRepo = new ProjectRepository();
  }

  async getFlag(id: FlagId): Promise<Flag> {
    const flag = await this.flagRepo.findById(id);
    if (!flag) {
      throw new FlagNotFoundError(id);
    }
    return flag;
  }

  async getFlagByKey(projectId: ProjectId, key: string): Promise<Flag> {
    const flag = await this.flagRepo.findByKey(projectId, key);
    if (!flag) {
      throw new FlagNotFoundError(key);
    }
    return flag;
  }

  async listFlags(projectId: ProjectId): Promise<Flag[]> {
    return this.flagRepo.findByProjectId(projectId);
  }

  async createFlag(data: {
    projectId: ProjectId;
    key: string;
    name: string;
    valueType: FlagValueType;
    defaultValue: FlagValueTypeMap[FlagValueType];
  }): Promise<Flag> {
    validateFlag(data);

    const project = await this.projectRepo.findById(data.projectId);
    if (!project) {
      throw new ProjectNotFoundError(data.projectId);
    }

    return this.flagRepo.create(data);
  }

  async updateFlag(
    id: FlagId,
    data: {
      name?: string;
      defaultValue?: FlagValueTypeMap[FlagValueType];
    }
  ): Promise<Flag> {
    await this.getFlag(id);
    return this.flagRepo.update(id, data);
  }

  async deleteFlag(id: FlagId): Promise<void> {
    await this.getFlag(id);
    await this.flagRepo.delete(id);
  }

  async getFlagConfig(flagId: FlagId, environmentId: EnvironmentId): Promise<FlagEnvironmentConfig> {
    const config = await this.configRepo.findByFlagAndEnvironment(flagId, environmentId);
    if (!config) {
      throw new FlagEnvironmentConfigNotFoundError(flagId, environmentId);
    }
    return config;
  }

  async getFlagConfigByKeys(
    projectId: ProjectId,
    environmentKey: string,
    flagKey: string
  ): Promise<FlagEnvironmentConfig> {
    const config = await this.configRepo.findByKeys(projectId, environmentKey, flagKey);
    if (!config) {
      throw new FlagEnvironmentConfigNotFoundError(flagKey, environmentKey);
    }
    return config;
  }

  async listFlagConfigs(flagId: FlagId): Promise<FlagEnvironmentConfig[]> {
    return this.configRepo.findByFlagId(flagId);
  }

  /**
   * Creates a flag configuration for a specific environment.
   * Each flag can have different settings (enabled, default value, gates)
   * per environment (e.g., enabled in staging but disabled in production).
   * @throws {GateValidationError} When gates array contains invalid gate configuration
   */
  async createFlagConfig(data: {
    flagId: FlagId;
    environmentId: EnvironmentId;
    enabled: boolean;
    defaultValue: FlagValueTypeMap[FlagValueType];
    gates?: Gate[];
  }): Promise<FlagEnvironmentConfig> {
    const flag = await this.flagRepo.findById(data.flagId);
    if (!flag) {
      throw new FlagNotFoundError(data.flagId);
    }

    const environment = await this.environmentRepo.findById(data.environmentId);
    if (!environment) {
      throw new EnvironmentNotFoundError(data.environmentId);
    }

    const gates = data.gates || [];
    validateGates(gates);

    return this.configRepo.create({
      flagId: data.flagId,
      environmentId: data.environmentId,
      enabled: data.enabled,
      defaultValue: data.defaultValue,
      gates,
    });
  }

  async updateFlagConfig(
    id: string,
    data: {
      enabled?: boolean;
      defaultValue?: FlagValueTypeMap[FlagValueType];
      gates?: Gate[];
    }
  ): Promise<FlagEnvironmentConfig> {
    const existing = await this.configRepo.findById(id);
    if (!existing) {
      throw new FlagEnvironmentConfigNotFoundError(id, '');
    }

    if (data.gates) {
      validateGates(data.gates);
    }

    return this.configRepo.update(id, data);
  }

  async deleteFlagConfig(id: string): Promise<void> {
    const existing = await this.configRepo.findById(id);
    if (!existing) {
      throw new FlagEnvironmentConfigNotFoundError(id, '');
    }
    await this.configRepo.delete(id);
  }

  /**
   * Evaluates a flag for a given actor in a specific environment.
   * Returns the flag's enabled state and resolved value based on
   * the flag's gates (targeting rules) and default value.
   */
  async evaluateFlag(
    projectId: ProjectId,
    environmentKey: string,
    flagKey: string,
    actor: Actor
  ): Promise<EvaluationResult> {
    const config = await this.getFlagConfigByKeys(projectId, environmentKey, flagKey);
    return evaluateFlag(flagKey, config, actor);
  }
}
