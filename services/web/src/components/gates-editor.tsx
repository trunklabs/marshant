'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import type { Gate, FlagValueType, FlagValueTypeMap } from '@marcurry/core';

interface GatesEditorProps {
  initialGates: Gate[];
  valueType: FlagValueType;
  onChange?: (gates: Gate[]) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
}

export function GatesEditor({ initialGates, valueType, onChange, onValidationChange }: GatesEditorProps) {
  const [gates, setGates] = useState<Gate[]>(initialGates);

  const validateGates = (gatesToValidate: Gate[]): { isValid: boolean; error?: string } => {
    // Check if any actors gate has empty actorIds
    const invalidActorsGate = gatesToValidate.find(
      (gate) => gate.type === 'actors' && (!gate.actorIds || gate.actorIds.length === 0)
    );

    if (invalidActorsGate) {
      return { isValid: false, error: 'Actors gates must have at least one actor ID' };
    }

    return { isValid: true };
  };

  const updateGates = (newGates: Gate[]) => {
    setGates(newGates);
    onChange?.(newGates);

    // Validate and notify parent
    const validation = validateGates(newGates);
    onValidationChange?.(validation.isValid, validation.error);
  };

  const addGate = () => {
    const newGate: Gate = {
      id: crypto.randomUUID(),
      type: 'boolean',
      enabled: true,
      value: getDefaultValue(valueType),
    } as Gate;
    updateGates([...gates, newGate]);
  };

  const removeGate = (index: number) => {
    updateGates(gates.filter((_, i) => i !== index));
  };

  const moveGateUp = (index: number) => {
    if (index === 0) return;
    const newGates = [...gates];
    [newGates[index - 1], newGates[index]] = [newGates[index], newGates[index - 1]];
    updateGates(newGates);
  };

  const moveGateDown = (index: number) => {
    if (index === gates.length - 1) return;
    const newGates = [...gates];
    [newGates[index], newGates[index + 1]] = [newGates[index + 1], newGates[index]];
    updateGates(newGates);
  };

  const updateGate = (index: number, updates: Partial<Gate>) => {
    const newGates = gates.map((gate, i) => {
      if (i !== index) return gate;
      const updated = { ...gate, ...updates };
      // When changing type, ensure proper shape
      if (updates.type === 'actors' && gate.type !== 'actors') {
        return { ...updated, actorIds: [] } as Gate;
      }
      if (updates.type === 'boolean' && gate.type !== 'boolean') {
        const { actorIds: _actorIds, ...rest } = updated as Gate & { actorIds?: string[] };
        return rest as Gate;
      }
      return updated as Gate;
    });
    updateGates(newGates);
  };

  const updateActorIds = (index: number, actorIds: string[]) => {
    const newGates = gates.map((gate, i) => {
      if (i !== index) return gate;
      return { ...gate, actorIds } as Gate;
    });
    updateGates(newGates);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Gates</Label>
          <p className="text-muted-foreground mt-1 text-xs">
            Control access with multiple gates. Gates are evaluated in order (top to bottom).
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addGate}>
          <Plus className="mr-1 h-4 w-4" /> Add Gate
        </Button>
      </div>

      {gates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">No gates configured. Add a gate to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
          {gates.map((gate, index) => (
            <Card key={gate.id} className="relative">
              <CardContent className="space-y-4 pt-6">
                {/* Gate header with controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs font-medium">Gate #{index + 1}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => moveGateUp(index)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => moveGateDown(index)}
                        disabled={index === gates.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => removeGate(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Enabled toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`gate-${index}-enabled`}>Enabled</Label>
                  <Switch
                    id={`gate-${index}-enabled`}
                    checked={gate.enabled}
                    onCheckedChange={(checked) => updateGate(index, { enabled: checked })}
                  />
                </div>

                {/* Gate type selector */}
                <div className="space-y-2">
                  <Label htmlFor={`gate-${index}-type`}>Type</Label>
                  <Select
                    value={gate.type}
                    onValueChange={(type) => updateGate(index, { type: type as 'boolean' | 'actors' })}
                  >
                    <SelectTrigger id={`gate-${index}-type`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boolean">Boolean (all users)</SelectItem>
                      <SelectItem value="actors">Actors (specific users)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Actor IDs input (only for actors type) */}
                {gate.type === 'actors' && (
                  <ActorIdsInput
                    actorIds={gate.actorIds || []}
                    onChange={(actorIds) => updateActorIds(index, actorIds)}
                  />
                )}

                {/* Value input */}
                <div className="space-y-2">
                  <Label htmlFor={`gate-${index}-value`}>Value to Return</Label>
                  {renderValueInput(gate, index, valueType, (value) => updateGate(index, { value }))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ActorIdsInput({ actorIds, onChange }: { actorIds: string[]; onChange: (ids: string[]) => void }) {
  const [newActorId, setNewActorId] = useState('');

  const addActor = () => {
    const trimmed = newActorId.trim();
    if (trimmed && !actorIds.includes(trimmed)) {
      onChange([...actorIds, trimmed]);
      setNewActorId('');
    }
  };

  const removeActor = (id: string) => {
    onChange(actorIds.filter((a) => a !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addActor();
    }
  };

  return (
    <div className="space-y-2">
      <Label>Actor IDs</Label>
      <div className="flex gap-2">
        <Input
          placeholder="user-123, org-456, etc."
          value={newActorId}
          onChange={(e) => setNewActorId(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button type="button" size="sm" onClick={addActor}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {actorIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actorIds.map((id) => (
            <div key={id} className="bg-muted flex items-center gap-1 rounded px-2 py-1 text-sm">
              <span>{id}</span>
              <button
                type="button"
                onClick={() => removeActor(id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderValueInput(
  gate: Gate,
  index: number,
  valueType: FlagValueType,
  onChange: (value: FlagValueTypeMap[FlagValueType]) => void
) {
  const id = `gate-${index}-value`;

  switch (valueType) {
    case 'boolean':
      return (
        <Select value={gate.value ? 'true' : 'false'} onValueChange={(v) => onChange(v === 'true')}>
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    case 'string':
      return (
        <Input
          id={id}
          value={String(gate.value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter string value"
        />
      );
    case 'number':
      return (
        <Input
          id={id}
          type="number"
          value={String(gate.value)}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          placeholder="0"
        />
      );
    case 'json':
      return (
        <Input
          id={id}
          value={typeof gate.value === 'string' ? gate.value : JSON.stringify(gate.value)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              onChange(e.target.value);
            }
          }}
          placeholder='{"key": "value"}'
        />
      );
  }
}

function getDefaultValue(valueType: FlagValueType): FlagValueTypeMap[FlagValueType] {
  switch (valueType) {
    case 'boolean':
      return true;
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'json':
      return {};
  }
}
