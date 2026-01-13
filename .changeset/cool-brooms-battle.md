---
'@marshant/web': minor
---

Feature flag evaluation API & key management

## UI

**API Key Management**

Create and manage API keys directly from your project's Edit dialog. Each key gives your applications secure access to evaluate feature flags.

- **Named keys** — Give each key a descriptive name (e.g., "Production Backend", "Staging App")
- **Environment scoping** — Select which environments each key can access
- **Key rotation** — Rotate keys anytime with a confirmation step to prevent accidents
- **Usage tracking** — See when each key was last used
- **One-time secret** — Secret keys are shown only once at creation, so save them somewhere safe

## API

**Flag Evaluation Endpoint**

Evaluate feature flags programmatically with `POST /api/v1/flags/evaluate`:

```bash
curl -X POST https://your-app.com/api/v1/flags/evaluate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mc_your-api-key" \
  -d '{
    "environmentKey": "production",
    "flagKey": "my-feature",
    "actor": { "id": "user-123" }
  }'
```

The response includes the flag's enabled state, resolved value, and evaluation reason — everything you need to make feature decisions in your code.
