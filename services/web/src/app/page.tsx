import { Flag } from 'lucide-react';
import { ProjectSelector } from '@/components/project-selector';
import { CreateProjectInline } from '@/components/create-project-inline';
import { Suspense } from 'react';
import { Badge } from '@/ui/badge';
import { CreateFlagInline } from '@/components/create-flag-inline';
import { FlagEnvMatrix } from '@/components/flag-env-matrix';
import { listProjectsAction, listEnvironmentsAction, listFlagsAction, listFlagConfigsAction } from '@/app/actions';
import type { Project, Environment, Flag as CoreFlag, FlagEnvironmentConfig } from '@marcurry/core';

export default async function FeatureFlags({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; envId?: string }>;
}) {
  const params = await searchParams;
  const projectId = params.projectId;

  const products: Project[] = await listProjectsAction();

  let totalFlagsCount = 0;
  let scoped: null | {
    environments: Environment[];
    flags: CoreFlag[];
    cfgsByFlag: Record<string, FlagEnvironmentConfig[]>;
  } = null;
  let grouped: null | Array<{
    projectId: string;
    projectName: string;
    environments: Environment[];
    flags: CoreFlag[];
    cfgsByFlag: Record<string, FlagEnvironmentConfig[]>;
  }> = null;

  if (projectId) {
    const [environments, flags] = await Promise.all([listEnvironmentsAction(projectId), listFlagsAction(projectId)]);
    totalFlagsCount = flags.length;
    const cfgsByFlag: Record<string, FlagEnvironmentConfig[]> = {};
    for (const fl of flags) {
      cfgsByFlag[fl.id] = await listFlagConfigsAction(fl.id);
    }
    scoped = { environments, flags, cfgsByFlag };
  } else {
    grouped = [];
    for (const p of products) {
      const [environments, flags] = await Promise.all([listEnvironmentsAction(p.id), listFlagsAction(p.id)]);
      totalFlagsCount += flags.length;
      const cfgsByFlag: Record<string, FlagEnvironmentConfig[]> = {};
      for (const fl of flags) {
        cfgsByFlag[fl.id] = await listFlagConfigsAction(fl.id);
      }
      grouped.push({ projectId: p.id, projectName: p.name, environments, flags, cfgsByFlag });
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex min-h-12 items-center justify-between">
        <div>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-muted-foreground">Overview of your feature flag management</p>
            {products.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalFlagsCount} {totalFlagsCount === 1 ? 'flag' : 'flags'}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Suspense fallback={<div className="bg-muted h-10 w-[200px] animate-pulse rounded" />}>
            <ProjectSelector products={products} />
          </Suspense>
          {products.length > 0 ? (
            projectId ? (
              <CreateFlagInline projectId={projectId} />
            ) : (
              <CreateFlagInline products={products} />
            )
          ) : (
            <CreateProjectInline />
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="border-muted-foreground/25 flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <Flag className="text-muted-foreground/50 mb-4 h-12 w-12" />
          <h2 className="mb-2 text-xl font-semibold">No Projects Yet</h2>
          <p className="text-muted-foreground mb-4">Get started by creating your first project</p>
          <CreateProjectInline />
        </div>
      ) : projectId && scoped ? (
        <div className="space-y-6">
          {scoped.flags.length === 0 ? (
            <div className="border-muted-foreground/25 flex min-h-[160px] flex-col items-center justify-center rounded-lg border p-8 text-center">
              <h2 className="mb-2 text-xl font-semibold">No flags yet</h2>
              <p className="text-muted-foreground">Create a flag to get started.</p>
            </div>
          ) : (
            scoped.flags.map((f) => (
              <div key={f.id} className="space-y-2">
                <div>
                  <h2 className="text-xl font-semibold">{f.name}</h2>
                  <div className="text-muted-foreground mt-1 flex items-center gap-3 text-sm">
                    <span className="font-mono">{f.key}</span>
                    <Badge variant="outline">{f.valueType}</Badge>
                  </div>
                </div>
                <FlagEnvMatrix flag={f} environments={scoped.environments} configs={scoped.cfgsByFlag[f.id] ?? []} />
              </div>
            ))
          )}
        </div>
      ) : grouped ? (
        <div className="space-y-10">
          {grouped.map((g) => (
            <div key={g.projectId} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{g.projectName}</h2>
              </div>
              {g.flags.length === 0 ? (
                <div className="border-muted-foreground/25 flex min-h-[120px] flex-col items-center justify-center rounded-lg border p-6 text-center">
                  <p className="text-muted-foreground">No flags for this project.</p>
                </div>
              ) : (
                g.flags.map((f) => (
                  <div key={f.id} className="space-y-2">
                    <div>
                      <h3 className="text-xl font-semibold">{f.name}</h3>
                      <div className="text-muted-foreground mt-1 flex items-center gap-3 text-sm">
                        <span className="font-mono">{f.key}</span>
                        <Badge variant="outline">{f.valueType}</Badge>
                      </div>
                    </div>
                    <FlagEnvMatrix flag={f} environments={g.environments} configs={g.cfgsByFlag[f.id] ?? []} />
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
