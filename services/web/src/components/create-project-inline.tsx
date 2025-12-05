'use client';

import { useState } from 'react';
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
import { createProjectAction } from '@/app/actions/projects';
import { createEnvironmentAction } from '@/app/actions/environments';
import { useToast } from '@/components/ui/toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import { slugify } from '@/lib/utils';

export function CreateProjectInline() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const [envRows, setEnvRows] = useState<Array<{ id: string; name: string; key: string }>>([
    { id: crypto.randomUUID(), name: '', key: '' },
  ]);

  const trimmedEnvs = envRows.map((r) => ({ name: r.name.trim(), key: r.key.trim() })).filter((e) => e.name.length > 0);
  const hasAtLeastOneEnv = trimmedEnvs.length > 0;
  const lowerNames = trimmedEnvs.map((e) => e.name.toLowerCase());
  const lowerKeys = trimmedEnvs.map((e) => e.key.toLowerCase());
  const hasDuplicateNames = new Set(lowerNames).size !== lowerNames.length;
  const hasDuplicateKeys = new Set(lowerKeys).size !== lowerKeys.length;
  const hasEmptyKeys = trimmedEnvs.some((e) => e.key.length === 0);
  const canSubmit = hasAtLeastOneEnv && !hasDuplicateNames && !hasDuplicateKeys && !hasEmptyKeys && !submitting;

  function addEnvRow() {
    setEnvRows((rows) => [...rows, { id: crypto.randomUUID(), name: '', key: '' }]);
  }

  function updateEnvRow(id: string, patch: Partial<{ name: string; key: string }>) {
    setEnvRows((rows) =>
      rows.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...patch };
        // Auto-slugify key from name if name changed and key is empty or matches old slugified name
        if (patch.name !== undefined && (updated.key === '' || updated.key === slugify(r.name))) {
          updated.key = slugify(patch.name);
        }
        return updated;
      })
    );
  }

  function removeEnvRow(id: string) {
    setEnvRows((rows) => rows.filter((r) => r.id !== id));
  }

  // Client-side submit handler that calls existing server actions
  async function handleCreate(formData: FormData) {
    setSubmitting(true);
    try {
      const name = String(formData.get('name') || '').trim();
      if (!name) {
        showToast('Name is required', 'error');
        return;
      }

      const envs = envRows.map((r) => ({ name: r.name.trim(), key: r.key.trim() })).filter((r) => r.name.length > 0);
      if (envs.length === 0) {
        showToast('At least one environment is required', 'error');
        return;
      }
      const lowerNames = envs.map((e) => e.name.toLowerCase());
      if (new Set(lowerNames).size !== lowerNames.length) {
        showToast('Environment names must be unique', 'error');
        return;
      }
      const lowerKeys = envs.map((e) => e.key.toLowerCase());
      if (new Set(lowerKeys).size !== lowerKeys.length) {
        showToast('Environment keys must be unique', 'error');
        return;
      }
      if (envs.some((e) => !e.key)) {
        showToast('All environments must have a key', 'error');
        return;
      }

      const project = await createProjectAction({ name });
      for (const env of envs) {
        await createEnvironmentAction({ projectId: project.id, name: env.name, key: env.key });
      }
      setOpen(false);
      showToast('Project created successfully');
      setEnvRows([{ id: crypto.randomUUID(), name: '', key: '' }]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form action={handleCreate} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Add a new project and define at least one environment</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="My Project" required />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Environments</Label>
              <Button type="button" size="sm" variant="outline" onClick={addEnvRow}>
                <PlusCircle className="mr-1 h-4 w-4" /> Add Environment
              </Button>
            </div>
            <div className="space-y-2">
              <input
                type="hidden"
                name="environments"
                value={JSON.stringify(
                  envRows.map((r) => ({ name: r.name.trim(), key: r.key.trim() })).filter((r) => r.name.length > 0)
                )}
              />
              {envRows.map((row) => {
                const isDuplicateName =
                  row.name.trim().length > 0 &&
                  lowerNames.filter((n) => n === row.name.trim().toLowerCase()).length > 1;
                const isDuplicateKey =
                  row.key.trim().length > 0 && lowerKeys.filter((k) => k === row.key.trim().toLowerCase()).length > 1;
                const hasError = isDuplicateName || isDuplicateKey;
                return (
                  <div
                    key={row.id}
                    className={`grid gap-3 rounded border p-3 md:grid-cols-[1fr_1fr_auto] ${
                      hasError ? 'border-destructive' : ''
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <Label>Name</Label>
                      <Input
                        placeholder="Production"
                        value={row.name}
                        onChange={(e) => updateEnvRow(row.id, { name: e.target.value })}
                        required={false}
                      />
                      <div className="min-h-[18px]">
                        {isDuplicateName ? (
                          <div className="text-destructive text-xs">Duplicate environment name.</div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label>Key</Label>
                      <Input
                        placeholder="production"
                        value={row.key}
                        onChange={(e) => updateEnvRow(row.id, { key: e.target.value })}
                        required={false}
                      />
                      <div className="min-h-[18px]">
                        {isDuplicateKey ? (
                          <div className="text-destructive text-xs">Duplicate environment key.</div>
                        ) : null}
                      </div>
                    </div>
                    <div className="self-start md:mt-6">
                      <Button type="button" className="h-10" variant="destructive" onClick={() => removeEnvRow(row.id)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!hasAtLeastOneEnv && (
                <div className="text-destructive text-sm">At least one environment is required.</div>
              )}
              {hasDuplicateNames && <div className="text-destructive text-sm">Environment names must be unique.</div>}
              {hasDuplicateKeys && <div className="text-destructive text-sm">Environment keys must be unique.</div>}
              {hasEmptyKeys && <div className="text-destructive text-sm">All environments must have a key.</div>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              <Sparkles className="mr-1 h-4 w-4" />
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
