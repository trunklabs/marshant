import { headers } from 'next/headers';
import { FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { listProjectsAction } from '@/server/projects';
import { listEnvironmentsAction } from '@/server/environments';
import { listFlagsAction } from '@/server/flags';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { ProjectActions } from '@/components/project-actions';
import { KeyDisplay } from '@/components/key-display';
import type { Project, Environment } from '@marshant/core';

export default async function ProjectsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // If no session, return null and let RedirectToSignIn handle the redirect
  if (!session?.user) {
    return null;
  }

  const projects = await listProjectsAction();

  // Fetch environments and flags for each project
  const projectsWithData: Array<{ project: Project; environments: Environment[]; flagCount: number }> = [];
  for (const project of projects) {
    const [environments, flags] = await Promise.all([listEnvironmentsAction(project.id), listFlagsAction(project.id)]);
    projectsWithData.push({ project, environments, flagCount: flags.length });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your feature flag projects</p>
        </div>
        {projects.length > 0 && (
          <Button asChild>
            <Link href="/app/projects/new">Create Project</Link>
          </Button>
        )}
      </div>

      {/* Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <FolderKanban className="text-muted-foreground/50 mb-4 h-12 w-12" />
          <h3 className="text-lg font-medium">No projects yet</h3>
          <p className="text-muted-foreground mt-1 mb-4 max-w-sm">
            Projects organize your feature flags. Create your first project to get started.
          </p>
          <Button asChild>
            <Link href="/app/projects/new">Create Project</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projectsWithData.map(({ project, environments, flagCount }) => (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <CardTitle>{project.name}</CardTitle>
                    <KeyDisplay value={project.key} />
                    <CardDescription>
                      {flagCount} {flagCount === 1 ? 'flag' : 'flags'} · {environments.length}{' '}
                      {environments.length === 1 ? 'environment' : 'environments'}
                    </CardDescription>
                  </div>
                  <ProjectActions project={project} />
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex flex-wrap gap-1">
                  {environments.map((env) => (
                    <Badge key={env.id} variant="secondary">
                      {env.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/app/projects/${project.id}`}>View Project</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
