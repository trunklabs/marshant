'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/button';
import { Card, CardContent } from '@/ui/card';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Trash2 } from 'lucide-react';
import { createProjectAction } from '@/server/projects';
import { toast } from 'sonner';
import { slugify } from '@/lib/utils';

interface Environment {
  id: string;
  name: string;
  key: string;
}

export function CreateProjectForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [environments, setEnvironments] = useState<Environment[]>([
    { id: crypto.randomUUID(), name: 'Production', key: 'production' },
    { id: crypto.randomUUID(), name: 'Staging', key: 'staging' },
  ]);

  const updateEnvironment = (id: string, field: 'name' | 'key', value: string) => {
    setEnvironments((envs) =>
      envs.map((env) => {
        if (env.id !== id) return env;
        const updated = { ...env, [field]: value };
        // Auto-slugify key from name if name changed and key is empty or matches old slugified name
        if (field === 'name' && (env.key === '' || env.key === slugify(env.name))) {
          updated.key = slugify(value);
        }
        return updated;
      })
    );
  };

  const addEnvironment = () => {
    setEnvironments((envs) => [...envs, { id: crypto.randomUUID(), name: '', key: '' }]);
  };

  const removeEnvironment = (id: string) => {
    if (environments.length === 1) return;
    setEnvironments((envs) => envs.filter((env) => env.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const name = projectName.trim();
      if (!name) {
        toast.error('Project name is required');
        return;
      }

      const envs = environments.map((e) => ({ name: e.name.trim(), key: e.key.trim() })).filter((e) => e.name);
      if (envs.length === 0) {
        toast.error('At least one environment is required');
        return;
      }

      const lowerNames = envs.map((e) => e.name.toLowerCase());
      if (new Set(lowerNames).size !== lowerNames.length) {
        toast.error('Environment names must be unique');
        return;
      }

      const lowerKeys = envs.map((e) => e.key.toLowerCase());
      if (new Set(lowerKeys).size !== lowerKeys.length) {
        toast.error('Environment keys must be unique');
        return;
      }

      if (envs.some((e) => !e.key)) {
        toast.error('All environments must have a key');
        return;
      }

      const project = await createProjectAction({ name, environments: envs });
      toast.success('Project created successfully');
      router.push(`/app/projects/${project.id}`);
    } catch (error) {
      toast.error('Failed to create project');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome Project"
              required
            />
          </div>

          {/* Environments */}
          <div className="space-y-4">
            <div>
              <Label>Initial Environments</Label>
              <p className="text-muted-foreground text-sm">Every project needs at least one environment.</p>
            </div>

            <div className="space-y-3">
              {environments.map((env) => (
                <div key={env.id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="grid flex-1 grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={env.name}
                        onChange={(e) => updateEnvironment(env.id, 'name', e.target.value)}
                        placeholder="Production"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Key</Label>
                      <Input
                        value={env.key}
                        onChange={(e) => updateEnvironment(env.id, 'key', e.target.value)}
                        placeholder="production"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEnvironment(env.id)}
                    disabled={environments.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={addEnvironment}>
              Add Environment
            </Button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
