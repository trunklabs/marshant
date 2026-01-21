---
'@marshant/web': minor
---

Improved actor IDs input for gates

Actor IDs are now managed as individual items instead of a comma-separated string. This makes it much easier to work with long lists of actors.

**What's new:**

- Each actor ID is displayed as a badge with an X button to remove it
- Press Enter or comma to add a new actor ID
- Backspace on empty input removes the last ID
- Paste comma-separated lists and they'll be split into individual items automatically
- Same intuitive behavior in both add and edit modes
