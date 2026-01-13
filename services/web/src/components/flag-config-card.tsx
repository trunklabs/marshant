'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Switch } from '@/ui/switch';
import { Label } from '@/ui/label';
import { createFlagConfigAction, updateFlagConfigAction } from '@/server/flags';
import { toast } from 'sonner';
import { parseErrorMessage } from '@/lib/utils';
import type { Flag, Environment, FlagEnvironmentConfig } from '@marshant/core';

interface FlagConfigCardProps {
  flag: Flag;
  environment: Environment;
  config?: FlagEnvironmentConfig;
  projectId: string;
}

export function FlagConfigCard({ flag, environment, config, projectId }: FlagConfigCardProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [updating, setUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setUpdating(true);
    try {
      if (config) {
        await updateFlagConfigAction(config.id, projectId, flag.id, { enabled: checked });
      } else {
        await createFlagConfigAction({
          flagId: flag.id,
          environmentId: environment.id,
          projectId,
          enabled: checked,
          defaultValue: flag.defaultValue,
        });
      }
      setEnabled(checked);
      toast.success(`Flag ${checked ? 'enabled' : 'disabled'} in ${environment.name}`);
      router.refresh();
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to update flag configuration'));
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{environment.name}</CardTitle>
          <Badge variant={enabled ? 'default' : 'secondary'}>{enabled ? 'Enabled' : 'Disabled'}</Badge>
        </div>
        <CardDescription>
          <code className="text-xs">{environment.key}</code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor={`toggle-${environment.id}`}>Status</Label>
          <Switch
            id={`toggle-${environment.id}`}
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={updating}
          />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">Default Value</Label>
          <p className="mt-1 font-mono text-sm">{JSON.stringify(config?.defaultValue ?? flag.defaultValue)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
