'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/button';
import { Card, CardContent } from '@/ui/card';
import { Input } from '@/ui/input';
import { Textarea } from '@/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { RadioGroup, RadioGroupItem } from '@/ui/radio-group';
import { createFlagAction, createFlagConfigAction } from '@/server/flags';
import { listEnvironmentsAction } from '@/server/environments';
import { toast } from 'sonner';
import { slugify, parseErrorMessage } from '@/lib/utils';
import type { Project, FlagValueType, FlagValueTypeMap } from '@marshant/core';
import { createFlagSchema, type CreateFlagInput } from '@/schemas/flag-schemas';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/ui/form';

interface CreateFlagFormProps {
  projects: Project[];
  preselectedProjectId?: string;
}

export function CreateFlagForm({ projects, preselectedProjectId }: CreateFlagFormProps) {
  const router = useRouter();

  const form = useForm<CreateFlagInput>({
    resolver: zodResolver(createFlagSchema),
    mode: 'onTouched',
    defaultValues: {
      projectId: preselectedProjectId || projects[0]?.id || '',
      name: '',
      key: '',
      description: '',
      valueType: 'boolean',
      defaultValue: 'false',
    },
  });

  const valueType = form.watch('valueType');
  const name = form.watch('name');
  const key = form.watch('key');

  const handleNameChange = (value: string) => {
    form.setValue('name', value);
    if (key === '' || key === slugify(name)) {
      form.setValue('key', slugify(value));
    }
  };

  const handleTypeChange = (type: FlagValueType) => {
    form.setValue('valueType', type);
    switch (type) {
      case 'boolean':
        form.setValue('defaultValue', 'false');
        break;
      case 'string':
        form.setValue('defaultValue', '');
        break;
      case 'number':
        form.setValue('defaultValue', '0');
        break;
      case 'json':
        form.setValue('defaultValue', '{}');
        break;
    }
  };

  async function onSubmit(data: CreateFlagInput) {
    try {
      let parsedDefaultValue: boolean | string | number | object = data.defaultValue;
      switch (data.valueType) {
        case 'boolean':
          parsedDefaultValue = data.defaultValue === 'true';
          break;
        case 'string':
          parsedDefaultValue = data.defaultValue;
          break;
        case 'number':
          parsedDefaultValue = parseFloat(data.defaultValue);
          break;
        case 'json':
          parsedDefaultValue = JSON.parse(data.defaultValue);
          break;
      }

      const flag = await createFlagAction({
        projectId: data.projectId,
        key: data.key,
        name: data.name,
        valueType: data.valueType,
        defaultValue: parsedDefaultValue as FlagValueTypeMap[FlagValueType],
      });

      const environments = await listEnvironmentsAction(data.projectId);

      await Promise.all(
        environments.map((env) =>
          createFlagConfigAction({
            flagId: flag.id,
            environmentId: env.id,
            projectId: data.projectId,
            enabled: false,
            defaultValue: parsedDefaultValue as FlagValueTypeMap[FlagValueType],
            gates: [],
          })
        )
      );

      toast.success('Flag created successfully');
      router.push(`/app/flags?project=${data.projectId}`);
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to create flag'));
      console.error(error);
    }
  }

  const renderDefaultValueInput = () => {
    switch (valueType) {
      case 'boolean':
        return (
          <FormField
            control={form.control}
            name="defaultValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Value *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Value returned when no targeting rules match.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'string':
        return (
          <FormField
            control={form.control}
            name="defaultValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Value *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter default string value" />
                </FormControl>
                <FormDescription>Value returned when no targeting rules match.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'number':
        return (
          <FormField
            control={form.control}
            name="defaultValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Value *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="0" />
                </FormControl>
                <FormDescription>Value returned when no targeting rules match.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'json':
        return (
          <FormField
            control={form.control}
            name="defaultValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Value *</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder='{"key": "value"}' className="font-mono text-sm" rows={4} />
                </FormControl>
                <FormDescription>Value returned when no targeting rules match.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!!preselectedProjectId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flag Name *</FormLabel>
                  <FormControl>
                    <Input {...field} onChange={(e) => handleNameChange(e.target.value)} placeholder="Dark Mode" />
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
                  <FormLabel>Flag Key *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="dark-mode" />
                  </FormControl>
                  <FormDescription>Unique identifier used in code. Auto-generated from name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enable dark mode theme for users" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valueType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flag Type *</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={(v: string) => handleTypeChange(v as FlagValueType)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="boolean" id="type-boolean" />
                        <FormLabel htmlFor="type-boolean" className="font-normal">
                          Boolean
                        </FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="string" id="type-string" />
                        <FormLabel htmlFor="type-string" className="font-normal">
                          String
                        </FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="number" id="type-number" />
                        <FormLabel htmlFor="type-number" className="font-normal">
                          Number
                        </FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="json" id="type-json" />
                        <FormLabel htmlFor="type-json" className="font-normal">
                          JSON
                        </FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renderDefaultValueInput()}

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
                {form.formState.isSubmitting ? 'Creating...' : 'Create Flag'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
