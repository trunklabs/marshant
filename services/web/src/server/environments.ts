'use server';

import { EnvironmentService } from '@/lib/services/environment-service';
import { ProjectService } from '@/lib/services/project-service';
import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/server/auth-context';
import type { Environment } from '@marshant/core';
import { createEnvironmentSchema, updateEnvironmentSchema } from '@/schemas/environment-schemas';

/**
 * Verify the current user owns the project.
 * Throws ProjectAccessDeniedError if not.
 */
async function verifyProjectOwnership(projectId: string) {
  const ctx = await getSessionContext();
  const projectService = new ProjectService();
  await projectService.getProject(projectId, ctx.ownerId, ctx.ownerType);
}

export async function listEnvironmentsAction(projectId: string): Promise<Environment[]> {
  await verifyProjectOwnership(projectId);
  const environmentService = new EnvironmentService();
  return environmentService.listEnvironments(projectId);
}

export async function getEnvironmentAction(id: string): Promise<Environment> {
  await getSessionContext();
  const environmentService = new EnvironmentService();
  const environment = await environmentService.getEnvironment(id);
  await verifyProjectOwnership(environment.projectId);
  return environment;
}

export async function getEnvironmentByKeyAction(projectId: string, key: string): Promise<Environment> {
  await verifyProjectOwnership(projectId);
  const environmentService = new EnvironmentService();
  return environmentService.getEnvironmentByKey(projectId, key);
}

export async function createEnvironmentAction(data: unknown): Promise<Environment> {
  const validated = createEnvironmentSchema.parse(data);

  const projectId = (data as { projectId: string }).projectId;
  await verifyProjectOwnership(projectId);
  const environmentService = new EnvironmentService();
  const environment = await environmentService.createEnvironment({
    projectId,
    ...validated,
  });
  revalidatePath('/app');
  revalidatePath('/app/projects');
  revalidatePath('/app/flags');
  return environment;
}

export async function updateEnvironmentAction(id: string, projectId: string, data: unknown): Promise<Environment> {
  const validated = updateEnvironmentSchema.parse(data);

  await verifyProjectOwnership(projectId);
  const environmentService = new EnvironmentService();
  const environment = await environmentService.updateEnvironment(id, validated);
  revalidatePath('/app');
  revalidatePath('/app/projects');
  revalidatePath('/app/flags');
  return environment;
}

export async function deleteEnvironmentAction(id: string): Promise<void> {
  await getSessionContext();
  const environmentService = new EnvironmentService();
  const environment = await environmentService.getEnvironment(id);
  await verifyProjectOwnership(environment.projectId);
  await environmentService.deleteEnvironment(id);
  revalidatePath('/app');
  revalidatePath('/app/projects');
  revalidatePath('/app/flags');
}
