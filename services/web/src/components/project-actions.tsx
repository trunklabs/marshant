'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreVertical, Pencil, Trash2, Settings, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Project } from '@marshant/core';
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { updateProjectAction, deleteProjectAction } from '@/server/projects';
import { ManageEnvironmentsDialog } from '@/components/manage-environments-dialog';
import { updateProjectSchema, type UpdateProjectInput } from '@/schemas/project-schemas';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/ui/form';
import { parseErrorMessage } from '@/lib/utils';

interface ProjectActionsProps {
  project: Project;
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [environmentsOpen, setEnvironmentsOpen] = useState(false);

  const form = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
    mode: 'onTouched',
    defaultValues: {
      name: project.name,
    },
  });

  const handleEdit = async (data: UpdateProjectInput) => {
    try {
      await updateProjectAction(project.id, data);
      toast.success('Project updated successfully');
      setEditOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to update project'));
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProjectAction(project.id);
      toast.success('Project deleted successfully');
      setDeleteOpen(false);
      router.push('/app/projects');
    } catch (error) {
      toast.error(parseErrorMessage(error, 'Failed to delete project'));
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
            Edit Project
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEnvironmentsOpen(true)}>
            <Layers className="mr-2 h-4 w-4" />
            Manage Environments
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/app/flags?projectId=${project.id}`)}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Flags
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ManageEnvironmentsDialog project={project} open={environmentsOpen} onOpenChange={setEnvironmentsOpen} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project name and settings.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter project name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              This will permanently delete the project &ldquo;{project.name}&rdquo; and all its associated feature flags
              and environments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
