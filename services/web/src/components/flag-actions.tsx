'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Flag } from '@marshant/core';
import { Button } from '@/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/alert-dialog';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { updateFlagAction, deleteFlagAction } from '@/server/flags';
import { updateFlagSchema, type UpdateFlagInput } from '@/schemas/flag-schemas';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/ui/form';
import { parseErrorMessage } from '@/lib/utils';

interface FlagActionsProps {
  flag: Flag;
}

export function FlagActions({ flag }: FlagActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const form = useForm({
    resolver: standardSchemaResolver(updateFlagSchema),
    mode: 'onTouched',
    defaultValues: {
      name: flag.name,
    },
  });

  const handleEdit = async (data: UpdateFlagInput) => {
    try {
      await updateFlagAction(flag.id, flag.projectId, data);
      toast.success('Flag updated successfully');
      setEditOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to update flag'));
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFlagAction(flag.id);
      toast.success('Flag deleted successfully');
      setDeleteOpen(false);
      router.push(`/app/flags?project=${flag.projectId}`);
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to delete flag'));
      console.error(error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Flag
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Flag
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Flag</DialogTitle>
            <DialogDescription>Update the flag name and metadata.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flag Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter flag name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label htmlFor="key">Flag Key</Label>
                <Input id="key" value={flag.key} disabled className="bg-muted" />
                <p className="text-muted-foreground text-xs">Key cannot be changed after creation</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Flag Type</Label>
                <Input id="type" value={flag.valueType} disabled className="bg-muted" />
                <p className="text-muted-foreground text-xs">Type cannot be changed after creation</p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the flag &ldquo;{flag.name}&rdquo; and all its configurations across all
              environments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Flag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
