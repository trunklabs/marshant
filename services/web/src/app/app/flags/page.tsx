import { Flag, FolderKanban, Search } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { listProjectsAction } from '@/server/projects';
import { listEnvironmentsAction } from '@/server/environments';
import { listFlagsAction, listFlagConfigsAction } from '@/server/flags';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { FlagsTable } from '@/components/flags-table';
import { FlagsFilters } from '@/components/flags-filters';
import type { Project, Environment, Flag as CoreFlag, FlagEnvironmentConfig } from '@marcurry/core';

export default async function FeatureFlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; q?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  // If no session, return null and let RedirectToSignIn handle the redirect
  if (!session?.user) {
    return null;
  }

  const params = await searchParams;
  const projectFilter = params.project;
  const searchQuery = params.q?.toLowerCase() || '';

  const projects: Project[] = await listProjectsAction();

  // If no projects exist, show empty state
  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
            <p className="text-muted-foreground">Manage feature flags across your projects</p>
          </div>
        </div>

        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <FolderKanban className="text-muted-foreground/50 mb-4 h-12 w-12" />
          <h3 className="text-lg font-medium">Create a project first</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            You need at least one project before you can create feature flags.
          </p>
          <Button asChild>
            <Link href="/app/projects/new">Create Project</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Collect all flags from all projects or filtered project
  interface FlagWithProject extends CoreFlag {
    project: Project;
    configs: FlagEnvironmentConfig[];
    environments: Environment[];
  }

  const allFlags: FlagWithProject[] = [];

  const projectsToFetch = projectFilter ? projects.filter((p) => p.id === projectFilter) : projects;

  for (const project of projectsToFetch) {
    const [flags, environments] = await Promise.all([listFlagsAction(project.id), listEnvironmentsAction(project.id)]);

    // Add flags with their configs and environments
    for (const flag of flags) {
      const configs = await listFlagConfigsAction(flag.id);
      allFlags.push({ ...flag, project, configs, environments });
    }
  }

  // Filter flags by search query
  const filteredFlags = searchQuery
    ? allFlags.filter(
        (flag) =>
          flag.name.toLowerCase().includes(searchQuery) ||
          flag.key.toLowerCase().includes(searchQuery) ||
          flag.project.name.toLowerCase().includes(searchQuery)
      )
    : allFlags;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
          <p className="text-muted-foreground">Manage feature flags across your projects</p>
        </div>
        <Button asChild>
          <Link href="/app/flags/new">Create Flag</Link>
        </Button>
      </div>

      {/* Filters */}
      <FlagsFilters projects={projects} currentProject={projectFilter} currentSearch={searchQuery} />

      {/* Flags Table or Empty State */}
      {filteredFlags.length === 0 ? (
        searchQuery ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="text-muted-foreground/50 mb-4 h-12 w-12" />
            <h3 className="text-lg font-medium">No flags found</h3>
            <p className="text-muted-foreground mt-1">
              No flags match &quot;{searchQuery}&quot;. Try a different search.
            </p>
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <Flag className="text-muted-foreground/50 mb-4 h-12 w-12" />
            <h3 className="text-lg font-medium">No flags yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Create your first feature flag to start controlling features.
            </p>
            <Button asChild>
              <Link href="/app/flags/new">Create Flag</Link>
            </Button>
          </Card>
        )
      ) : (
        <FlagsTable flags={filteredFlags} showProject={!projectFilter} />
      )}
    </div>
  );
}
