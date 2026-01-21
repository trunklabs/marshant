---
'@marshant/web': minor
---

Edit existing gates without recreating them

You can now edit gates directly from the gate configuration dialog. No more deleting and recreating gates just to update actor IDs or return values.

**What's new:**

- **Edit button** on each gate card opens an inline form
- **Edit actor IDs** with a larger textarea for long lists
- **Edit return value** with type-appropriate inputs (boolean dropdown, number input, JSON textarea)
- **Form validation** using React Hook Form and Zod schemas
- **Save/Cancel** buttons to commit or discard changes

The backend already supported gate updates—this change brings that functionality to the UI.
