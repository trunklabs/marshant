'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Switch } from '@/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';
import { GatesEditor } from '@/components/gates-editor';
import { createFlagConfigAction, updateFlagConfigAction } from '@/server/flags';
import type { Environment, Flag, FlagEnvironmentConfig, Gate, FlagValueType, FlagValueTypeMap } from '@marshant/core';

type Props = {
  flag: Flag;
  environments: Environment[];
  configs: FlagEnvironmentConfig[];
};

export function FlagEnvMatrix({ flag, environments, configs }: Props) {
  const configMap = useMemo(() => new Map(configs.map((c) => [c.environmentId, c])), [configs]);

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Environment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gates</TableHead>
              <TableHead className="w-[1%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {environments.map((env) => (
              <EnvRow
                key={env.id}
                flagId={flag.id}
                projectId={flag.projectId}
                flagValueType={flag.valueType}
                flagDefaultValue={flag.defaultValue as FlagValueTypeMap[FlagValueType]}
                environmentId={env.id}
                environmentName={env.name}
                initialConfigId={configMap.get(env.id)?.id}
                initialEnabled={configMap.get(env.id)?.enabled ?? false}
                initialGates={configMap.get(env.id)?.gates ?? []}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EnvRow({
  flagId,
  projectId,
  flagValueType,
  flagDefaultValue,
  environmentId,
  environmentName,
  initialConfigId,
  initialEnabled,
  initialGates,
}: {
  flagId: string;
  projectId: string;
  flagValueType: FlagValueType;
  flagDefaultValue: FlagValueTypeMap[FlagValueType];
  environmentId: string;
  environmentName: string;
  initialConfigId?: string;
  initialEnabled: boolean;
  initialGates: Gate[];
}) {
  const [enabled, setEnabled] = useState<boolean>(initialEnabled);
  const [open, setOpen] = useState(false);
  const [gates, setGates] = useState<Gate[]>(initialGates);
  const [saving, setSaving] = useState(false);
  const [configId, setConfigId] = useState<string | undefined>(initialConfigId);
  const [isGatesValid, setIsGatesValid] = useState(true);
  const [validationError, setValidationError] = useState<string>();

  async function toggleEnabled(next: boolean) {
    setEnabled(next);
    setSaving(true);
    try {
      if (configId) {
        const updated = await updateFlagConfigAction(configId, projectId, flagId, { enabled: next, gates });
        setConfigId(updated.id);
      } else {
        const created = await createFlagConfigAction({
          flagId,
          environmentId,
          projectId,
          enabled: next,
          gates,
          defaultValue: flagDefaultValue,
        });
        setConfigId(created.id);
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveGates() {
    setSaving(true);
    try {
      if (configId) {
        await updateFlagConfigAction(configId, projectId, flagId, { gates });
      } else {
        const created = await createFlagConfigAction({
          flagId,
          environmentId,
          projectId,
          enabled,
          defaultValue: flagDefaultValue,
          gates,
        });
        setConfigId(created.id);
      }
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const handleValidationChange = (isValid: boolean, error?: string) => {
    setIsGatesValid(isValid);
    setValidationError(error);
  };

  useEffect(() => {
    if (open) {
      const invalidActorsGate = gates.find(
        (gate) => gate.type === 'actors' && (!gate.actorIds || gate.actorIds.length === 0)
      );
      if (invalidActorsGate) {
        setIsGatesValid(false);
        setValidationError('Actors gates must have at least one actor ID');
      } else {
        setIsGatesValid(true);
        setValidationError(undefined);
      }
    }
  }, [open, gates]);

  const gatesSummary = gates?.length
    ? gates
        .map((g, i) => {
          const status = g.enabled ? '' : ' (disabled)';
          if (g.type === 'boolean') {
            return `#${i + 1}: ${g.value ? 'true' : 'false'}${status}`;
          }
          return `#${i + 1}: ${g.actorIds.length} actors${status}`;
        })
        .join(' | ')
    : 'none';

  return (
    <TableRow>
      <TableCell className="font-mono">{environmentName}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={toggleEnabled} disabled={saving} />
          <Badge variant={enabled ? 'default' : 'secondary'}>{enabled ? 'On' : 'Off'}</Badge>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{gatesSummary}</TableCell>
      <TableCell className="text-right">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              Configure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configure gates</DialogTitle>
            </DialogHeader>
            <GatesEditor
              initialGates={gates}
              valueType={flagValueType}
              onChange={setGates}
              onValidationChange={handleValidationChange}
            />
            {validationError && <div className="text-destructive text-sm">{validationError}</div>}
            <DialogFooter>
              <Button onClick={() => setOpen(false)} variant="ghost" disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveGates} disabled={saving || !isGatesValid}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}
