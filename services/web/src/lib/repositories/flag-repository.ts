import { eq, and } from 'drizzle-orm';
import { db, flags, type FlagRow } from '@/db';
import type { Flag, FlagId, ProjectId, FlagValueType, FlagValueTypeMap } from '@marshant/core';

export class FlagRepository {
  async findById(id: FlagId): Promise<Flag | null> {
    const result = await db.query.flags.findFirst({
      where: eq(flags.id, id),
    });

    return result ? this.toDomain(result) : null;
  }

  async findByKey(projectId: ProjectId, key: string): Promise<Flag | null> {
    const result = await db.query.flags.findFirst({
      where: and(eq(flags.projectId, projectId), eq(flags.key, key)),
    });

    return result ? this.toDomain(result) : null;
  }

  async findByProjectId(projectId: ProjectId): Promise<Flag[]> {
    const results = await db.query.flags.findMany({
      where: eq(flags.projectId, projectId),
      orderBy: (flags, { desc }) => [desc(flags.createdAt)],
    });

    return results.map(this.toDomain);
  }

  async create(data: Omit<Flag, 'id'>): Promise<Flag> {
    const [result] = await db
      .insert(flags)
      .values({
        projectId: data.projectId,
        key: data.key,
        name: data.name,
        valueType: data.valueType,
        defaultValue: data.defaultValue,
      })
      .returning();

    return this.toDomain(result);
  }

  async update(id: FlagId, data: Partial<Omit<Flag, 'id' | 'projectId'>>): Promise<Flag> {
    const [result] = await db
      .update(flags)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(flags.id, id))
      .returning();

    return this.toDomain(result);
  }

  async delete(id: FlagId): Promise<void> {
    await db.delete(flags).where(eq(flags.id, id));
  }

  private toDomain(row: FlagRow): Flag {
    return {
      id: row.id,
      projectId: row.projectId,
      key: row.key,
      name: row.name,
      valueType: row.valueType as FlagValueType,
      defaultValue: row.defaultValue as FlagValueTypeMap[FlagValueType],
    };
  }
}
