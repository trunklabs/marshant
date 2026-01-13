'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import type { Project } from '@marshant/core';

interface FlagsFiltersProps {
  projects: Project[];
  currentProject?: string;
}

export function FlagsFilters({ projects, currentProject }: FlagsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleProjectChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('project');
    } else {
      params.set('project', value);
    }
    router.push(`/app/flags?${params.toString()}`);
  };

  return (
    <Select value={currentProject || 'all'} onValueChange={handleProjectChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="All Projects" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Projects</SelectItem>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
