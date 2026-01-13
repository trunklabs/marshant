import { NextRequest, NextResponse } from 'next/server';
import { FlagService } from '@/lib/services/flag-service';
import { ProjectRepository } from '@/lib/repositories/project-repository';
import { auth } from '@/lib/auth';
import type { Actor, EvaluationResult } from '@marshant/core';

export type EvaluateFlagRequest = {
  projectKey: string;
  environmentKey: string;
  flagKey: string;
  actor: Actor;
};

export type EvaluateFlagResponse = EvaluationResult;

export type EvaluateFlagErrorResponse = {
  error: string;
  code: string;
};

type ApiKeyMetadata = {
  organizationId?: string;
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<EvaluateFlagResponse | EvaluateFlagErrorResponse>> {
  try {
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return NextResponse.json({ error: 'X-API-Key header is required', code: 'MISSING_API_KEY' }, { status: 401 });
    }

    const body = (await request.json()) as EvaluateFlagRequest;

    if (!body.projectKey) {
      return NextResponse.json({ error: 'projectKey is required', code: 'MISSING_PROJECT_KEY' }, { status: 400 });
    }

    if (!body.environmentKey) {
      return NextResponse.json(
        { error: 'environmentKey is required', code: 'MISSING_ENVIRONMENT_KEY' },
        { status: 400 }
      );
    }

    if (!body.flagKey) {
      return NextResponse.json({ error: 'flagKey is required', code: 'MISSING_FLAG_KEY' }, { status: 400 });
    }

    if (!body.actor || !body.actor.id) {
      return NextResponse.json({ error: 'actor with id is required', code: 'MISSING_ACTOR' }, { status: 400 });
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
    const project = await projectRepo.findByKeyAndOwner(body.projectKey, ownerId, ownerType);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or API key does not have access', code: 'PROJECT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const flagService = new FlagService();
    const result = await flagService.evaluateFlag(project.id, body.environmentKey, body.flagKey, body.actor);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'FlagNotFoundError') {
        return NextResponse.json({ error: error.message, code: 'FLAG_NOT_FOUND' }, { status: 404 });
      }
      if (error.name === 'EnvironmentNotFoundError') {
        return NextResponse.json({ error: error.message, code: 'ENVIRONMENT_NOT_FOUND' }, { status: 404 });
      }
      if (error.name === 'ProjectNotFoundError') {
        return NextResponse.json({ error: error.message, code: 'PROJECT_NOT_FOUND' }, { status: 404 });
      }
      if (error.name === 'FlagEnvironmentConfigNotFoundError') {
        return NextResponse.json({ error: error.message, code: 'FLAG_CONFIG_NOT_FOUND' }, { status: 404 });
      }
    }

    console.error('Flag evaluation error:', error);
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
