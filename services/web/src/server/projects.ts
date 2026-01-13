'use server';

import { ProjectService } from '@/lib/services/project-service';
import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/server/auth-context';
import type { Project } from '@marshant/core';
import { ProjectNotFoundError } from '@marshant/core';
import { createProjectSchema, updateProjectSchema } from '@/schemas/project-schemas';

export async function listProjectsAction(): Promise<Project[]> {
  const ctx = await getSessionContext();
  const projectService = new ProjectService();
  return projectService.listProjectsByOwner(ctx.ownerId, ctx.ownerType);
}

export async function getProjectAction(id: string): Promise<Project | null> {
  const ctx = await getSessionContext();
  const projectService = new ProjectService();
  try {
    return await projectService.getProject(id, ctx.ownerId, ctx.ownerType);
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return null;
    }
    throw error;
  }
}

export async function createProjectAction(data: unknown): Promise<Project> {
  const validated = createProjectSchema.parse(data);

  const ctx = await getSessionContext();
  const projectService = new ProjectService();
  const project = await projectService.createProject({
    ...validated,
    ownerId: ctx.ownerId,
    ownerType: ctx.ownerType,
    createdBy: ctx.userId,
  });
  revalidatePath('/app');
  revalidatePath('/app/projects');
  revalidatePath('/app/flags');
  return project;
}

export async function updateProjectAction(id: string, data: unknown): Promise<Project> {
  const validated = updateProjectSchema.parse(data);

  const ctx = await getSessionContext();
  const projectService = new ProjectService();
  const project = await projectService.updateProject(id, validated, ctx.ownerId, ctx.ownerType);
  revalidatePath('/app');
  revalidatePath('/app/projects');
  revalidatePath('/app/flags');
  return project;
}

export async function deleteProjectAction(id: string): Promise<void> {
  const ctx = await getSessionContext();
  const projectService = new ProjectService();
  await projectService.deleteProject(id, ctx.ownerId, ctx.ownerType);
  revalidatePath('/app');
  revalidatePath('/app/projects');
  revalidatePath('/app/flags');
}
