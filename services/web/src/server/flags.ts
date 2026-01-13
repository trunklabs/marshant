'use server';

import { FlagService } from '@/lib/services/flag-service';
import { revalidatePath } from 'next/cache';
import { getSessionContext } from '@/server/auth-context';
import type {
  Flag,
  FlagEnvironmentConfig,
  FlagValueType,
  FlagValueTypeMap,
  Gate,
  Actor,
  EvaluationResult,
} from '@marshant/core';

// ============================================================================
// Flag CRUD
// ============================================================================

export async function listFlagsAction(projectId: string): Promise<Flag[]> {
  await getSessionContext();
  const flagService = new FlagService();
  return flagService.listFlags(projectId);
}

export async function getFlagAction(id: string): Promise<Flag> {
  await getSessionContext();
  const flagService = new FlagService();
  return flagService.getFlag(id);
}

export async function getFlagByKeyAction(projectId: string, key: string): Promise<Flag> {
  await getSessionContext();
  const flagService = new FlagService();
  return flagService.getFlagByKey(projectId, key);
}

export async function createFlagAction(data: {
  projectId: string;
  key: string;
  name: string;
  valueType: FlagValueType;
  defaultValue: FlagValueTypeMap[FlagValueType];
}): Promise<Flag> {
  await getSessionContext();
  const flagService = new FlagService();
  const flag = await flagService.createFlag(data);
  revalidatePath('/app');
  revalidatePath('/app/projects');
  revalidatePath('/app/flags');
  return flag;
}

export async function updateFlagAction(
  id: string,
  projectId: string,
  data: {
    name?: string;
    defaultValue?: FlagValueTypeMap[FlagValueType];
  }
): Promise<Flag> {
  await getSessionContext();
  const flagService = new FlagService();
  const flag = await flagService.updateFlag(id, data);
  revalidatePath('/app');
  revalidatePath('/app/projects');
  revalidatePath('/app/flags');
  return flag;
}

export async function deleteFlagAction(id: string): Promise<void> {
  await getSessionContext();
  const flagService = new FlagService();
  await flagService.deleteFlag(id);
  revalidatePath('/app');
  revalidatePath('/app/projects');
  revalidatePath('/app/flags');
}

// ============================================================================
// Flag Environment Config CRUD
// ============================================================================

export async function listFlagConfigsAction(flagId: string): Promise<FlagEnvironmentConfig[]> {
  await getSessionContext();
  const flagService = new FlagService();
  return flagService.listFlagConfigs(flagId);
}

export async function getFlagConfigAction(flagId: string, environmentId: string): Promise<FlagEnvironmentConfig> {
  await getSessionContext();
  const flagService = new FlagService();
  return flagService.getFlagConfig(flagId, environmentId);
}

export async function getFlagConfigByKeysAction(
  projectId: string,
  environmentKey: string,
  flagKey: string
): Promise<FlagEnvironmentConfig> {
  await getSessionContext();
  const flagService = new FlagService();
  return flagService.getFlagConfigByKeys(projectId, environmentKey, flagKey);
}

export async function createFlagConfigAction(data: {
  flagId: string;
  environmentId: string;
  projectId: string;
  enabled: boolean;
  defaultValue: FlagValueTypeMap[FlagValueType];
  gates?: Gate[];
}): Promise<FlagEnvironmentConfig> {
  await getSessionContext();
  const flagService = new FlagService();
  const config = await flagService.createFlagConfig({
    flagId: data.flagId,
    environmentId: data.environmentId,
    enabled: data.enabled,
    defaultValue: data.defaultValue,
    gates: data.gates,
  });
  revalidatePath('/app');
  revalidatePath('/app/flags');
  return config;
}

export async function updateFlagConfigAction(
  configId: string,
  projectId: string,
  flagId: string,
  data: {
    enabled?: boolean;
    defaultValue?: FlagValueTypeMap[FlagValueType];
    gates?: Gate[];
  }
): Promise<FlagEnvironmentConfig> {
  await getSessionContext();
  const flagService = new FlagService();
  const config = await flagService.updateFlagConfig(configId, data);
  revalidatePath('/app');
  revalidatePath('/app/flags');
  return config;
}

