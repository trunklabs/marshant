'use client';

import { useState } from 'react';
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
import { Plus, X, Sparkles } from 'lucide-react';
import { useToast } from '@/ui/toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import type { Project, FlagValueType, FlagValueTypeMap } from '@marshant/core';
import { createFlagAction } from '@/server/flags';
import { slugify, parseErrorMessage } from '@/lib/utils';
import { createFlagSchema, type CreateFlagInput } from '@/schemas/flag-schemas';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/ui/form';

export function CreateFlagInline(props: { projectId?: string; envId?: string; products?: Project[] }) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const canPickProject = !props.projectId;
  const projectOptions = props.products ?? [];

  const form = useForm<CreateFlagInput>({
    resolver: zodResolver(createFlagSchema),
    mode: 'onTouched',
    defaultValues: {
      projectId: props.projectId || '',
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

  const handleNameChange = (newName: string) => {
    form.setValue('name', newName);
    if (key === '' || key === slugify(name)) {
      form.setValue('key', slugify(newName));
    }
  };

  const handleValueTypeChange = (newType: FlagValueType) => {
    form.setValue('valueType', newType);
    switch (newType) {
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
      const pid = props.projectId || data.projectId;
      if (!pid) {
        showToast('Please select a project', 'error');
        return;
      }

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

      await createFlagAction({
        projectId: pid,
        key: data.key,
        name: data.name,
        valueType: data.valueType,
        defaultValue: parsedDefaultValue as FlagValueTypeMap[FlagValueType],
      });

      setOpen(false);
      showToast('Flag created successfully');
      form.reset();
      if (pid) router.push(`/app?projectId=${pid}`);
    } catch (error) {
      showToast(parseErrorMessage(error, 'Failed to create flag'), 'error');
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
                <FormLabel>Default Value</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
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
                <FormLabel>Default Value</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter string value" />
                </FormControl>
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
                <FormLabel>Default Value</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="0" />
                </FormControl>
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
                <FormLabel>Default Value</FormLabel>
                <FormControl>
                  <Input {...field} placeholder='{"key": "value"}' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
    }
  };

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
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Flag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Create Flag</DialogTitle>
              <DialogDescription>Create a new project-scoped flag</DialogDescription>
            </DialogHeader>

            {canPickProject && (
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectOptions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} onChange={(e) => handleNameChange(e.target.value)} placeholder="My Flag" />
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
                    <Input {...field} placeholder="my-flag" />
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
                  <FormLabel>Value Type</FormLabel>
                  <Select value={field.value} onValueChange={(v) => handleValueTypeChange(v as FlagValueType)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renderDefaultValueInput()}

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
