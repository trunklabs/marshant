'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, Trash2 } from 'lucide-react';
import { GatesEditor } from '@/components/gates-editor';
import { deleteFeature, updateFeature } from '@/app/actions/featureActions';
import { useToast } from '@/components/ui/toast';
import type { FeatureFlag } from '@/lib/db/types';

export function EditFeatureForm({ feature }: { feature: FeatureFlag }) {
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [enabled, setEnabled] = useState(feature.enabled);
  const { showToast } = useToast();

  async function handleUpdate(formData: FormData) {
    setSubmitting(true);
    try {
      await updateFeature(formData);
      showToast('Feature updated successfully');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteFeature(feature.id);
      showToast('Feature deleted successfully');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <form action={handleUpdate} className="max-w-xl space-y-4">
        <input type="hidden" name="id" value={feature.id} />

        <div className="space-y-2">
          <Label htmlFor="label">Label</Label>
          <Input id="label" name="label" defaultValue={feature.label} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={feature.description ?? ''} />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="enabled">Enabled</Label>
          <Switch id="enabled" name="enabled" checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && <GatesEditor initialGates={feature.gates || []} />}

        <Button type="submit" disabled={submitting}>
          <Save className="mr-1 h-4 w-4" />
          {submitting ? 'Saving...' : 'Save'}
        </Button>
      </form>

      <div className="mt-4">
        <form action={handleDelete}>
          <Button type="submit" variant="destructive" disabled={deleting}>
            <Trash2 className="mr-1 h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete Feature'}
          </Button>
        </form>
      </div>
    </>
  );
}
