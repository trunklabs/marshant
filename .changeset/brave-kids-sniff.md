---
'@marshant/core': minor
---

Environment validation is here

You can now validate environments the same way you validate flags. We've also unified key validation across the board—flags and environments now share the same rules, so you get consistent error messages everywhere.

**New exports:**
- `validateEnvironment` – validate environment objects before saving
- `validateKey` and `KEY_REGEX` – reusable key validation for your own use cases

This is a non-breaking change. If you're already using flag validation, everything works as before.
