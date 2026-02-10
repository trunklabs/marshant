# @marshant/sdk

TypeScript SDK for evaluating feature flags with local evaluation and background polling.

## Installation

```bash
npm install @marshant/sdk
```

## Quick Start

```typescript
import { createClient } from "@marshant/sdk";

const client = await createClient({
  apiKey: "mc_xxx",
  projectKey: "my-project",
  environmentKey: "production",
  baseUrl: "https://your-app.example.com",
});

// Check if a flag is enabled
const enabled = client.isEnabled("new-feature", { id: "user-123" });

// Get a flag value with a default fallback
const limit = client.getValue("rate-limit", { id: "user-123" }, 100);

// Full evaluation result with reason
const result = client.evaluateFlag("new-feature", { id: "user-123" });

// Stop polling when done
client.close();
```

## API

### `createClient(options): Promise<Client>`

Creates and initializes a client instance. Fetches flag configurations on startup and polls for updates in the background.

#### Options

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `apiKey` | `string` | Yes | - | API key (format: `mc_xxx`) |
| `projectKey` | `string` | Yes | - | Project identifier |
| `environmentKey` | `string` | Yes | - | Environment identifier |
| `baseUrl` | `string` | No | `http://localhost:3000` | API base URL |
| `refreshInterval` | `number` | No | `15000` | Polling interval in ms. Set to `0` to disable. |

### Client Methods

- **`isEnabled(flagKey, actor)`** - Returns `boolean`. Returns `false` on error.
- **`getValue<T>(flagKey, actor, defaultValue)`** - Returns the flag value or `defaultValue` on error.
- **`evaluateFlag(flagKey, actor)`** - Returns full `EvaluationResult` with `enabled`, `value`, and `reason`.
- **`close()`** - Stops background polling.

### Serverless Usage

Disable polling for short-lived environments:

```typescript
const client = await createClient({
  apiKey: "mc_xxx",
  projectKey: "my-project",
  environmentKey: "production",
  refreshInterval: 0,
});
```

## License

MIT
