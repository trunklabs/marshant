'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Environment } from '@/lib/db/types';

export function EnvironmentSelector({ environments }: { environments: Environment[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentEnvId = searchParams.get('envId') || '';

  const handleChange = (envId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (envId === 'all') {
      params.delete('envId');
    } else {
      params.set('envId', envId);
    }

    const query = params.toString();
    router.push(query ? `/?${query}` : '/');
    router.refresh();
  };

  if (environments.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-muted-foreground text-sm font-medium">Environment:</label>
        <div className="text-muted-foreground text-sm">No environments</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="environment-select" className="text-sm font-medium">
        Environment:
      </label>
      <Select value={currentEnvId || 'all'} onValueChange={handleChange}>
        <SelectTrigger id="environment-select" className="w-[200px]">
          <SelectValue placeholder="All environments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All environments</SelectItem>
          {environments.map((env) => (
            <SelectItem key={env.id} value={env.id}>
              {env.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
