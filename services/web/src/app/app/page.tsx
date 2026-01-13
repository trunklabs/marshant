import { headers } from 'next/headers';
import { Flag, Folder, ChevronRight, FolderKanban, Server } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { listProjectsAction } from '@/server/projects';
import { listEnvironmentsAction } from '@/server/environments';
import { listFlagsAction } from '@/server/flags';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import type { Project, Environment } from '@marshant/core';

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // If no session, return null and let RedirectToSignIn handle the redirect
  if (!session?.user) {
    return null;
  }

  const organizations = await auth.api.listOrganizations({ headers: await headers() });
  const activeOrgId = session.session?.activeOrganizationId;
  const user = session.user;

  // Determine context name: organization name or "Personal Account"
  const contextName = activeOrgId
    ? organizations.find((org) => org.id === activeOrgId)?.name || 'your workspace'
    : 'Personal Account';

  const projects = await listProjectsAction();

  // Calculate statistics and get project data
  let totalFlags = 0;
  let totalEnvironments = 0;
  const projectsWithData: Array<{ project: Project; environments: Environment[]; flagCount: number }> = [];

  for (const project of projects) {
    const [flags, environments] = await Promise.all([listFlagsAction(project.id), listEnvironmentsAction(project.id)]);
    totalFlags += flags.length;
    totalEnvironments += environments.length;
    projectsWithData.push({ project, environments, flagCount: flags.length });
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back{user?.name ? `, ${user.name}` : ''}</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening in {contextName}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderKanban className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Feature Flags</CardTitle>
            <Flag className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFlags}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Environments</CardTitle>
            <Server className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnvironments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Your recently updated projects</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="py-8 text-center">
                <FolderKanban className="text-muted-foreground/50 mx-auto mb-2 h-8 w-8" />
                <p className="text-muted-foreground">No projects yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projectsWithData.slice(0, 5).map(({ project, environments, flagCount }) => (
                  <Link
                    key={project.id}
                    href={`/app/projects/${project.id}`}
                    className="hover:bg-muted -mx-2 flex items-center justify-between rounded-md p-2 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {flagCount} {flagCount === 1 ? 'flag' : 'flags'} · {environments.length}{' '}
                        {environments.length === 1 ? 'environment' : 'environments'}
                      </p>
                    </div>
                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
          {projects.length > 0 && (
            <CardFooter>
              <Button variant="ghost" asChild className="w-full">
                <Link href="/app/projects">View all projects</Link>
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/app/projects/new">
                <Folder className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start" disabled={projects.length === 0}>
              <Link href="/app/flags/new">
                <Flag className="mr-2 h-4 w-4" />
                Create Flag
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/app/projects">
                <FolderKanban className="mr-2 h-4 w-4" />
                View All Projects
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/app/flags">
                <Flag className="mr-2 h-4 w-4" />
                View All Flags
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
