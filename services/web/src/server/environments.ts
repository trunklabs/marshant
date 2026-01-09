'use server';

import { EnvironmentService } from '@/lib/services/environment-service';
import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/server/auth-context';
import type { Environment } from '@marcurry/core';

export async function listEnvironmentsAction(projectId: string): Promise<Environment[]> {
  await getSessionContext();
  const environmentService = new EnvironmentService();
  return environmentService.listEnvironments(projectId);
}

export async function getEnvironmentAction(id: string): Promise<Environment> {
  await getSessionContext();
  const environmentService = new EnvironmentService();
  return environmentService.getEnvironment(id);
}

export async function getEnvironmentByKeyAction(projectId: string, key: string): Promise<Environment> {
  await getSessionContext();
  const environmentService = new EnvironmentService();
  return environmentService.getEnvironmentByKey(projectId, key);
}

export async function createEnvironmentAction(data: {
  projectId: string;
  name: string;
  key: string;
}): Promise<Environment> {
  await getSessionContext();
  const environmentService = new EnvironmentService();
  const environment = await environmentService.createEnvironment(data);
  revalidatePath('/app');
  revalidatePath('/app/projects');
  revalidatePath('/app/flags');
  return environment;
}

export async function updateEnvironmentAction(
  id: string,
  projectId: string,
  data: {
    name?: string;
    key?: string;
  }
): Promise<Environment> {
  await getSessionContext();
  const environmentService = new EnvironmentService();
  const environment = await environmentService.updateEnvironment(id, data);
  revalidatePath('/app');
  revalidatePath('/app/projects');
  revalidatePath('/app/flags');
  return environment;
}

export async function deleteEnvironmentAction(id: string): Promise<void> {
  await getSessionContext();
  const environmentService = new EnvironmentService();
  await environmentService.deleteEnvironment(id);
  revalidatePath('/app');
  revalidatePath('/app/projects');
  revalidatePath('/app/flags');
}
