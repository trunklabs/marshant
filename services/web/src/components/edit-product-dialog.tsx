'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Pencil, Plus, Trash2, X, Key } from 'lucide-react';
import { useToast } from '@/ui/toast';
import { CopyButton } from '@/components/copy-button';
import { updateProjectAction } from '@/server/projects';
import {
  createEnvironmentAction,
  deleteEnvironmentAction,
  updateEnvironmentAction,
  listEnvironmentsAction,
} from '@/server/environments';
import { slugify, parseErrorMessage } from '@/lib/utils';
import type { Project, Environment } from '@marshant/core';
import { updateProjectSchema, type UpdateProjectInput } from '@/schemas/project-schemas';
import {
  createEnvironmentSchema,
  updateEnvironmentSchema,
  type CreateEnvironmentInput,
  type UpdateEnvironmentInput,
} from '@/schemas/environment-schemas';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/ui/form';

export function EditProductDialog({ product }: { product: Project }) {
  const [open, setOpen] = useState(false);
  const [envs, setEnvs] = useState<Environment[] | null>(null);
  const [loadingEnvs, setLoadingEnvs] = useState(false);
  const { showToast } = useToast();

  const projectForm = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
    mode: 'onTouched',
    defaultValues: {
      name: product.name,
    },
  });

  const addEnvForm = useForm<CreateEnvironmentInput>({
    resolver: zodResolver(createEnvironmentSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      key: '',
    },
  });

  const addEnvName = addEnvForm.watch('name');
  const addEnvKey = addEnvForm.watch('key');

  const handleAddEnvNameChange = (name: string) => {
    addEnvForm.setValue('name', name);
    if (addEnvKey === '' || addEnvKey === slugify(addEnvName)) {
      addEnvForm.setValue('key', slugify(name));
    }
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function loadEnvs() {
      setLoadingEnvs(true);
      try {
        const data = await listEnvironmentsAction(product.id);
        if (!cancelled) setEnvs(data);
      } catch {
        showToast('Failed to load environments', 'error');
      } finally {
        if (!cancelled) setLoadingEnvs(false);
      }
    }
    loadEnvs();
    return () => {
      cancelled = true;
    };
  }, [open, product.id, showToast]);

  async function onProjectSubmit(data: UpdateProjectInput) {
    try {
      await updateProjectAction(product.id, data);
      showToast('Project updated');
    } catch (error) {
      showToast(parseErrorMessage(error, 'Failed to update project'), 'error');
      console.error(error);
    }
  }

  async function onAddEnv(data: CreateEnvironmentInput) {
    try {
      await createEnvironmentAction({ projectId: product.id, ...data });
      const updatedEnvs = await listEnvironmentsAction(product.id);
      setEnvs(updatedEnvs);
      addEnvForm.reset();
      showToast('Environment added');
    } catch (error) {
      showToast(parseErrorMessage(error, 'Failed to add environment'), 'error');
    }
  }

  async function removeEnv(id: string) {
    try {
      await deleteEnvironmentAction(id);
      const updatedEnvs = await listEnvironmentsAction(product.id);
      setEnvs(updatedEnvs);
      showToast('Environment removed');
    } catch (error) {
      showToast(parseErrorMessage(error, 'Failed to remove environment'), 'error');
      console.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="mr-1 h-4 w-4" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update project info and manage environments</DialogDescription>
        </DialogHeader>

        <Form {...projectForm}>
          <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-3">
            <FormField
              control={projectForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={projectForm.formState.isSubmitting}>
                {projectForm.formState.isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Environments</div>
              <div className="text-muted-foreground text-xs">Add or edit environments for this project</div>
            </div>
          </div>

          <Form {...addEnvForm}>
            <form
              onSubmit={addEnvForm.handleSubmit(onAddEnv)}
              className="grid gap-3 rounded border p-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <FormField
                control={addEnvForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => handleAddEnvNameChange(e.target.value)}
                        placeholder="Production"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addEnvForm.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="production" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <Button type="submit" disabled={addEnvForm.formState.isSubmitting}>
                  <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
              </div>
            </form>
          </Form>

          <div className="space-y-2">
            {loadingEnvs && <div className="text-muted-foreground text-sm">Loading environments…</div>}
            {!loadingEnvs && (envs?.length ?? 0) === 0 && (
              <div className="text-muted-foreground text-sm">No environments yet.</div>
            )}
            {envs?.map((e) => {
              const isLastEnv = (envs?.length ?? 0) <= 1;
              return (
                <EnvRow
                  key={e.id}
                  env={e}
                  productId={product.id}
                  isLastEnv={isLastEnv}
                  onUpdate={(updatedEnvs) => setEnvs(updatedEnvs)}
                  onRemove={() => removeEnv(e.id)}
                />
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            <X className="mr-1 h-4 w-4" /> Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EnvRow({
  env,
  productId,
  isLastEnv,
  onUpdate,
  onRemove,
}: {
  env: Environment;
  productId: string;
  isLastEnv: boolean;
  onUpdate: (envs: Environment[]) => void;
  onRemove: () => void;
}) {
  const { showToast } = useToast();

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
      await updateEnvironmentAction(env.id, productId, data);
      const updatedEnvs = await listEnvironmentsAction(productId);
      onUpdate(updatedEnvs);
      showToast('Environment updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update environment';
      showToast(message, 'error');
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-3 rounded border p-3 md:grid-cols-[1fr_1fr_auto]"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>Key</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-end gap-2">
          <Button type="submit" variant="outline" disabled={form.formState.isSubmitting}>
            Save
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isLastEnv}
            onClick={onRemove}
            title={isLastEnv ? 'Cannot delete the last environment' : 'Delete environment'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
