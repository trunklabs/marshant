import { eq } from 'drizzle-orm';
import { db, projects, type ProjectRow, type Transaction } from '@/db';
import type { Project, ProjectId } from '@marcurry/core';

export class ProjectRepository {
  async findById(id: ProjectId): Promise<Project | null> {
    const result = await db.query.projects.findFirst({
      where: eq(projects.id, id),
    });

    return result ? this.toDomain(result) : null;
  }

  async findAll(): Promise<Project[]> {
    const results = await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });

    return results.map(this.toDomain);
  }

  async create(data: Omit<Project, 'id'>, tx?: Transaction): Promise<Project> {
    const executor = tx ?? db;
    const [result] = await executor
      .insert(projects)
      .values({
        name: data.name,
      })
      .returning();

    return this.toDomain(result);
  }

  async update(id: ProjectId, data: Partial<Omit<Project, 'id'>>): Promise<Project> {
    const [result] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    return this.toDomain(result);
  }

  async delete(id: ProjectId): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  private toDomain(row: ProjectRow): Project {
    return {
      id: row.id,
      name: row.name,
    };
  }
}
