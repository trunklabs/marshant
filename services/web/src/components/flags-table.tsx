'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Switch } from '@/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table';
import { toast } from 'sonner';
import { updateFlagConfigAction, createFlagConfigAction } from '@/server/flags';
import { FlagActions } from '@/components/flag-actions';
import { GatesConfigDialog } from '@/components/gates-config-dialog';
import type { Flag, Environment, FlagEnvironmentConfig, Project } from '@marcurry/core';

interface FlagWithProject extends Flag {
  project: Project;
  configs: FlagEnvironmentConfig[];
  environments: Environment[]; // Environments specific to this flag's project
}

interface FlagsTableProps {
  flags: FlagWithProject[];
  showProject?: boolean;
}

export function FlagsTable({ flags, showProject = true }: FlagsTableProps) {
  const router = useRouter();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [togglingConfigs, setTogglingConfigs] = useState<Set<string>>(new Set());
  const [gatesDialogOpen, setGatesDialogOpen] = useState<{
    flag: FlagWithProject;
    env: Environment;
    config: FlagEnvironmentConfig;
  } | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleRow = (flagId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(flagId)) {
        next.delete(flagId);
      } else {
        next.add(flagId);
      }
      return next;
    });
  };

  const handleToggleEnvironment = async (
    e: React.MouseEvent,
    flag: FlagWithProject,
    config: FlagEnvironmentConfig | undefined,
    environment: Environment
  ) => {
    e.stopPropagation();

    const configKey = config ? `${config.id}` : `${flag.id}-${environment.id}`;
    setTogglingConfigs((prev) => new Set(prev).add(configKey));

    try {
      if (!config) {
        // Config doesn't exist, create it with enabled: true
        await createFlagConfigAction({
          flagId: flag.id,
          environmentId: environment.id,
          projectId: flag.projectId,
          enabled: true,
          defaultValue: flag.defaultValue,
          gates: [],
        });
        toast.success(`${flag.name} enabled in ${environment.name}`);
      } else {
        // Config exists, toggle it
        await updateFlagConfigAction(config.id, flag.projectId, flag.id, {
          enabled: !config.enabled,
        });
        toast.success(`${flag.name} ${!config.enabled ? 'enabled' : 'disabled'} in ${environment.name}`);
      }

      // Clean up state before refresh to prevent race condition
      setTogglingConfigs((prev) => {
        const next = new Set(prev);
        next.delete(configKey);
        return next;
      });

      router.refresh();
    } catch (error) {
      toast.error('Failed to update flag');
      console.error(error);

      // Clean up state on error
      setTogglingConfigs((prev) => {
        const next = new Set(prev);
        next.delete(configKey);
        return next;
      });
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Flag Name</TableHead>
            <TableHead className="w-[150px]">Key</TableHead>
            {showProject && <TableHead className="w-[120px]">Project</TableHead>}
            <TableHead className="w-[80px]">Type</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flags.map((flag) => {
            const isExpanded = expandedRows.has(flag.id);
            const enabledCount = flag.configs.filter((c) => c.enabled).length;
            const totalCount = flag.environments.length;

            return (
              <React.Fragment key={flag.id}>
                <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleRow(flag.id)}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(flag.id);
                      }}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{flag.name}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-sm">{flag.key}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(flag.key);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  {showProject && <TableCell>{flag.project.name}</TableCell>}
                  <TableCell>
                    <Badge variant="outline">{flag.valueType}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {enabledCount}/{totalCount} enabled
                    </span>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow key={`${flag.id}-expanded`}>
                    <TableCell colSpan={showProject ? 6 : 5} className="bg-muted/30 p-0">
                      <div className="space-y-2 p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Environment Configurations</h4>
                          <FlagActions flag={flag} />
                        </div>
                        <div className="space-y-2">
                          {flag.environments.map((env) => {
                            const config = flag.configs.find((c) => c.environmentId === env.id);
                            const isEnabled = config?.enabled ?? false;
                            const configKey = config ? `${config.id}` : `${flag.id}-${env.id}`;
                            const isToggling = togglingConfigs.has(configKey);
                            const gatesCount = config?.gates?.length ?? 0;

                            return (
                              <div
                                key={env.id}
                                className="bg-background flex items-center justify-between rounded-md border p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={isEnabled}
                                    disabled={isToggling}
                                    onCheckedChange={() => {
                                      handleToggleEnvironment(
                                        { stopPropagation: () => {} } as React.MouseEvent,
                                        flag,
                                        config,
                                        env
                                      );
                                    }}
                                  />
                                  <div>
                                    <p className="font-medium">{env.name}</p>
                                    <p className="text-muted-foreground text-xs">
                                      <code>{env.key}</code>
                                      {gatesCount > 0 && (
                                        <span className="ml-2">
                                          · {gatesCount} {gatesCount === 1 ? 'gate' : 'gates'}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {config && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setGatesDialogOpen({ flag, env, config })}
                                    >
                                      <Settings className="mr-1 h-3 w-3" />
                                      Configure Gates
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>

      {/* Gates Configuration Dialog */}
      {gatesDialogOpen && (
        <GatesConfigDialog
          flag={gatesDialogOpen.flag}
          environment={gatesDialogOpen.env}
          config={gatesDialogOpen.config}
          open={!!gatesDialogOpen}
          onOpenChange={(open: boolean) => {
            if (!open) setGatesDialogOpen(null);
          }}
        />
      )}
    </div>
  );
}
