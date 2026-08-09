---
name: maintenance-operations
description: Read and analyze Alazab/UberFix maintenance requests and operational status without changing production state.
---

Use this skill for maintenance request lookup, status review, SLA context, history inspection, and operational analysis.

## Allowed MCP actions

- `maintenance.read`

## Never call from this skill

- `maintenance.write`
- `maintenance.assign`
- `maintenance.transition`
- `maintenance.notify`
- payment, approval, raw SQL, shell, user deletion, or secret-reading actions

## Workflow

1. Resolve the request, branch, property, or project identifier from the user's input before reading data.
2. Call `maintenance.read` with the narrowest useful filter.
3. Preserve returned IDs, timestamps, statuses, assignees, and source references in the analysis.
4. Distinguish facts returned by the tool from conclusions inferred from them.
5. If the user asks to change production state, explain the intended change and route to an explicitly approved write workflow instead of performing it through this read-only skill.

## Output

Return the current state first, then anomalies/blockers, then the next operational action. Do not invent missing fields.
