'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Pencil, X, Check } from 'lucide-react';
import type { Flag, Environment, FlagEnvironmentConfig, Gate, FlagValueType } from '@marshant/core';
import { validateGates, GateValidationError } from '@marshant/core';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Switch } from '@/ui/switch';
import { Textarea } from '@/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Label } from '@/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/ui/form';
import { parseErrorMessage } from '@/lib/utils';
import { ActorIdsInput } from '@/components/actor-ids-input';
import { createGateSchema, updateGateSchema, type CreateGateInput, type UpdateGateInput } from '@/schemas/gate-schemas';
import {
  addGateAction,
  updateGateAction,
  deleteGateAction,
  reorderGatesAction,
  getFlagConfigAction,
} from '@/server/flags';

interface GatesConfigDialogProps {
  flag: Flag;
  environment: Environment;
  config: FlagEnvironmentConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GatesConfigDialog({ flag, environment, config, open, onOpenChange }: GatesConfigDialogProps) {
  const router = useRouter();
  const [gates, setGates] = useState<Gate[]>(config.gates || []);
  const [loading, setLoading] = useState(false);
  const [isAddingGate, setIsAddingGate] = useState(false);
  const [editingGateId, setEditingGateId] = useState<string | null>(null);
  const [draggedGateId, setDraggedGateId] = useState<string | null>(null);
  const [dragOverGateId, setDragOverGateId] = useState<string | null>(null);

  // Helper function to get default value based on flag type
  const getDefaultValue = useCallback((): string => {
    switch (flag.valueType) {
      case 'boolean':
        return 'true';
      case 'string':
        return '';
      case 'number':
        return '0';
      case 'json':
        return '{}';
      default:
        return '';
    }
  }, [flag.valueType]);

  // Add gate form
  const addForm = useForm<CreateGateInput>({
    resolver: zodResolver(createGateSchema),
    mode: 'onTouched',
    defaultValues: {
      type: 'boolean',
      enabled: true,
      value: getDefaultValue(),
    },
  });

  const addGateType = addForm.watch('type');

  useEffect(() => {
    if (open) {
      setGates(config.gates || []);
      setIsAddingGate(false);
      setEditingGateId(null);
      addForm.reset({
        type: 'boolean',
        enabled: true,
        value: getDefaultValue(),
      });
    }
  }, [open, config.gates, addForm, getDefaultValue]);

  // Reload config from server after mutations
  const reloadConfig = useCallback(async () => {
    try {
      const updatedConfig = await getFlagConfigAction(flag.id, environment.id);
      setGates(updatedConfig.gates || []);
      router.refresh();
    } catch (error) {
      console.error('Failed to reload config:', error);
    }
  }, [flag.id, environment.id, router]);

  const parseValue = (valueStr: string, valueType: FlagValueType): string | boolean | number | object => {
    switch (valueType) {
      case 'boolean':
        return valueStr === 'true';
      case 'string':
        return valueStr;
      case 'number':
        const num = parseFloat(valueStr);
        if (isNaN(num)) throw new Error('Invalid number');
        return num;
      case 'json':
        return JSON.parse(valueStr);
      default:
        return valueStr;
    }
  };

  async function onAddGate(data: CreateGateInput) {
    setLoading(true);
    try {
      const parsedValue = parseValue(data.value, flag.valueType);

      const newGate =
        data.type === 'boolean'
          ? {
              type: 'boolean' as const,
              enabled: data.enabled,
              value: parsedValue,
            }
          : {
              type: 'actors' as const,
              enabled: data.enabled,
              actorIds: data.actorIds,
              value: parsedValue,
            };

      await addGateAction(config.id, flag.projectId, flag.id, newGate as Omit<Gate, 'id'>);

      const hasBooleanGateAtEnd = gates.length > 0 && gates[gates.length - 1].type === 'boolean';
      const isAddingBooleanGate = data.type === 'boolean';

      if (!isAddingBooleanGate && hasBooleanGateAtEnd) {
        toast.success('Gate added before boolean gate');
      } else {
        toast.success('Gate added successfully');
      }

      addForm.reset({
        type: 'boolean',
        enabled: true,
        value: getDefaultValue(),
      });
      setIsAddingGate(false);
      await reloadConfig();
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to add gate'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteGate = async (gateId: string) => {
    if (!confirm('Are you sure you want to delete this gate?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteGateAction(config.id, flag.projectId, flag.id, gateId);
      toast.success('Gate deleted successfully');
      await reloadConfig();
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to delete gate'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGateEnabled = async (gate: Gate) => {
    setLoading(true);
    try {
      await updateGateAction(config.id, flag.projectId, flag.id, gate.id, {
        enabled: !gate.enabled,
      });
      toast.success(`Gate ${!gate.enabled ? 'enabled' : 'disabled'}`);
      await reloadConfig();
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to update gate'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, gateId: string) => {
    if (editingGateId) return; // Disable drag while editing
    setDraggedGateId(gateId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, gateId: string) => {
    if (editingGateId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverGateId(gateId);
  };

  const handleDragLeave = () => {
    setDragOverGateId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetGateId: string) => {
    e.preventDefault();

    if (editingGateId || !draggedGateId || draggedGateId === targetGateId) {
      setDraggedGateId(null);
      setDragOverGateId(null);
      return;
    }

    const draggedIndex = gates.findIndex((g) => g.id === draggedGateId);
    const targetIndex = gates.findIndex((g) => g.id === targetGateId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedGateId(null);
      setDragOverGateId(null);
      return;
    }

    const newGates = [...gates];
    const [draggedGate] = newGates.splice(draggedIndex, 1);
    newGates.splice(targetIndex, 0, draggedGate);

    try {
      validateGates(newGates);
    } catch (error) {
      setDraggedGateId(null);
      setDragOverGateId(null);
      if (error instanceof GateValidationError) {
        toast.error(error.message);
      } else {
        toast.error('Invalid gate order');
      }
      return;
    }

    setGates(newGates);
    setDraggedGateId(null);
    setDragOverGateId(null);

    setLoading(true);
    try {
      const gateIds = newGates.map((g) => g.id);
      await reorderGatesAction(config.id, flag.projectId, flag.id, gateIds);
      toast.success('Gates reordered successfully');
      await reloadConfig();
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to reorder gates'));
      console.error(error);
      setGates(gates);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedGateId(null);
    setDragOverGateId(null);
  };

  const renderGateValue = (gate: Gate) => {
    if (typeof gate.value === 'boolean') {
      return gate.value ? 'true' : 'false';
    }
    if (typeof gate.value === 'object') {
      return JSON.stringify(gate.value);
    }
    return String(gate.value);
  };

  const renderValueInput = (fieldValue: string, onChange: (value: string) => void, disabled: boolean) => {
    switch (flag.valueType) {
      case 'boolean':
        return (
          <Select value={fieldValue || 'true'} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">true</SelectItem>
              <SelectItem value="false">false</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'json':
        return (
          <Textarea
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder='{"key": "value"}'
            className="font-mono text-sm"
            rows={3}
            disabled={disabled}
          />
        );
      default:
        return (
          <Input
            type={flag.valueType === 'number' ? 'number' : 'text'}
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getDefaultValue()}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Gates - {environment.name}</DialogTitle>
          <DialogDescription>
            Manage targeting rules for &ldquo;{flag.name}&rdquo; in {environment.name}. Gates are evaluated in order -
            first match wins. Boolean gates (all users) must be last and will automatically be kept at the end.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Existing Gates */}
          {gates.length === 0 && !isAddingGate ? (
            <Card>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm">
                  No gates configured. Add a gate to start targeting specific users.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {gates.map((gate, index) => (
                <GateRow
                  key={gate.id}
                  gate={gate}
                  index={index}
                  totalGates={gates.length}
                  flag={flag}
                  configId={config.id}
                  loading={loading}
                  editingGateId={editingGateId}
                  draggedGateId={draggedGateId}
                  dragOverGateId={dragOverGateId}
                  onStartEdit={(id) => setEditingGateId(id)}
                  onCancelEdit={() => setEditingGateId(null)}
                  onUpdate={async () => {
                    await reloadConfig();
                    setEditingGateId(null);
                  }}
                  onDelete={handleDeleteGate}
                  onToggleEnabled={handleToggleGateEnabled}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  renderGateValue={renderGateValue}
                  renderValueInput={renderValueInput}
                  parseValue={parseValue}
                />
              ))}
            </div>
          )}

          {/* Add New Gate Form */}
          {isAddingGate ? (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-sm">Add New Gate</CardTitle>
                {gates.length > 0 && gates[gates.length - 1].type === 'boolean' && addGateType !== 'boolean' && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    This gate will be inserted before the boolean gate to maintain proper ordering.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <Form {...addForm}>
                  <form onSubmit={addForm.handleSubmit(onAddGate)} className="space-y-4">
                    <FormField
                      control={addForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gate Type</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(v: 'boolean' | 'actors') => {
                              field.onChange(v);
                              if (v === 'actors') {
                                addForm.setValue('actorIds', []);
                              }
                            }}
                            disabled={loading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="boolean">Boolean - Always return value (must be last)</SelectItem>
                              <SelectItem value="actors">Actors - Target specific actors</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {addGateType === 'actors' && (
                      <FormField
                        control={addForm.control}
                        name="actorIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Targeting Specific Actors</FormLabel>
                            <FormControl>
                              <ActorIdsInput
                                value={field.value ?? []}
                                onChange={field.onChange}
                                disabled={loading}
                                placeholder="Add actor ID..."
                              />
                            </FormControl>
                            <FormDescription>Press Enter or comma to add each actor ID</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={addForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Return Value</FormLabel>
                          <FormControl>{renderValueInput(field.value, field.onChange, loading)}</FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addForm.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
                          </FormControl>
                          <FormLabel className="!mt-0">Enabled</FormLabel>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading} size="sm">
                        <Check className="mr-1 h-4 w-4" />
                        Add Gate
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setIsAddingGate(false);
                          addForm.reset({
                            type: 'boolean',
                            enabled: true,
                            value: getDefaultValue(),
                          });
                        }}
                        variant="ghost"
                        disabled={loading}
                        size="sm"
                      >
                        <X className="mr-1 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Button
              onClick={() => setIsAddingGate(true)}
              variant="outline"
              className="w-full"
              disabled={loading || editingGateId !== null}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Gate
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface GateRowProps {
  gate: Gate;
  index: number;
  totalGates: number;
  flag: Flag;
  configId: string;
  loading: boolean;
  editingGateId: string | null;
  draggedGateId: string | null;
  dragOverGateId: string | null;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onUpdate: () => Promise<void>;
  onDelete: (id: string) => void;
  onToggleEnabled: (gate: Gate) => void;
  onDragStart: (e: React.DragEvent, gateId: string) => void;
  onDragOver: (e: React.DragEvent, gateId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, gateId: string) => void;
  onDragEnd: () => void;
  renderGateValue: (gate: Gate) => string;
  renderValueInput: (value: string, onChange: (v: string) => void, disabled: boolean) => React.ReactNode;
  parseValue: (valueStr: string, valueType: FlagValueType) => string | boolean | number | object;
}

function GateRow({
  gate,
  index,
  totalGates,
  flag,
  configId,
  loading,
  editingGateId,
  draggedGateId,
  dragOverGateId,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onToggleEnabled,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  renderGateValue,
  renderValueInput,
  parseValue,
}: GateRowProps) {
  const isEditing = editingGateId === gate.id;
  const isDragging = draggedGateId === gate.id;
  const isDragOver = dragOverGateId === gate.id;
  const canDrag = !loading && !editingGateId;

  const getDefaultEditValues = useCallback((): UpdateGateInput => {
    const valueStr =
      typeof gate.value === 'boolean'
        ? gate.value.toString()
        : typeof gate.value === 'object'
          ? JSON.stringify(gate.value)
          : String(gate.value);

    if (gate.type === 'actors') {
      return {
        type: 'actors',
        value: valueStr,
        actorIds: [...gate.actorIds],
      };
    }
    return {
      type: 'boolean',
      value: valueStr,
    };
  }, [gate]);

  const form = useForm<UpdateGateInput>({
    resolver: zodResolver(updateGateSchema),
    mode: 'onTouched',
    defaultValues: getDefaultEditValues(),
  });

  // Reset form when starting to edit
  useEffect(() => {
    if (isEditing) {
      form.reset(getDefaultEditValues());
    }
  }, [isEditing, form, getDefaultEditValues]);

  async function onSubmit(data: UpdateGateInput) {
    try {
      const parsedValue = parseValue(data.value, flag.valueType);

      const updates =
        gate.type === 'actors'
          ? {
              value: parsedValue,
              actorIds: (data as { actorIds: string[] }).actorIds,
            }
          : {
              value: parsedValue,
            };

      await updateGateAction(configId, flag.projectId, flag.id, gate.id, updates);
      toast.success('Gate updated successfully');
      await onUpdate();
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to update gate'));
      console.error(error);
    }
  }

  return (
    <Card
      draggable={canDrag}
      onDragStart={(e) => onDragStart(e, gate.id)}
      onDragOver={(e) => onDragOver(e, gate.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, gate.id)}
      onDragEnd={onDragEnd}
      className={`transition-all ${canDrag ? 'cursor-move' : ''} ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'border-primary border-2' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className={`text-muted-foreground h-4 w-4 ${!canDrag ? 'opacity-30' : ''}`} />
            <CardTitle className="text-sm">
              Gate {index + 1}
              <Badge variant="outline" className="ml-2">
                {gate.type}
              </Badge>
              {gate.type === 'boolean' && index === totalGates - 1 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  Always last
                </Badge>
              )}
            </CardTitle>
          </div>
          {!isEditing && (
            <div className="flex items-center gap-2">
              <Switch
                checked={gate.enabled}
                onCheckedChange={() => onToggleEnabled(gate)}
                disabled={loading || editingGateId !== null}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onStartEdit(gate.id)}
                disabled={loading || editingGateId !== null}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDelete(gate.id)}
                disabled={loading || editingGateId !== null}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {gate.type === 'actors' && (
                <FormField
                  control={form.control}
                  name="actorIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Targeting Specific Actors</FormLabel>
                      <FormControl>
                        <ActorIdsInput
                          value={field.value ?? []}
                          onChange={field.onChange}
                          disabled={loading}
                          placeholder="Add actor ID..."
                        />
                      </FormControl>
                      <FormDescription>Press Enter or comma to add each actor ID</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return Value</FormLabel>
                    <FormControl>{renderValueInput(field.value, field.onChange, loading)}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="outline" disabled={loading}>
                  <Check className="mr-1 h-4 w-4" />
                  Save
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit} disabled={loading}>
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <>
            {gate.type === 'actors' && (
              <div>
                <Label className="text-muted-foreground text-xs">Targeting Specific Actors</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {gate.actorIds.map((actorId) => (
                    <Badge key={actorId} variant="secondary">
                      {actorId}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground text-xs">Return Value</Label>
              <p className="mt-1 font-mono text-sm">{renderGateValue(gate)}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
