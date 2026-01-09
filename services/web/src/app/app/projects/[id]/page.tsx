import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Flag, Server, Plus } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getProjectAction } from '@/server/projects';
import { listEnvironmentsAction } from '@/server/environments';
import { listFlagsAction } from '@/server/flags';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { ProjectActions } from '@/components/project-actions';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/breadcrumb';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  // If no session, return null and let RedirectToSignIn handle the redirect
  if (!session?.user) {
    return null;
  }

  const project = await getProjectAction(id);

  if (!project) {
    notFound();
  }

  const [environments, flags] = await Promise.all([listEnvironmentsAction(id), listFlagsAction(id)]);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/app/projects">Projects</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{project.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground text-sm">Project overview and configuration</p>
        </div>
        <ProjectActions project={project} />
      </div>

      {/* Content Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Feature Flags Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Feature Flags
            </CardTitle>
            <CardDescription>
              {flags.length} {flags.length === 1 ? 'flag' : 'flags'} in this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {flags.length === 0 ? (
              <p className="text-muted-foreground text-sm">No flags yet</p>
            ) : (
              <div className="space-y-2">
                {flags.slice(0, 5).map((flag) => (
                  <div key={flag.id} className="flex items-center justify-between rounded-md border p-2">
                    <div className="flex items-center gap-2">
                      <Flag className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm font-medium">{flag.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {flag.valueType}
                    </Badge>
                  </div>
                ))}
                {flags.length > 5 && (
                  <p className="text-muted-foreground text-center text-xs">
                    +{flags.length - 5} more {flags.length - 5 === 1 ? 'flag' : 'flags'}
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/app/flags?project=${id}`}>View All</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href={`/app/flags/new?project=${id}`}>
                  <Plus className="mr-1 h-4 w-4" />
                  Create Flag
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Environments Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Environments
            </CardTitle>
            <CardDescription>
              {environments.length} {environments.length === 1 ? 'environment' : 'environments'} configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {environments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No environments configured</p>
            ) : (
              <div className="space-y-2">
                {environments.map((env) => (
                  <div key={env.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{env.name}</p>
                      <p className="text-muted-foreground text-sm">
                        <code className="text-xs">{env.key}</code>
                      </p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
