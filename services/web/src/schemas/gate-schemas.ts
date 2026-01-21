import { z } from 'zod';

const baseGateSchema = z.object({
  enabled: z.boolean(),
  value: z.string().min(1, 'Value is required'),
});

export const booleanGateSchema = baseGateSchema.extend({
  type: z.literal('boolean'),
});

export const actorsGateSchema = baseGateSchema.extend({
  type: z.literal('actors'),
  actorIds: z.array(z.string().min(1)).min(1, 'At least one actor ID is required'),
});

export const createGateSchema = z.discriminatedUnion('type', [booleanGateSchema, actorsGateSchema]);

export const updateBooleanGateSchema = z.object({
  type: z.literal('boolean'),
  value: z.string().min(1, 'Value is required'),
});

export const updateActorsGateSchema = z.object({
  type: z.literal('actors'),
  value: z.string().min(1, 'Value is required'),
  actorIds: z.array(z.string().min(1)).min(1, 'At least one actor ID is required'),
});

export const updateGateSchema = z.discriminatedUnion('type', [updateBooleanGateSchema, updateActorsGateSchema]);

export type CreateGateInput = z.infer<typeof createGateSchema>;
export type UpdateGateInput = z.infer<typeof updateGateSchema>;
