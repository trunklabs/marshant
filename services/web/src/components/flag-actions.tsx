'use client';

import { useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Flag } from '@marcurry/core';
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

interface FlagActionsProps {
  flag: Flag;
}

export function FlagActions({ flag }: FlagActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [flagName, setFlagName] = useState(flag.name);

  const handleEdit = async () => {
    if (!flagName.trim()) {
      toast.error('Flag name is required');
      return;
    }

    setIsLoading(true);
    try {
      await updateFlagAction(flag.id, flag.projectId, { name: flagName });
      toast.success('Flag updated successfully');
      setEditOpen(false);
      router.refresh();
    } catch (error) {
      toast.error('Failed to update flag');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteFlagAction(flag.id, flag.projectId);
      toast.success('Flag deleted successfully');
      setDeleteOpen(false);
      router.push(`/app/flags?project=${flag.projectId}`);
    } catch (error) {
      toast.error('Failed to delete flag');
      console.error(error);
    } finally {
      setIsLoading(false);
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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Flag Name</Label>
              <Input
                id="name"
                value={flagName}
                onChange={(e) => setFlagName(e.target.value)}
                placeholder="Enter flag name"
              />
            </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
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
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete Flag'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
