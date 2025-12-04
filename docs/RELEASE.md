# Release Workflow Documentation

## Overview

This repository uses automated workflows for versioning, releasing, and building Docker images.

## How It Works

The `release.yml` workflow automates the entire release process using [changesets](https://github.com/changesets/changesets).

1. **On every push to `main`**: The workflow runs and uses the [changesets/action](https://github.com/changesets/action) to:
   - Create or update a "Version Packages" pull request that bundles all pending changesets
   - **Version process**: Runs `changeset version` to update package.json files, then runs `pnpm install --no-frozen-lockfile` to update pnpm-lock.yaml with new dependency versions
   - When that PR is merged, it publishes packages and creates git tags

2. **Docker Image Building**: After packages are published (when the release PR is merged):
   - The workflow automatically detects which packages were versioned
   - For each published package, it checks if the package has a `dockerTarget` field in its `package.json`
   - If `dockerTarget` is present, it builds and pushes a Docker image to GitHub Container Registry
   - Images are tagged with semantic versioning (major, major.minor, full version, and latest)

### Key Features

- ✅ **No Docker builds on PR creation**: Docker images are only built after packages are actually published
- ✅ **Selective building**: Only packages that received version updates are processed
- ✅ **Auto-discovery**: New packages with `dockerTarget` field are automatically discovered and built
- ✅ **Efficient caching**: Uses GitHub Actions cache (`type=gha`) for Docker builds

## Adding a New Buildable Package

To make a package buildable as a Docker image:

1. **Add the `dockerTarget` field to the package's `package.json`**:

```json
{
  "name": "@marcurry/my-service",
  "version": "0.1.0",
  "private": true,
  "dockerTarget": "my-service",
  "scripts": {
    "build": "..."
  }
}
```

2. **Add corresponding stages to the root `Dockerfile`**:

```dockerfile
# Build stage for your service
FROM base AS build-my-service
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install -w -F @marcurry/my-service... --frozen-lockfile && \
    pnpm exec turbo @marcurry/my-service#build

# Runtime stage for your service
FROM node:22.19-alpine3.22 AS my-service
WORKDIR /prod/my-service
ENV NODE_ENV=production
COPY --from=build-my-service /usr/src/app/services/my-service/dist ./
CMD ["node", "index.js"]
```

3. **The workflow will automatically**:
   - Detect the package when it's versioned
   - Build the Docker image using the specified target
   - Push to `ghcr.io/<repo>/<package-name>` with appropriate tags

## Workflow Outputs

### Docker Images

Images are published to GitHub Container Registry with the following naming convention:

```
ghcr.io/<github-username>/<repo-name>/<package-short-name>:<version>
```

### Tags

Each image receives multiple tags:

- `<major>.<minor>.<patch>` - Full semantic version
- `<major>.<minor>` - Major and minor version
- `<major>` - Major version only
- `latest` - Always points to the most recent version

### Example

For `@marcurry/web` version `1.2.3`:

- `ghcr.io/mark-omarov/marcurry-feature-flag/web:1.2.3`
- `ghcr.io/mark-omarov/marcurry-feature-flag/web:1.2`
- `ghcr.io/mark-omarov/marcurry-feature-flag/web:1`
- `ghcr.io/mark-omarov/marcurry-feature-flag/web:latest`

## Private Packages

The workflow works with private packages (those with `"private": true`). Private packages are:

- Still versioned by changesets
- Can have Docker images built and published
- Won't be published to npm (as intended)

This allows you to version internal services and libraries while only publishing selected packages (like SDKs) to npm in the future.

## Troubleshooting

### Image not being built

Check that:

1. The package has a `dockerTarget` field in `package.json`
2. The Dockerfile has a target matching the `dockerTarget` value
3. The package was actually versioned in the release (check the changesets output)

### Build failures

- Check the Dockerfile syntax for the specific target
- Ensure all dependencies are properly installed in the build stage
- Verify the build command succeeds locally

## References

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Changesets Action](https://github.com/changesets/action)
- [Automating Changesets Guide](https://github.com/changesets/changesets/blob/main/docs/automating-changesets.md)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
