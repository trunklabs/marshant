# @marshant/sdk

## 0.1.1

### Patch Changes

- f2cea62: Fix missing build

## 0.1.0

### Minor Changes

- 1717520: Initial release of Marshant — open-source feature flag management.

  **SDK (`@marshant/sdk`)**
  - TypeScript SDK for evaluating feature flags in applications
  - Local evaluation: fetches all flag configs on init, evaluates synchronously in-memory
  - Background polling (15s default) keeps flags up to date
  - Exports: `createClient`, `isEnabled()`, `getValue()`, `evaluateFlag()`
  - `client.close()` to stop polling

  **Web (`@marshant/web`)**
  - Dashboard for managing projects, environments, feature flags, and gates
  - Organization-scoped API key management
  - `GET /api/v1/configs` endpoint for bulk flag config fetch
  - Gate configuration with actor targeting and boolean conditions
  - Inline editing of gates, flags, and environments with form validation
  - Light and dark theme support
  - Authentication via better-auth with organization support
