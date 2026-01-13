'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { Flag, Environment, FlagEnvironmentConfig, Gate, FlagValueType } from '@marshant/core';
import { validateGates, GateValidationError } from '@marshant/core';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Switch } from '@/ui/switch';
import { Textarea } from '@/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
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
  const [draggedGateId, setDraggedGateId] = useState<string | null>(null);
  const [dragOverGateId, setDragOverGateId] = useState<string | null>(null);

  // New gate form state
  const [newGateType, setNewGateType] = useState<'boolean' | 'actors'>('boolean');
  const [newGateEnabled, setNewGateEnabled] = useState(true);
  const [newGateValue, setNewGateValue] = useState('');
  const [newGateActorIds, setNewGateActorIds] = useState('');

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

  // Initialize default value based on flag type
  useEffect(() => {
    if (isAddingGate && !newGateValue) {
      setNewGateValue(getDefaultValue());
    }
  }, [isAddingGate, newGateValue, getDefaultValue]);

  useEffect(() => {
    if (open) {
      setGates(config.gates || []);
      setIsAddingGate(false);
    }
  }, [open, config.gates]);

  // Reload config from server after mutations
  const reloadConfig = async () => {
    try {
      const updatedConfig = await getFlagConfigAction(flag.id, environment.id);
      setGates(updatedConfig.gates || []);
      router.refresh();
    } catch (error) {
      console.error('Failed to reload config:', error);
    }
  };

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

  const handleAddGate = async () => {
    if (!newGateValue.trim()) {
      toast.error('Value is required');
      return;
    }

    if (newGateType === 'actors' && !newGateActorIds.trim()) {
      toast.error('Targeting specific actors are required for actors gate');
      return;
    }

    setLoading(true);
    try {
      const parsedValue = parseValue(newGateValue, flag.valueType);

      const newGate =
        newGateType === 'boolean'
          ? {
              type: 'boolean' as const,
              enabled: newGateEnabled,
              value: parsedValue,
            }
          : {
              type: 'actors' as const,
              enabled: newGateEnabled,
              actorIds: newGateActorIds
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean),
              value: parsedValue,
            };

      // The backend handles smart insertion - non-boolean gates are automatically
      // inserted before any existing boolean gate
      await addGateAction(config.id, flag.projectId, flag.id, newGate as Omit<Gate, 'id'>);

      const hasBooleanGateAtEnd = gates.length > 0 && gates[gates.length - 1].type === 'boolean';
      const isAddingBooleanGate = newGateType === 'boolean';

      if (!isAddingBooleanGate && hasBooleanGateAtEnd) {
        toast.success('Gate added before boolean gate');
      } else {
        toast.success('Gate added successfully');
      }

      // Reset form
      setNewGateType('boolean');
      setNewGateEnabled(true);
      setNewGateValue('');
      setNewGateActorIds('');
      setIsAddingGate(false);

      // Reload config to update the gates list
      await reloadConfig();
    } catch (error: unknown) {
      // Extract error message from backend validation
      const errorMessage = (error as Error)?.message || 'Failed to add gate';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGate = async (gateId: string) => {
    if (!confirm('Are you sure you want to delete this gate?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteGateAction(config.id, flag.projectId, flag.id, gateId);
      toast.success('Gate deleted successfully');
      // Reload config to update the gates list
      await reloadConfig();
    } catch (error) {
      toast.error('Failed to delete gate');
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
      // Reload config to update the gates list
      await reloadConfig();
    } catch (error) {
      toast.error('Failed to update gate');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, gateId: string) => {
    setDraggedGateId(gateId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, gateId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverGateId(gateId);
  };

  const handleDragLeave = () => {
    setDragOverGateId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetGateId: string) => {
    e.preventDefault();

    if (!draggedGateId || draggedGateId === targetGateId) {
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

    // Reorder gates array
    const newGates = [...gates];
    const [draggedGate] = newGates.splice(draggedIndex, 1);
    newGates.splice(targetIndex, 0, draggedGate);

    // Validate the new order before sending to server
    try {
      validateGates(newGates);
    } catch (error) {
      // Validation failed - show error and don't proceed
      setDraggedGateId(null);
      setDragOverGateId(null);
      if (error instanceof GateValidationError) {
        toast.error(error.message);
      } else {
        toast.error('Invalid gate order');
      }
      return;
    }

    // Optimistically update UI
    setGates(newGates);
    setDraggedGateId(null);
    setDragOverGateId(null);

    // Persist to server
    setLoading(true);
    try {
      const gateIds = newGates.map((g) => g.id);
      await reorderGatesAction(config.id, flag.projectId, flag.id, gateIds);
      toast.success('Gates reordered successfully');
      await reloadConfig();
    } catch (error: unknown) {
      // Extract error message from backend
      const errorMessage = (error as Error)?.message || 'Failed to reorder gates';
      toast.error(errorMessage);
      console.error(error);
      // Revert on error
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
              {gates.map((gate, index) => {
                const isDragging = draggedGateId === gate.id;
                const isDragOver = dragOverGateId === gate.id;

                return (
                  <Card
                    key={gate.id}
                    draggable={!loading}
                    onDragStart={(e) => handleDragStart(e, gate.id)}
                    onDragOver={(e) => handleDragOver(e, gate.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, gate.id)}
                    onDragEnd={handleDragEnd}
                    className={`cursor-move transition-all ${
                      isDragging ? 'opacity-50' : ''
                    } ${isDragOver ? 'border-primary border-2' : ''}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="text-muted-foreground h-4 w-4" />
                          <CardTitle className="text-sm">
                            Gate {index + 1}
                            <Badge variant="outline" className="ml-2">
                              {gate.type}
                            </Badge>
                            {gate.type === 'boolean' && index === gates.length - 1 && (
                              <Badge variant="secondary" className="ml-1 text-xs">
                                Always last
                              </Badge>
                            )}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={gate.enabled}
                            onCheckedChange={() => handleToggleGateEnabled(gate)}
                            disabled={loading}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteGate(gate.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Add New Gate Form */}
          {isAddingGate ? (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-sm">Add New Gate</CardTitle>
                {gates.length > 0 && gates[gates.length - 1].type === 'boolean' && newGateType !== 'boolean' && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    💡 This gate will be inserted before the boolean gate to maintain proper ordering.
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Gate Type</Label>
                  <Select value={newGateType} onValueChange={(v: 'boolean' | 'actors') => setNewGateType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boolean">Boolean - Always return value (must be last)</SelectItem>
                      <SelectItem value="actors">Actors - Target specific actors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newGateType === 'actors' && (
                  <div className="space-y-2">
                    <Label>Targeting Specific Actors (comma-separated)</Label>
                    <Input
                      value={newGateActorIds}
                      onChange={(e) => setNewGateActorIds(e.target.value)}
                      placeholder="user-123, user-456, user-789"
                    />
                    <p className="text-muted-foreground text-xs">Enter actor IDs separated by commas</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Return Value</Label>
                  {flag.valueType === 'boolean' ? (
                    <Select value={newGateValue || 'true'} onValueChange={setNewGateValue}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">true</SelectItem>
                        <SelectItem value="false">false</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : flag.valueType === 'json' ? (
                    <Textarea
                      value={newGateValue}
                      onChange={(e) => setNewGateValue(e.target.value)}
                      placeholder='{"key": "value"}'
                      className="font-mono text-sm"
                      rows={3}
                    />
                  ) : (
                    <Input
                      type={flag.valueType === 'number' ? 'number' : 'text'}
                      value={newGateValue}
                      onChange={(e) => setNewGateValue(e.target.value)}
                      placeholder={getDefaultValue()}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={newGateEnabled} onCheckedChange={setNewGateEnabled} />
                  <Label>Enabled</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddGate} disabled={loading} size="sm">
                    Add Gate
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingGate(false);
                      setNewGateType('boolean');
                      setNewGateEnabled(true);
                      setNewGateValue('');
                      setNewGateActorIds('');
                    }}
                    variant="ghost"
                    disabled={loading}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setIsAddingGate(true)} variant="outline" className="w-full" disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              Add Gate
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
