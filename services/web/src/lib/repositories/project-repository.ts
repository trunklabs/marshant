import { eq, desc, and, isNull } from 'drizzle-orm';
import { db, projects, projectOwners, type ProjectRow, type Transaction } from '@/db';
import type { Project, ProjectId } from '@marshant/core';

type ProjectWithKey = ProjectRow & { key: string };

export class ProjectRepository {
  async findById(id: ProjectId): Promise<Project | null> {
    const result = await db
      .select({
        id: projects.id,
        name: projects.name,
        key: projectOwners.key,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .innerJoin(projectOwners, eq(projects.id, projectOwners.projectId))
      .where(eq(projects.id, id))
      .limit(1);

    return result[0] ? this.toDomain(result[0]) : null;
  }

  async findAll(): Promise<Project[]> {
    const results = await db
      .select({
        id: projects.id,
        name: projects.name,
        key: projectOwners.key,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .innerJoin(projectOwners, eq(projects.id, projectOwners.projectId))
      .orderBy(desc(projects.createdAt));

    return results.map(this.toDomain);
  }

  async findByOwner(ownerId: string, ownerType: 'organization' | 'user'): Promise<Project[]> {
    const whereClause =
      ownerType === 'organization' ? eq(projectOwners.organizationId, ownerId) : eq(projectOwners.userId, ownerId);

    const results = await db
      .select({
        id: projects.id,
        name: projects.name,
        key: projectOwners.key,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .innerJoin(projectOwners, eq(projects.id, projectOwners.projectId))
      .where(whereClause)
      .orderBy(desc(projects.createdAt));

    return results.map(this.toDomain);
  }

  async findByKeyAndOwner(key: string, ownerId: string, ownerType: 'organization' | 'user'): Promise<Project | null> {
    const whereClause =
      ownerType === 'organization'
        ? and(eq(projectOwners.key, key), eq(projectOwners.organizationId, ownerId))
        : and(eq(projectOwners.key, key), eq(projectOwners.userId, ownerId), isNull(projectOwners.organizationId));

    const result = await db
      .select({
        id: projects.id,
        name: projects.name,
        key: projectOwners.key,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .innerJoin(projectOwners, eq(projects.id, projectOwners.projectId))
      .where(whereClause)
      .limit(1);

    return result[0] ? this.toDomain(result[0]) : null;
  }

  async create(data: Omit<Project, 'id'>, tx?: Transaction): Promise<Project> {
    const executor = tx ?? db;
    const [result] = await executor
      .insert(projects)
      .values({
        name: data.name,
      })
      .returning();

    return this.toDomain({ ...result, key: data.key });
  }

  async update(id: ProjectId, data: Partial<Omit<Project, 'id'>>): Promise<Project> {
    const { key, ...projectData } = data;
    const [result] = await db
      .update(projects)
      .set({
        ...projectData,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    const owner = await db.query.projectOwners.findFirst({
      where: eq(projectOwners.projectId, id),
    });

    return this.toDomain({ ...result, key: owner?.key ?? '' });
  }

  async delete(id: ProjectId): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  private toDomain(row: ProjectWithKey): Project {
    return {
      id: row.id,
      name: row.name,
      key: row.key,
    };
  }
}
