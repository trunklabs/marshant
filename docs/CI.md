# CI Workflow Documentation

## Overview

The CI workflow (`ci.yml`) runs automated checks on pull requests and feature branch pushes to ensure code quality before merging to `main`.

## How It Works

### Triggers

- **Pull Requests** to `main` branch
- **Pushes** to feature branches (any branch except `main`)

### Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

**Benefit**: When you push new commits, outdated CI runs are automatically cancelled, saving compute resources and providing faster feedback.

### Checks Performed

1. **Format Check** (workspace-wide)
2. **Lint** (affected packages only)
3. **Type Check** (affected packages only)
4. **Test** (affected packages only)
5. **Build** (affected packages only)

## Opt-In System: How Packages Participate

### Natural Opt-In via package.json

Packages automatically participate in checks by **defining the corresponding script** in their `package.json`. Turborepo naturally skips packages that don't have the script.

**This is the recommended approach** - no special flags or configuration needed.

### Example: Full Participation

A package that wants all checks:

```json
{
  "name": "@marshant/web",
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "build": "next build"
  }
}
```

**Result**: All 4 checks run when this package is affected by changes.

### Example: Partial Participation

A package that only needs type checking and building:

```json
{
  "name": "@marshant/sdk",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "tsup"
  }
}
```

**Result**: Only `typecheck` and `build` run. `lint` and `test` are automatically skipped (no error).

### Example: No Checks

A package with no checks (e.g., documentation-only):

```json
{
  "name": "@marshant/docs",
  "scripts": {
    "dev": "vitepress dev"
  }
}
```

**Result**: Package is skipped for all checks (no error).

## Affected Package Detection

The workflow uses Turborepo's `--filter='...[origin/main]'` to run checks only on packages affected by changes.

### What "Affected" Means

A package is considered affected if:

- Its source code changed
- A dependency's code changed
- Its `package.json` changed
- Any file it depends on changed

## Best Practices

### 1. Define Scripts Consistently

Use consistent script names across packages:

```json
{
  "scripts": {
    "lint": "eslint .",           // Consistent across all packages
    "typecheck": "tsc --noEmit",  // Consistent across all packages
    "test": "vitest run",         // Consistent across all packages
    "build": "..."                // Tool may vary (next, tsup, vite, etc.)
  }
}
```

### 2. Local Development Commands

Developers can run the same checks locally:

```bash
# Run checks on all packages
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build

# Run checks on affected packages only (faster)
pnpm exec turbo lint --filter='...[origin/main]'
pnpm exec turbo typecheck --filter='...[origin/main]'
pnpm exec turbo test --filter='...[origin/main]'
pnpm exec turbo build --filter='...[origin/main]'

# Run checks on a specific package
pnpm exec turbo lint --filter=@marshant/web
pnpm exec turbo build --filter=@marshant/sdk
```

### 4. Adding New Checks

To add a new check (e.g., `validate`):

1. **Add to workflow** (`.github/workflows/ci.yml`):

```yaml
- name: Validate affected packages
  run: pnpm exec turbo validate --filter='...[origin/main]' --continue
```

2. **Add to packages** that need it:

```json
{
  "scripts": {
    "validate": "your-validation-command"
  }
}
```

3. **Packages without the script** are automatically skipped.
