'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import type { Project } from '@marcurry/core';

export function ProjectSelector({
  products,
  isEnvironmentPage = false,
}: {
  products: Project[];
  isEnvironmentPage?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentProjectId = searchParams.get('projectId') || '';

  const handleChange = (projectId: string) => {
    const environmentsUrl = '/environments';
    const rootUrl = '/';
    const urlToUse = isEnvironmentPage ? environmentsUrl : rootUrl;

    if (projectId === 'all') {
      router.push(urlToUse);
      return;
    }

    router.push(`${urlToUse}?projectId=${projectId}`);
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="project-select" className="text-sm font-medium">
        Project:
      </label>
      <Select value={currentProjectId || 'all'} onValueChange={handleChange}>
        <SelectTrigger id="project-select" className="w-[200px]">
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {products.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
