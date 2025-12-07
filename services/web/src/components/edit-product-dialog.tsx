'use client';

import { useEffect, useState } from 'react';
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
import { Label } from '@/ui/label';
import { Pencil, Plus, Trash2, X, Key, RefreshCw, Copy, Check } from 'lucide-react';
import { useToast } from '@/ui/toast';
import { updateProjectAction } from '@/app/actions/projects';
import {
  createEnvironmentAction,
  deleteEnvironmentAction,
  updateEnvironmentAction,
  listEnvironmentsAction,
} from '@/app/actions/environments';
import {
  createApiKeyAction,
  deleteApiKeyAction,
  listApiKeysAction,
  rotateApiKeyAction,
  updateApiKeyAction,
} from '@/app/actions/api-keys';
import type { Project, Environment } from '@marcurry/core';
import type { ApiKeyPublic } from '@/lib/services/api-key-service';

export function EditProductDialog({ product }: { product: Project }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [envs, setEnvs] = useState<Environment[] | null>(null);
  const [loadingEnvs, setLoadingEnvs] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyPublic[] | null>(null);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [confirmRotateId, setConfirmRotateId] = useState<string | null>(null);
  const [selectedEnvIds, setSelectedEnvIds] = useState<string[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function loadEnvs() {
      setLoadingEnvs(true);
      try {
        const data = await listEnvironmentsAction(product.id);
        if (!cancelled) setEnvs(data);
      } catch (_e) {
        console.log(_e);
        showToast('Failed to load environments', 'error');
      } finally {
        if (!cancelled) setLoadingEnvs(false);
      }
    }
    async function loadKeys() {
      setLoadingApiKeys(true);
      try {
        const data = await listApiKeysAction(product.id);
        if (!cancelled) setApiKeys(data);
      } catch (_e) {
        console.log(_e);
        showToast('Failed to load API keys', 'error');
      } finally {
        if (!cancelled) setLoadingApiKeys(false);
      }
    }
    loadEnvs();
    loadKeys();
    // Reset state when dialog opens
    setNewSecretKey(null);
    setCopiedKey(false);
    setConfirmRotateId(null);
    setSelectedEnvIds([]);
    return () => {
      cancelled = true;
    };
  }, [open, product.id, showToast]);

  async function saveProduct(formData: FormData) {
    setSaving(true);
    try {
      const id = String(formData.get('id') || '');
      const name = String(formData.get('name') || '').trim();
      await updateProjectAction(id, { name });
      showToast('Project updated');
    } finally {
      setSaving(false);
    }
  }

  async function addEnv(ev: FormData) {
    setSaving(true);
    try {
      const name = String(ev.get('name') || '').trim();
      const key = String(ev.get('key') || '').trim();
      if (name && key) {
        await createEnvironmentAction({ projectId: product.id, name, key });
        // refresh envs
        const data = await listEnvironmentsAction(product.id);
        setEnvs(data);
        showToast('Environment added');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add environment';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function updateEnv(ev: FormData) {
    setSaving(true);
    try {
      const id = String(ev.get('id') || '');
      const name = String(ev.get('name') || '').trim();
      const key = String(ev.get('key') || '').trim();
      const updates: { name?: string; key?: string } = {};
      if (name) updates.name = name;
      if (key) updates.key = key;
      await updateEnvironmentAction(id, product.id, updates);
      const data = await listEnvironmentsAction(product.id);
      setEnvs(data);
      showToast('Environment updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update environment';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function removeEnv(id: string) {
    setSaving(true);
    try {
      await deleteEnvironmentAction(id, product.id);
      const data = await listEnvironmentsAction(product.id);
      setEnvs(data);
      showToast('Environment removed');
    } finally {
      setSaving(false);
    }
  }

  // API Key handlers
  async function addApiKey(formData: FormData) {
    setSaving(true);
    try {
      const name = String(formData.get('apikey-name') || '').trim();
      if (!name) {
        showToast('API key name is required', 'error');
        return;
      }
      const result = await createApiKeyAction({
        projectId: product.id,
        name,
        allowedEnvironmentIds: selectedEnvIds,
      });
      setNewSecretKey(result.secretKey);
      setCopiedKey(false);
      const data = await listApiKeysAction(product.id);
      setApiKeys(data);
      setSelectedEnvIds([]);
      showToast('API key created');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create API key';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function rotateKey(id: string) {
    setSaving(true);
    try {
      const result = await rotateApiKeyAction(id, product.id);
      setNewSecretKey(result.secretKey);
      setCopiedKey(false);
      setConfirmRotateId(null);
      const data = await listApiKeysAction(product.id);
      setApiKeys(data);
      showToast('API key rotated - save your new key now');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rotate API key';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function removeApiKey(id: string) {
    setSaving(true);
    try {
      await deleteApiKeyAction(id, product.id);
      const data = await listApiKeysAction(product.id);
      setApiKeys(data);
      showToast('API key deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete API key';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function updateKeyEnvs(id: string, envIds: string[]) {
    setSaving(true);
    try {
      await updateApiKeyAction(id, product.id, { allowedEnvironmentIds: envIds });
      const data = await listApiKeysAction(product.id);
      setApiKeys(data);
      showToast('API key updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update API key';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  }

  function toggleEnvSelection(envId: string) {
    setSelectedEnvIds((prev) => (prev.includes(envId) ? prev.filter((id) => id !== envId) : [...prev, envId]));
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

        {/* Product info */}
        <form action={saveProduct} className="space-y-3">
          <input type="hidden" name="id" value={product.id} />
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={product.name} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>

        {/* Environments manager */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Environments</div>
              <div className="text-muted-foreground text-xs">Add or edit environments for this project</div>
            </div>
          </div>

          {/* Add environment */}
          <form action={addEnv} className="grid gap-3 rounded border p-3 md:grid-cols-[1fr_1fr_auto]">
            <div className="flex-1 space-y-1">
              <Label htmlFor="new-env-name">Name</Label>
              <Input id="new-env-name" name="name" placeholder="Production" required />
              <div className="min-h-[18px]" />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="new-env-key">Key</Label>
              <Input id="new-env-key" name="key" placeholder="production" required />
              <div className="min-h-[18px]" />
            </div>
            <div className="self-start md:mt-6">
              <Button type="submit" className="h-10" disabled={saving}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
          </form>

          {/* Existing envs */}
          <div className="space-y-2">
            {loadingEnvs && <div className="text-muted-foreground text-sm">Loading environments…</div>}
            {!loadingEnvs && (envs?.length ?? 0) === 0 && (
              <div className="text-muted-foreground text-sm">No environments yet.</div>
            )}
            {envs?.map((e) => {
              const isLastEnv = (envs?.length ?? 0) <= 1;
              return (
                <div key={e.id} className="grid gap-3 rounded border p-3">
                  <form action={updateEnv} className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                    <input type="hidden" name="id" value={e.id} />
                    <div className="flex-1 space-y-1">
                      <Label>Name</Label>
                      <Input name="name" defaultValue={e.name} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label>Key</Label>
                      <Input name="key" defaultValue={e.key} />
                    </div>
                    <div className="self-end">
                      <Button type="submit" className="h-10" variant="outline" disabled={saving}>
                        Save
                      </Button>
                    </div>
                    <div className="self-end">
                      <Button
                        type="button"
                        className="h-10"
                        variant="destructive"
                        disabled={saving || isLastEnv}
                        onClick={() => removeEnv(e.id)}
                        title={isLastEnv ? 'Cannot delete the last environment' : 'Delete environment'}
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </form>
                </div>
              );
            })}
          </div>
        </div>

        {/* API Keys manager */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 font-medium">
                <Key className="h-4 w-4" /> API Keys
              </div>
              <div className="text-muted-foreground text-xs">Manage API keys for SDK access</div>
            </div>
          </div>

          {/* Show newly created/rotated secret key */}
          {newSecretKey && (
            <div className="space-y-2 rounded border border-yellow-500 bg-yellow-50 p-3 dark:bg-yellow-950">
              <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                ⚠️ Save your API key now - it won&#39;t be shown again!
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-yellow-100 px-2 py-1 font-mono text-sm break-all dark:bg-yellow-900">
                  {newSecretKey}
                </code>
                <Button type="button" size="sm" variant="outline" onClick={() => copyToClipboard(newSecretKey)}>
                  {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setNewSecretKey(null)} className="text-xs">
                I&#39;ve saved my key
              </Button>
            </div>
          )}

          {/* Add API key form */}
          <form action={addApiKey} className="space-y-3 rounded border p-3">
            <div className="space-y-1">
              <Label htmlFor="apikey-name">Key Name</Label>
              <Input id="apikey-name" name="apikey-name" placeholder="Production SDK Key" required />
            </div>
            {envs && envs.length > 0 && (
              <div className="space-y-1">
                <Label>Allowed Environments</Label>
                <div className="text-muted-foreground mb-2 text-xs">Select environments this key can access</div>
                <div className="flex flex-wrap gap-2">
                  {envs.map((env) => (
                    <label
                      key={env.id}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded border px-2 py-1 text-sm transition-colors ${
                        selectedEnvIds.includes(env.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedEnvIds.includes(env.id)}
                        onChange={() => toggleEnvSelection(env.id)}
                      />
                      {env.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                <Plus className="mr-1 h-4 w-4" /> Create API Key
              </Button>
            </div>
          </form>

          {/* Existing API keys */}
          <div className="space-y-2">
            {loadingApiKeys && <div className="text-muted-foreground text-sm">Loading API keys…</div>}
            {!loadingApiKeys && (apiKeys?.length ?? 0) === 0 && (
              <div className="text-muted-foreground text-sm">No API keys yet.</div>
            )}
            {apiKeys?.map((key) => (
              <div key={key.id} className="space-y-2 rounded border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{key.name}</div>
                    <div className="text-muted-foreground text-xs">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {confirmRotateId === key.id ? (
                      <>
                        <span className="text-destructive text-sm">Rotate key?</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={saving}
                          onClick={() => rotateKey(key.id)}
                        >
                          Confirm
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmRotateId(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => setConfirmRotateId(key.id)}
                          title="Rotate key (invalidates current key)"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={saving}
                          onClick={() => removeApiKey(key.id)}
                          title="Delete API key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {/* Environment access for this key */}
                {envs && envs.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs">Environment Access:</div>
                    <div className="flex flex-wrap gap-1">
                      {envs.map((env) => {
                        const isAllowed = key.allowedEnvironmentIds.includes(env.id);
                        return (
                          <button
                            key={env.id}
                            type="button"
                            disabled={saving}
                            onClick={() => {
                              const currentIds = key.allowedEnvironmentIds;
                              let newIds: string[];
                              if (currentIds.includes(env.id)) {
                                newIds = currentIds.filter((id) => id !== env.id);
                              } else {
                                newIds = [...currentIds, env.id];
                              }
                              updateKeyEnvs(key.id, newIds);
                            }}
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors ${
                              isAllowed
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {isAllowed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {env.name}
                          </button>
                        );
                      })}
                    </div>
                    {key.allowedEnvironmentIds.length === 0 && (
                      <div className="text-muted-foreground text-xs italic">No environment access configured</div>
                    )}
                  </div>
                )}
              </div>
            ))}
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
