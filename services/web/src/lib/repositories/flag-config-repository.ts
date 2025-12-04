import { eq, and } from 'drizzle-orm';
import { db, flagEnvironmentConfigs, flags, environments, type FlagEnvironmentConfigRow } from '@/db';
import type {
  FlagEnvironmentConfig,
  FlagEnvironmentConfigId,
  FlagId,
  EnvironmentId,
  ProjectId,
  FlagValueType,
  FlagValueTypeMap,
  Gate,
} from '@marcurry/core';

export class FlagConfigRepository {
  async findById(id: FlagEnvironmentConfigId): Promise<FlagEnvironmentConfig | null> {
    const result = await db.query.flagEnvironmentConfigs.findFirst({
      where: eq(flagEnvironmentConfigs.id, id),
    });

    return result ? this.toDomain(result) : null;
  }

  async findByFlagAndEnvironment(flagId: FlagId, environmentId: EnvironmentId): Promise<FlagEnvironmentConfig | null> {
    const result = await db.query.flagEnvironmentConfigs.findFirst({
      where: and(eq(flagEnvironmentConfigs.flagId, flagId), eq(flagEnvironmentConfigs.environmentId, environmentId)),
    });

    return result ? this.toDomain(result) : null;
  }

  async findByKeys(
    projectId: ProjectId,
    environmentKey: string,
    flagKey: string
  ): Promise<FlagEnvironmentConfig | null> {
    const result = await db
      .select({
        config: flagEnvironmentConfigs,
      })
      .from(flagEnvironmentConfigs)
      .innerJoin(flags, eq(flagEnvironmentConfigs.flagId, flags.id))
      .innerJoin(environments, eq(flagEnvironmentConfigs.environmentId, environments.id))
      .where(and(eq(flags.projectId, projectId), eq(flags.key, flagKey), eq(environments.key, environmentKey)))
      .limit(1);

    return result[0] ? this.toDomain(result[0].config) : null;
  }

  async findByFlagId(flagId: FlagId): Promise<FlagEnvironmentConfig[]> {
    const results = await db.query.flagEnvironmentConfigs.findMany({
      where: eq(flagEnvironmentConfigs.flagId, flagId),
    });

    return results.map(this.toDomain);
  }

  async findByEnvironmentId(environmentId: EnvironmentId): Promise<FlagEnvironmentConfig[]> {
    const results = await db.query.flagEnvironmentConfigs.findMany({
      where: eq(flagEnvironmentConfigs.environmentId, environmentId),
    });

    return results.map(this.toDomain);
  }

  async create(data: Omit<FlagEnvironmentConfig, 'id'>): Promise<FlagEnvironmentConfig> {
    const [result] = await db
      .insert(flagEnvironmentConfigs)
      .values({
        flagId: data.flagId,
        environmentId: data.environmentId,
        enabled: data.enabled,
        defaultValue: data.defaultValue,
        gates: data.gates as Gate[],
      })
      .returning();

    return this.toDomain(result);
  }

  async update(
    id: FlagEnvironmentConfigId,
    data: Partial<Omit<FlagEnvironmentConfig, 'id' | 'flagId' | 'environmentId'>>
  ): Promise<FlagEnvironmentConfig> {
    const [result] = await db
      .update(flagEnvironmentConfigs)
      .set({
        ...data,
        gates: data.gates as Gate[] | undefined,
        updatedAt: new Date(),
      })
      .where(eq(flagEnvironmentConfigs.id, id))
      .returning();

    return this.toDomain(result);
  }

  async delete(id: FlagEnvironmentConfigId): Promise<void> {
    await db.delete(flagEnvironmentConfigs).where(eq(flagEnvironmentConfigs.id, id));
  }

  private toDomain(row: FlagEnvironmentConfigRow): FlagEnvironmentConfig {
    return {
      id: row.id,
      flagId: row.flagId,
      environmentId: row.environmentId,
      enabled: row.enabled,
      defaultValue: row.defaultValue as FlagValueTypeMap[FlagValueType],
      gates: (row.gates as Gate[]) || [],
    };
  }
}
