'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Project, FlagValueType, FlagValueTypeMap } from '@marcurry/core';
import { createFlagAction } from '@/app/actions/flags';
import { slugify } from '@/lib/utils';

export function CreateFlagInline(props: { projectId?: string; envId?: string; products?: Project[] }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Form state
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [valueType, setValueType] = useState<FlagValueType>('boolean');
  const [defaultValue, setDefaultValue] = useState<string>('false');

  const canPickProject = !props.projectId;
  const projectOptions = useMemo(() => props.products ?? [], [props.products]);

  // Auto-slugify key from name
  const handleNameChange = (newName: string) => {
    setName(newName);
    // Only auto-update key if it's empty or matches the old slugified name
    if (key === '' || key === slugify(name)) {
      setKey(slugify(newName));
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setName('');
      setKey('');
      setValueType('boolean');
      setDefaultValue('false');
    }
  };

  async function action(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pid = props.projectId || selectedProjectId || (projectOptions[0]?.id ?? '');
      if (!pid) {
        showToast('Please select a project', 'error');
        return;
      }

      if (!name.trim()) {
        showToast('Name is required', 'error');
        return;
      }

      if (!key.trim()) {
        showToast('Key is required', 'error');
        return;
      }

      // Parse defaultValue based on valueType
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
      } catch (_err) {
        console.log(_err);
        showToast(`Invalid default value for type ${valueType}`, 'error');
        return;
      }

      await createFlagAction({
        projectId: pid,
        key: key.trim(),
        name: name.trim(),
        valueType,
        defaultValue: parsedDefaultValue as FlagValueTypeMap[FlagValueType],
      });
      setOpen(false);
      showToast('Flag created successfully');
      if (pid) router.push(`/?projectId=${pid}`);
    } finally {
      setSubmitting(false);
    }
  }

  // Render defaultValue input based on valueType
  const renderDefaultValueInput = () => {
    switch (valueType) {
      case 'boolean':
        return (
          <Select value={defaultValue} onValueChange={setDefaultValue}>
            <SelectTrigger id="defaultValue">
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
            id="defaultValue"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder="Enter string value"
          />
        );
      case 'number':
        return (
          <Input
            id="defaultValue"
            type="number"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder="0"
          />
        );
      case 'json':
        return (
          <Input
            id="defaultValue"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder='{"key": "value"}'
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Flag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={action} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create Flag</DialogTitle>
            <DialogDescription>Create a new project-scoped flag</DialogDescription>
          </DialogHeader>

          {canPickProject && (
            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger id="projectId" className="w-full">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Flag"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="key">Key</Label>
            <Input id="key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="my-flag" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valueType">Value Type</Label>
            <Select
              value={valueType}
              onValueChange={(v) => {
                setValueType(v as FlagValueType);
                // Reset default value when type changes
                switch (v) {
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
              }}
            >
              <SelectTrigger id="valueType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultValue">Default Value</Label>
            {renderDefaultValueInput()}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={submitting}>
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              <Sparkles className="mr-1 h-4 w-4" />
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
