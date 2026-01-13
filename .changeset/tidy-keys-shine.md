---
'@marshant/web': patch
---

Form validation and UI improvements

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
