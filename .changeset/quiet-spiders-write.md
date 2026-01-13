---
'@marshant/sdk': minor
'@marshant/core': minor
'@marshant/web': minor
---

Organization-scoped API keys

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
