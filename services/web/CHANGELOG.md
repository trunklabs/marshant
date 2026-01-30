# @marshant/web

## 0.1.0

### Minor Changes

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

- 4299bcb: Feature flag evaluation API & key management

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

- c0f0b41: Improved theme switching experience with a new dropdown menu
- a27962c: Edit existing gates without recreating them

  You can now edit gates directly from the gate configuration dialog. No more deleting and recreating gates just to update actor IDs or return values.

  **What's new:**
  - **Edit button** on each gate card opens an inline form
  - **Edit actor IDs** with a larger textarea for long lists
  - **Edit return value** with type-appropriate inputs (boolean dropdown, number input, JSON textarea)
  - **Form validation** using React Hook Form and Zod schemas
  - **Save/Cancel** buttons to commit or discard changes

  The backend already supported gate updates—this change brings that functionality to the UI.

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

- f5deb19: feat: SDK local evaluation with bulk config fetch
  - `createClient()` is now async and fetches all flag configs on initialization
  - Flag evaluation happens locally (synchronous, in-memory)
  - Background polling refreshes configs every 15 seconds (configurable)
  - Set `refreshInterval: 0` to disable polling for serverless environments
  - New `GET /api/v1/configs` endpoint replaces `POST /api/v1/flags/evaluate`
  - Added `client.close()` method to stop polling
- e34f821: Improved actor IDs input for gates

  Actor IDs are now managed as individual items instead of a comma-separated string. This makes it much easier to work with long lists of actors.

  **What's new:**
  - Each actor ID is displayed as a badge with an X button to remove it
  - Press Enter or comma to add a new actor ID
  - Backspace on empty input removes the last ID
  - Paste comma-separated lists and they'll be split into individual items automatically
  - Same intuitive behavior in both add and edit modes

- a6db83c: New visual identity and enhanced authentication experience

  ## Web (Minor)

  We've completely refreshed the Marshant experience with a new logo and redesigned interface. The authentication flow has been rebuilt from the ground up with better-auth integration, providing a more secure and streamlined sign-in experience. The dashboard now features an improved layout with better project and flag management, new data visualization components, and a more intuitive navigation system. Additional enhancements include theme switching support, new UI components for better data tables, and an overall modernized look and feel.

  ## Core (Patch)

  Improved validation logic for feature gate configurations to ensure more reliable flag evaluations.

### Patch Changes

- 1a11207: Streamline project and environment forms

  Description fields have been removed from the UI as they were never persisted to the database. Forms are now streamlined to only show fields that are actually saved.

- 757c7c0: Improve UI elements theme consistency

  Some UI elements were inconsistent with the theming, in this update, we are addressing the issue.

- 7f78184: New Light & Dark Theme Toggle

  We've added a theme switcher so you can choose the look that works best for you.

- df66520: Form validation and UI improvements

  ### Web (Patch)

  **Improved Validation**
  - Names and keys now require at least 2 characters
  - Keys must start and end with letters or numbers, and can only contain lowercase letters, numbers, hyphens, and underscores
  - Better error messages when validation fails
  - Clear error message when creating duplicate environment keys in a project

  **Better Error Messages**
  - Database errors are now shown as user-friendly messages
  - No more technical database details exposed in error toasts
  - Duplicate key errors now clearly explain what went wrong

  **Form Behavior**
  - Validation errors now clear immediately when you start typing
  - More consistent validation behavior across all forms
  - Better alignment in the project creation form

  **UI Updates**
  - Keys (project, environment, flag) are now displayed consistently throughout the app with copy buttons
  - Removed meaningless "Active" badges from environment cards
  - Removed the broken search feature from the flags page

- f2a3dc1: Better environment validation

  Creating or updating environments now automatically validates your input before saving. Invalid keys or names are caught early with clear error messages, so you'll know exactly what to fix.

- Updated dependencies [f2a3dc1]
- Updated dependencies [10d6196]
- Updated dependencies [d53b018]
- Updated dependencies [a6db83c]
  - @marshant/core@0.1.0
