---
'@marshant/sdk': minor
---

Feature flag SDK for JavaScript/TypeScript

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
