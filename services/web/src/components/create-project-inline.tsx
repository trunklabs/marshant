'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
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
import { Plus, X, Sparkles, PlusCircle, Trash2 } from 'lucide-react';
import { createProjectAction } from '@/server/projects';
import { useToast } from '@/ui/toast';
import { slugify, parseErrorMessage } from '@/lib/utils';
import { createProjectSchema, type CreateProjectInput } from '@/schemas/project-schemas';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/ui/form';

interface CreateProjectInlineProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateProjectInline({ trigger, open: controlledOpen, onOpenChange }: CreateProjectInlineProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const { showToast } = useToast();

  const form = useForm({
    resolver: standardSchemaResolver(createProjectSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      key: '',
      environments: [{ name: '', key: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'environments',
  });

  const projectName = form.watch('name');
  const projectKey = form.watch('key');

  const handleProjectNameChange = (value: string) => {
    form.setValue('name', value);
    if (projectKey === '' || projectKey === slugify(projectName)) {
      form.setValue('key', slugify(value));
    }
  };

  const handleEnvironmentNameChange = (index: number, value: string) => {
    const currentEnvName = form.getValues(`environments.${index}.name`);
    const currentEnvKey = form.getValues(`environments.${index}.key`);
    form.setValue(`environments.${index}.name`, value);
    if (currentEnvKey === '' || currentEnvKey === slugify(currentEnvName)) {
      form.setValue(`environments.${index}.key`, slugify(value));
    }
  };

  async function onSubmit(data: CreateProjectInput) {
    try {
      await createProjectAction(data);
      setOpen(false);
      showToast('Project created successfully');
      form.reset();
    } catch (error) {
      showToast(parseErrorMessage(error, 'Failed to create project'), 'error');
      console.error(error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          form.reset();
        }
      }}
    >
      {(trigger || controlledOpen === undefined) && (
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              New Project
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>Add a new project and define at least one environment</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => handleProjectNameChange(e.target.value)}
                        placeholder="My Project"
                      />
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
                    <FormLabel>Project Key</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="my-project" />
                    </FormControl>
                    <FormDescription>Used in the SDK</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Environments</FormLabel>
                <Button type="button" size="sm" variant="outline" onClick={() => append({ name: '', key: '' })}>
                  <PlusCircle className="mr-1 h-4 w-4" /> Add Environment
                </Button>
              </div>
              {form.formState.errors.environments?.root && (
                <p className="text-destructive text-sm font-medium">
                  {form.formState.errors.environments.root.message}
                </p>
              )}
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded border p-3 md:grid-cols-[1fr_1fr_auto]">
                    <FormField
                      control={form.control}
                      name={`environments.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => handleEnvironmentNameChange(index, e.target.value)}
                              placeholder="Production"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`environments.${index}.key`}
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
                    <div className="self-start md:mt-6">
                      <Button type="button" className="h-10" variant="destructive" onClick={() => remove(index)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <Sparkles className="mr-1 h-4 w-4" />
                {form.formState.isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