export async function deleteFlagConfigAction(configId: string): Promise<void> {
  await getSessionContext();
  const flagService = new FlagService();
  await flagService.deleteFlagConfig(configId);
  revalidatePath('/app');
  revalidatePath('/app/flags');
}

// ============================================================================
// Gate Management
// ============================================================================

export async function addGateAction(
  configId: string,
  projectId: string,
  flagId: string,
  gate: Omit<Gate, 'id'>
): Promise<FlagEnvironmentConfig> {
  await getSessionContext();
  const flagService = new FlagService();

  const config = await flagService.getFlagConfig(
    flagId,
    (await flagService.listFlagConfigs(flagId)).find((c) => c.id === configId)!.environmentId
  );

  const newGate: Gate = {
    ...gate,
    id: crypto.randomUUID(),
  } as Gate;

  // Smart insertion: if adding a non-boolean gate and there's a boolean gate at the end,
  // insert the new gate before the boolean gate to maintain proper ordering
  const booleanGateIndex = config.gates.findIndex((g) => g.type === 'boolean');
  const hasBooleanGate = booleanGateIndex !== -1;
  const isAddingBooleanGate = newGate.type === 'boolean';

  let newGates: Gate[];
  if (!isAddingBooleanGate && hasBooleanGate) {
    // Insert before the boolean gate (which should be last)
    newGates = [...config.gates.slice(0, booleanGateIndex), newGate, ...config.gates.slice(booleanGateIndex)];
  } else {
    // Add to the end normally
    newGates = [...config.gates, newGate];
  }

  const updatedConfig = await flagService.updateFlagConfig(configId, {
    gates: newGates as Gate[],
  });

  revalidatePath('/app');
  revalidatePath('/app/flags');
  return updatedConfig;
}

export async function updateGateAction(
  configId: string,
  projectId: string,
  flagId: string,
  gateId: string,
  updates: Partial<Omit<Gate, 'id'>>
): Promise<FlagEnvironmentConfig> {
  await getSessionContext();
  const flagService = new FlagService();

  const config = await flagService.getFlagConfig(
    flagId,
    (await flagService.listFlagConfigs(flagId)).find((c) => c.id === configId)!.environmentId
  );

  const updatedGates: Gate[] = config.gates.map((gate) =>
    gate.id === gateId ? ({ ...gate, ...updates } as Gate) : gate
  );

  const updatedConfig = await flagService.updateFlagConfig(configId, {
    gates: updatedGates,
  });

  revalidatePath('/app');
  revalidatePath('/app/flags');
  return updatedConfig;
}

export async function deleteGateAction(
  configId: string,
  projectId: string,
  flagId: string,
  gateId: string
): Promise<FlagEnvironmentConfig> {
  await getSessionContext();
  const flagService = new FlagService();

  const config = await flagService.getFlagConfig(
    flagId,
    (await flagService.listFlagConfigs(flagId)).find((c) => c.id === configId)!.environmentId
  );

  const updatedGates: Gate[] = config.gates.filter((gate) => gate.id !== gateId);

  const updatedConfig = await flagService.updateFlagConfig(configId, {
    gates: updatedGates,
  });

  revalidatePath('/app');
  revalidatePath('/app/flags');
  return updatedConfig;
}

export async function reorderGatesAction(
  configId: string,
  projectId: string,
  flagId: string,
  gateIds: string[]
): Promise<FlagEnvironmentConfig> {
  await getSessionContext();
  const flagService = new FlagService();

  const config = await flagService.getFlagConfig(
    flagId,
    (await flagService.listFlagConfigs(flagId)).find((c) => c.id === configId)!.environmentId
  );

  const gateMap = new Map(config.gates.map((g) => [g.id, g]));
  const reorderedGates: Gate[] = gateIds.map((id) => gateMap.get(id)!).filter(Boolean);

  const updatedConfig = await flagService.updateFlagConfig(configId, {
    gates: reorderedGates,
  });

  revalidatePath('/app');
  revalidatePath('/app/flags');
  return updatedConfig;
}

// ============================================================================
// Evaluation
// ============================================================================

export async function evaluateFlagAction(
  projectId: string,
  environmentKey: string,
  flagKey: string,
  actor: Actor
): Promise<EvaluationResult> {
  await getSessionContext();
  const flagService = new FlagService();
  return flagService.evaluateFlag(projectId, environmentKey, flagKey, actor);
}
