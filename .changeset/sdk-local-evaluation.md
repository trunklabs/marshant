---
"@marshant/sdk": minor
"@marshant/web": minor
---

feat: SDK local evaluation with bulk config fetch
- `createClient()` is now async and fetches all flag configs on initialization
- Flag evaluation happens locally (synchronous, in-memory)
- Background polling refreshes configs every 15 seconds (configurable)
- Set `refreshInterval: 0` to disable polling for serverless environments
- New `GET /api/v1/configs` endpoint replaces `POST /api/v1/flags/evaluate`
- Added `client.close()` method to stop polling
