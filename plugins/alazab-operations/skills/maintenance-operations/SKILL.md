---
name: maintenance-operations
description: Read Alazab/UberFix maintenance request status and maintenance gateway metadata without changing production state.
---

Use this skill for exact maintenance request status lookup and maintenance workflow/catalog inspection.

## Available plugin tools

- `maintenance_get_status`
- `maintenance_catalog`

## Workflow

1. For a request lookup, use an exact `request_id` or `request_number`. Do not guess identifiers.
2. Call `maintenance_get_status` for current request state.
3. Call `maintenance_catalog` only when workflow/tool metadata is relevant.
4. Preserve returned IDs, timestamps, states, and source values exactly.
5. Separate facts returned by the tool from any operational conclusion.
6. If the user asks to mutate a maintenance request, state that plugin v0.1 is read-only and do not substitute another write-capable tool.

## Prohibited in v0.1

Do not create requests, transition stages, add notes, cancel requests, run lifecycle macros, approve, pay, execute raw SQL or shell commands, delete users, or read secrets.

## Output

Return the current state first, then discrepancies/blockers, then the next operational action. Do not invent missing fields.
