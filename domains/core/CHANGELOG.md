# @marshant/core

## 0.1.0

### Minor Changes

- f2a3dc1: Environment validation is here

  You can now validate environments the same way you validate flags. We've also unified key validation across the board—flags and environments now share the same rules, so you get consistent error messages everywhere.

  **New exports:**
  - `validateEnvironment` – validate environment objects before saving
  - `validateKey` and `KEY_REGEX` – reusable key validation for your own use cases

  This is a non-breaking change. If you're already using flag validation, everything works as before.

- 10d6196: Project and environment validation

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

### Patch Changes

- a6db83c: New visual identity and enhanced authentication experience

  ## Web (Minor)

  We've completely refreshed the Marshant experience with a new logo and redesigned interface. The authentication flow has been rebuilt from the ground up with better-auth integration, providing a more secure and streamlined sign-in experience. The dashboard now features an improved layout with better project and flag management, new data visualization components, and a more intuitive navigation system. Additional enhancements include theme switching support, new UI components for better data tables, and an overall modernized look and feel.

  ## Core (Patch)

  Improved validation logic for feature gate configurations to ensure more reliable flag evaluations.
