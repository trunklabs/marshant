import { NextRequest, NextResponse } from 'next/server';
import { FlagConfigRepository, type FlagConfigWithMetadata } from '@/lib/repositories/flag-config-repository';
import { ProjectRepository } from '@/lib/repositories/project-repository';
import { auth } from '@/lib/auth';

export type GetConfigsResponse = {
  flags: FlagConfigWithMetadata[];
};

export type GetConfigsErrorResponse = {
  error: string;
  code: string;
};

type ApiKeyMetadata = {
  organizationId?: string;
};

export async function GET(request: NextRequest): Promise<NextResponse<GetConfigsResponse | GetConfigsErrorResponse>> {
  try {
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return NextResponse.json({ error: 'X-API-Key header is required', code: 'MISSING_API_KEY' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectKey = searchParams.get('projectKey');
    const environmentKey = searchParams.get('environmentKey');

    if (!projectKey) {
      return NextResponse.json({ error: 'projectKey is required', code: 'MISSING_PROJECT_KEY' }, { status: 400 });
    }

    if (!environmentKey) {
      return NextResponse.json(
        { error: 'environmentKey is required', code: 'MISSING_ENVIRONMENT_KEY' },
        { status: 400 }
      );
    }

    const verifyResult = await auth.api.verifyApiKey({
      body: { key: apiKey },
    });

    if (!verifyResult.valid || !verifyResult.key) {
      return NextResponse.json(
        { error: verifyResult.error?.message || 'Invalid API key', code: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }

    const metadata: ApiKeyMetadata = (verifyResult.key.metadata as ApiKeyMetadata) || {};
    const userId = verifyResult.key.userId;

    const ownerId = metadata.organizationId || userId;
    const ownerType: 'organization' | 'user' = metadata.organizationId ? 'organization' : 'user';

    const projectRepo = new ProjectRepository();
    const project = await projectRepo.findByKeyAndOwner(projectKey, ownerId, ownerType);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or API key does not have access', code: 'PROJECT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const flagConfigRepo = new FlagConfigRepository();
    const flags = await flagConfigRepo.findAllByProjectAndEnvironment(project.id, environmentKey);

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Get configs error:', error);
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
