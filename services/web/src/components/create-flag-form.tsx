'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/button';
import { Card, CardContent } from '@/ui/card';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Textarea } from '@/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { RadioGroup, RadioGroupItem } from '@/ui/radio-group';
import { createFlagAction, createFlagConfigAction } from '@/server/flags';
import { listEnvironmentsAction } from '@/server/environments';
import { toast } from 'sonner';
import { slugify } from '@/lib/utils';
import type { Project, FlagValueType } from '@marcurry/core';

interface CreateFlagFormProps {
  projects: Project[];
  preselectedProjectId?: string;
}

export function CreateFlagForm({ projects, preselectedProjectId }: CreateFlagFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [projectId, setProjectId] = useState(preselectedProjectId || projects[0]?.id || '');
  const [flagName, setFlagName] = useState('');
  const [flagKey, setFlagKey] = useState('');
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [valueType, setValueType] = useState<FlagValueType>('boolean');
  const [defaultValue, setDefaultValue] = useState('false');

  const handleNameChange = (value: string) => {
    setFlagName(value);
    // Auto-slugify key from name if not manually edited
    if (!keyManuallyEdited) {
      setFlagKey(slugify(value));
    }
  };

  const handleKeyChange = (value: string) => {
    setFlagKey(value);
    setKeyManuallyEdited(true);
  };

  const handleTypeChange = (type: FlagValueType) => {
    setValueType(type);
    // Reset default value based on type
    switch (type) {
      case 'boolean':
        setDefaultValue('false');
        break;
      case 'string':
        setDefaultValue('');
        break;
      case 'number':
        setDefaultValue('0');
        break;
      case 'json':
        setDefaultValue('{}');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const name = flagName.trim();
      const key = flagKey.trim();

      if (!projectId) {
        toast.error('Please select a project');
        return;
      }

      if (!name) {
        toast.error('Flag name is required');
        return;
      }

      if (!key) {
        toast.error('Flag key is required');
        return;
      }

      // Parse default value based on type
      let parsedDefaultValue: boolean | string | number | object;
      try {
        switch (valueType) {
          case 'boolean':
            parsedDefaultValue = defaultValue === 'true';
            break;
          case 'string':
            parsedDefaultValue = defaultValue;
            break;
          case 'number':
            parsedDefaultValue = parseFloat(defaultValue);
            if (isNaN(parsedDefaultValue)) throw new Error('Invalid number');
            break;
          case 'json':
            parsedDefaultValue = JSON.parse(defaultValue);
            break;
        }
      } catch {
        toast.error(`Invalid default value for type ${valueType}`);
        return;
      }

      // Create the flag
      const flag = await createFlagAction({
        projectId,
        key,
        name,
        valueType,
        defaultValue: parsedDefaultValue as string | boolean | number | object,
      });

      // Fetch all environments for the project
      const environments = await listEnvironmentsAction(projectId);

      // Create a config for each environment
      await Promise.all(
        environments.map((env) =>
          createFlagConfigAction({
            flagId: flag.id,
            environmentId: env.id,
            projectId,
            enabled: false, // Start disabled by default
            defaultValue: parsedDefaultValue as string | boolean | number | object,
            gates: [], // No gates initially
          })
        )
      );

      toast.success('Flag created successfully');
      router.push(`/app/flags?project=${projectId}`);
    } catch (error) {
      toast.error('Failed to create flag');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderDefaultValueInput = () => {
    switch (valueType) {
      case 'boolean':
        return (
          <Select value={defaultValue} onValueChange={setDefaultValue}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">true</SelectItem>
              <SelectItem value="false">false</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'string':
        return (
          <Input
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder="Enter default string value"
          />
        );
      case 'number':
        return (
          <Input type="number" value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)} placeholder="0" />
        );
      case 'json':
        return (
          <Textarea
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder='{"key": "value"}'
            className="font-mono text-sm"
            rows={4}
          />
        );
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={!!preselectedProjectId}>
              <SelectTrigger id="project">
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Flag Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Flag Name *</Label>
            <Input
              id="name"
              value={flagName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Dark Mode"
              required
            />
          </div>

          {/* Flag Key */}
          <div className="space-y-2">
            <Label htmlFor="key">Flag Key *</Label>
            <Input
              id="key"
              value={flagKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder="dark-mode"
              required
            />
            <p className="text-muted-foreground text-sm">Unique identifier used in code. Auto-generated from name.</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enable dark mode theme for users"
              rows={3}
            />
          </div>

          {/* Flag Type */}
          <div className="space-y-2">
            <Label>Flag Type *</Label>
            <RadioGroup value={valueType} onValueChange={(v: string) => handleTypeChange(v as FlagValueType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="boolean" id="type-boolean" />
                <Label htmlFor="type-boolean" className="font-normal">
                  Boolean
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="string" id="type-string" />
                <Label htmlFor="type-string" className="font-normal">
                  String
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="number" id="type-number" />
                <Label htmlFor="type-number" className="font-normal">
                  Number
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="type-json" />
                <Label htmlFor="type-json" className="font-normal">
                  JSON
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Default Value */}
          <div className="space-y-2">
            <Label htmlFor="defaultValue">Default Value *</Label>
            {renderDefaultValueInput()}
            <p className="text-muted-foreground text-sm">Value returned when no targeting rules match.</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Flag'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
