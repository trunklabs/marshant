---
'@marshant/core': minor
'@marshant/web': minor
---

Project and environment validation

### Core

New validators and error classes for projects and environments:

- **`validateProject()`** — Validates project name (required, max 200 characters)
- **`ProjectValidationError`** — Thrown when project validation fails
- **`ProjectMustHaveEnvironmentError`** — Thrown when creating a project without environments
- **`CannotDeleteLastEnvironmentError`** — Thrown when attempting to delete the last environment in a project

### Web

Projects now require at least one environment at creation time. This rule is enforced at the service layer, ensuring data integrity regardless of how the API is called.

- Creating a project without environments will now fail with a clear error message
- Attempting to delete the last environment in a project returns a descriptive error
- Project names are validated before saving
