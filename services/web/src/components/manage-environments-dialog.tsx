'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import type { Project, Environment } from '@marshant/core';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Input } from '@/ui/input';
import { KeyDisplay } from '@/components/key-display';
import {
  listEnvironmentsAction,
  createEnvironmentAction,
  updateEnvironmentAction,
  deleteEnvironmentAction,
} from '@/server/environments';
import { slugify, parseErrorMessage } from '@/lib/utils';
import {
  createEnvironmentSchema,
  updateEnvironmentSchema,
  type CreateEnvironmentInput,
  type UpdateEnvironmentInput,
} from '@/schemas/environment-schemas';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/ui/form';

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

  const addForm = useForm<CreateEnvironmentInput>({
    resolver: zodResolver(createEnvironmentSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      key: '',
    },
  });

  const addName = addForm.watch('name');
  const addKey = addForm.watch('key');

  const handleAddNameChange = (name: string) => {
    addForm.setValue('name', name);
    if (addKey === '' || addKey === slugify(addName)) {
      addForm.setValue('key', slugify(name));
    }
  };

  async function onAdd(data: CreateEnvironmentInput) {
    setLoading(true);
    try {
      await createEnvironmentAction({
        projectId: project.id,
        ...data,
      });
      toast.success('Environment created');
      addForm.reset();
      setIsAdding(false);
      await loadEnvironments();
      router.refresh();
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to create environment'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete the "${name}" environment? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteEnvironmentAction(id);
      toast.success('Environment deleted');
      await loadEnvironments();
      router.refresh();
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to delete environment'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

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
                <EnvRow
                  key={env.id}
                  env={env}
                  projectId={project.id}
                  loading={loading}
                  editingId={editingId}
                  onStartEdit={(id) => setEditingId(id)}
                  onCancelEdit={() => setEditingId(null)}
                  onUpdate={async () => {
                    await loadEnvironments();
                    setEditingId(null);
                    router.refresh();
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {isAdding ? (
            <div className="space-y-3 rounded-lg border p-4">
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-3">
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Environment Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => handleAddNameChange(e.target.value)}
                            placeholder="Production"
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Environment Key</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="production" disabled={loading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} size="sm">
                      <Check className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        addForm.reset();
                      }}
                      variant="ghost"
                      disabled={loading}
                      size="sm"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
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

function EnvRow({
  env,
  projectId,
  loading,
  editingId,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
}: {
  env: Environment;
  projectId: string;
  loading: boolean;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onUpdate: () => Promise<void>;
  onDelete: (id: string, name: string) => void;
}) {
  const isEditing = editingId === env.id;

  const form = useForm<UpdateEnvironmentInput>({
    resolver: zodResolver(updateEnvironmentSchema),
    mode: 'onTouched',
    defaultValues: {
      name: env.name,
      key: env.key,
    },
  });

  async function onSubmit(data: UpdateEnvironmentInput) {
    try {
      await updateEnvironmentAction(env.id, projectId, data);
      toast.success('Environment updated');
      await onUpdate();
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to update environment'));
      console.error(error);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border p-3">
      {isEditing ? (
        <>
          <div className="flex-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Environment name" disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="environment-key" disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" variant="outline" disabled={loading}>
                    <Check className="mr-1 h-4 w-4" />
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit} disabled={loading}>
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 space-y-2">
            <div className="font-medium">{env.name}</div>
            <KeyDisplay value={env.key} />
          </div>
          <Button size="icon" variant="ghost" onClick={() => onStartEdit(env.id)} disabled={loading}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(env.id, env.name)} disabled={loading}>
            <Trash2 className="text-destructive h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
