'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/button';
import { Card, CardContent } from '@/ui/card';
import { Input } from '@/ui/input';
import { Trash2 } from 'lucide-react';
import { createProjectAction } from '@/server/projects';
import { toast } from 'sonner';
import { slugify, parseErrorMessage } from '@/lib/utils';
import { createProjectSchema, type CreateProjectInput } from '@/schemas/project-schemas';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/ui/form';

export function CreateProjectForm() {
  const router = useRouter();

  const form = useForm({
    resolver: standardSchemaResolver(createProjectSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      key: '',
      environments: [
        { name: 'Production', key: 'production' },
        { name: 'Staging', key: 'staging' },
      ],
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
      const project = await createProjectAction(data);
      toast.success('Project created successfully');
      router.push(`/app/projects/${project.id}`);
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to create project'));
      console.error(error);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 items-start gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => handleProjectNameChange(e.target.value)}
                        placeholder="My Awesome Project"
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
                    <FormLabel>Project Key *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="my-awesome-project" />
                    </FormControl>
                    <FormDescription>Used in the SDK to identify this project</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <FormLabel>Initial Environments</FormLabel>
                <FormDescription>Every project needs at least one environment.</FormDescription>
                {form.formState.errors.environments?.root && (
                  <p className="text-destructive text-sm font-medium">
                    {form.formState.errors.environments.root.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="grid flex-1 grid-cols-2 gap-4">
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
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" onClick={() => append({ name: '', key: '' })}>
                Add Environment
              </Button>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
