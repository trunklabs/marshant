'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import type { Project, Environment } from '@marcurry/core';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import {
  listEnvironmentsAction,
  createEnvironmentAction,
  updateEnvironmentAction,
  deleteEnvironmentAction,
} from '@/server/environments';
import { slugify } from '@/lib/utils';

interface ManageEnvironmentsDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageEnvironmentsDialog({ project, open, onOpenChange }: ManageEnvironmentsDialogProps) {
  const router = useRouter();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editKeyManuallyEdited, setEditKeyManuallyEdited] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newKeyManuallyEdited, setNewKeyManuallyEdited] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const loadEnvironments = useCallback(async () => {
    try {
      const envs = await listEnvironmentsAction(project.id);
      setEnvironments(envs);
    } catch (error) {
      toast.error('Failed to load environments');
      console.error(error);
    }
  }, [project.id]);

  useEffect(() => {
    if (open) {
      loadEnvironments();
    }
  }, [open, loadEnvironments]);

  const handleAdd = async () => {
    if (!newEnvName.trim() || !newEnvKey.trim()) {
      toast.error('Name and key are required');
      return;
    }

    setLoading(true);
    try {
      await createEnvironmentAction({
        projectId: project.id,
        name: newEnvName.trim(),
        key: newEnvKey.trim(),
      });
      toast.success('Environment created');
      setNewEnvName('');
      setNewEnvKey('');
      setNewKeyManuallyEdited(false);
      setIsAdding(false);
      await loadEnvironments();
      router.refresh();
    } catch (error) {
      toast.error('Failed to create environment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim() || !editKey.trim()) {
      toast.error('Name and key are required');
      return;
    }

    setLoading(true);
    try {
      await updateEnvironmentAction(id, project.id, {
        name: editName.trim(),
        key: editKey.trim(),
      });
      toast.success('Environment updated');
      setEditingId(null);
      await loadEnvironments();
      router.refresh();
    } catch (error) {
      toast.error('Failed to update environment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" environment? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteEnvironmentAction(id, project.id);
      toast.success('Environment deleted');
      await loadEnvironments();
      router.refresh();
    } catch (error) {
      toast.error('Failed to delete environment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (env: Environment) => {
    setEditingId(env.id);
    setEditName(env.name);
    setEditKey(env.key);
    setEditKeyManuallyEdited(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditKey('');
    setEditKeyManuallyEdited(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Environments</DialogTitle>
          <DialogDescription>Add, edit, or remove environments for {project.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {environments.length === 0 && !isAdding ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground text-sm">No environments yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {environments.map((env) => (
                <div key={env.id} className="flex items-center gap-2 rounded-lg border p-3">
                  {editingId === env.id ? (
                    <>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setEditName(newName);
                            // Auto-slugify key if not manually edited
                            if (!editKeyManuallyEdited) {
                              setEditKey(slugify(newName));
                            }
                          }}
                          placeholder="Environment name"
                          disabled={loading}
                        />
                        <Input
                          value={editKey}
                          onChange={(e) => {
                            setEditKey(e.target.value);
                            setEditKeyManuallyEdited(true);
                          }}
                          placeholder="environment-key"
                          disabled={loading}
                        />
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(env.id)} disabled={loading}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancelEdit} disabled={loading}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="font-medium">{env.name}</div>
                        <div className="text-muted-foreground text-sm">
                          <code className="bg-muted rounded px-1 py-0.5">{env.key}</code>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(env)} disabled={loading}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(env.id, env.name)}
                        disabled={loading}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {isAdding ? (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="space-y-2">
                <Label>Environment Name</Label>
                <Input
                  value={newEnvName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setNewEnvName(newName);
                    // Auto-slugify key if not manually edited
                    if (!newKeyManuallyEdited) {
                      setNewEnvKey(slugify(newName));
                    }
                  }}
                  placeholder="Production"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>Environment Key</Label>
                <Input
                  value={newEnvKey}
                  onChange={(e) => {
                    setNewEnvKey(e.target.value);
                    setNewKeyManuallyEdited(true);
                  }}
                  placeholder="production"
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={loading} size="sm">
                  <Check className="mr-1 h-4 w-4" />
                  Add
                </Button>
                <Button
                  onClick={() => {
                    setIsAdding(false);
                    setNewEnvName('');
                    setNewEnvKey('');
                    setNewKeyManuallyEdited(false);
                  }}
                  variant="ghost"
                  disabled={loading}
                  size="sm"
                >
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full" disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              Add Environment
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
