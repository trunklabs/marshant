import { EnvironmentRepository } from '@/lib/repositories/environment-repository';
import { ProjectRepository } from '../repositories/project-repository';
import {
  EnvironmentNotFoundError,
  ProjectNotFoundError,
  CannotDeleteLastEnvironmentError,
  validateEnvironment,
} from '@marcurry/core';
import type { Environment, EnvironmentId, ProjectId } from '@marcurry/core';

export class EnvironmentService {
  private environmentRepo: EnvironmentRepository;
  private projectRepo: ProjectRepository;

  constructor() {
    this.environmentRepo = new EnvironmentRepository();
    this.projectRepo = new ProjectRepository();
  }

  async getEnvironment(id: EnvironmentId): Promise<Environment> {
    const environment = await this.environmentRepo.findById(id);
    if (!environment) {
      throw new EnvironmentNotFoundError(id);
    }
    return environment;
  }

  async getEnvironmentByKey(projectId: ProjectId, key: string): Promise<Environment> {
    const environment = await this.environmentRepo.findByKey(projectId, key);
    if (!environment) {
      throw new EnvironmentNotFoundError(key);
    }
    return environment;
  }

  async listEnvironments(projectId: ProjectId): Promise<Environment[]> {
    return this.environmentRepo.findByProjectId(projectId);
  }

  async createEnvironment(data: { projectId: ProjectId; name: string; key: string }): Promise<Environment> {
    validateEnvironment(data);

    const project = await this.projectRepo.findById(data.projectId);
    if (!project) {
      throw new ProjectNotFoundError(data.projectId);
    }

    return this.environmentRepo.create(data);
  }

  /**
   * Updates an environment. Validates the merged result of existing data
   * with updates to ensure the final state is valid.
   * @throws {EnvironmentValidationError} When merged data has invalid key/name
   */
  async updateEnvironment(id: EnvironmentId, data: { name?: string; key?: string }): Promise<Environment> {
    const existing = await this.getEnvironment(id);
    const merged: Environment = { ...existing, ...data } as Environment;
    validateEnvironment(merged);
    return this.environmentRepo.update(id, data);
  }

  /**
   * Deletes an environment. A project must always have at least one environment,
   * so deleting the last environment is not allowed.
   * @throws {CannotDeleteLastEnvironmentError} When attempting to delete the only environment
   */
  async deleteEnvironment(id: EnvironmentId): Promise<void> {
    const environment = await this.getEnvironment(id);

    const allEnvs = await this.environmentRepo.findByProjectId(environment.projectId);
    if (allEnvs.length <= 1) {
      throw new CannotDeleteLastEnvironmentError(environment.projectId);
    }

    await this.environmentRepo.delete(id);
  }
}
