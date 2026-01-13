import { eq, and } from 'drizzle-orm';
import { db, environments, type EnvironmentRow, type Transaction } from '@/db';
import type { Environment, EnvironmentId, ProjectId } from '@marshant/core';

export class EnvironmentRepository {
  async findById(id: EnvironmentId): Promise<Environment | null> {
    const result = await db.query.environments.findFirst({
      where: eq(environments.id, id),
    });

    return result ? this.toDomain(result) : null;
  }

  async findByKey(projectId: ProjectId, key: string): Promise<Environment | null> {
    const result = await db.query.environments.findFirst({
      where: and(eq(environments.projectId, projectId), eq(environments.key, key)),
    });

    return result ? this.toDomain(result) : null;
  }

  async findByProjectId(projectId: ProjectId): Promise<Environment[]> {
    const results = await db.query.environments.findMany({
      where: eq(environments.projectId, projectId),
      orderBy: (environments, { asc }) => [asc(environments.createdAt)],
    });

    return results.map(this.toDomain);
  }

  async create(data: Omit<Environment, 'id'>, tx?: Transaction): Promise<Environment> {
    const executor = tx ?? db;
    const [result] = await executor
      .insert(environments)
      .values({
        projectId: data.projectId,
        name: data.name,
        key: data.key,
      })
      .returning();

    return this.toDomain(result);
  }

  async update(id: EnvironmentId, data: Partial<Omit<Environment, 'id' | 'projectId'>>): Promise<Environment> {
    const [result] = await db
      .update(environments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(environments.id, id))
      .returning();

    return this.toDomain(result);
  }

  async delete(id: EnvironmentId): Promise<void> {
    await db.delete(environments).where(eq(environments.id, id));
  }

  private toDomain(row: EnvironmentRow): Environment {
    return {
      id: row.id,
      projectId: row.projectId,
      name: row.name,
      key: row.key,
    };
  }
}
