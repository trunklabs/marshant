# @marshant/sdk

## 0.1.0

### Minor Changes

- 0bb6e87: Feature flag SDK for JavaScript/TypeScript

  Evaluate feature flags in your application with a simple, type-safe client:
  - **`createClient`** - Initialize once with your API key and environment
  - **`isEnabled()`** - Check if a flag is on for a user
  - **`getValue()`** - Get a flag's value with a default fallback
  - **`evaluateFlag()`** - Get the full evaluation result with reason

  ```ts
  import { createClient } from '@marshant/sdk';

  const client = createClient({
    apiKey: 'mc_your-api-key',
    environmentKey: 'production',
    baseUrl: 'https://your-app.example.com',
  });

  const enabled = await client.isEnabled('my-feature', { id: 'user-123' });
  ```

- d53b018: Organization-scoped API keys

  ### SDK (Minor)

  API keys are now scoped to organizations instead of individual projects. This provides more flexibility — a single API key can now access any project within its organization.

  The SDK client requires `apiKey`, `projectKey`, and `environmentKey` parameters:

  ```ts
  const client = createClient({
    apiKey: 'marshant_pk_xxx',
    projectKey: 'my-project',
    environmentKey: 'production',
  });
  ```

  ### Core (Minor)
  - Added `key` field to the `Project` type
  - Project keys are now validated alongside project names

  ### Web (Minor)

  **Project Keys**

  Projects now have unique keys within their organization or personal account. These keys are used for API access instead of internal IDs, making integrations more readable and portable.
  - Project keys are unique per organization/user
  - Keys are required when creating new projects
  - The flag evaluation API now uses `projectKey` to identify which project to evaluate against

- f5deb19: feat: SDK local evaluation with bulk config fetch
  - `createClient()` is now async and fetches all flag configs on initialization
  - Flag evaluation happens locally (synchronous, in-memory)
  - Background polling refreshes configs every 15 seconds (configurable)
  - Set `refreshInterval: 0` to disable polling for serverless environments
  - New `GET /api/v1/configs` endpoint replaces `POST /api/v1/flags/evaluate`
  - Added `client.close()` method to stop polling

### Patch Changes

- Updated dependencies [f2a3dc1]
- Updated dependencies [10d6196]
- Updated dependencies [d53b018]
- Updated dependencies [a6db83c]
  - @marshant/core@0.1.0
