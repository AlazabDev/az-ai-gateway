---
name: project-operations
description: Inspect Alazab project records, task state, and progress without approving or changing production data.
---

Use this skill for project status, tasks, milestones, progress, blockers, and cross-checking execution state.

## Allowed MCP actions

- `projects.read`
- `projects.tasks`
- `projects.progress`

## Never call from this skill

- `projects.approval`
- any production write, payment, raw SQL, shell, user deletion, or secret-reading action

## Workflow

1. Resolve the project identifier before querying project data.
2. Call `projects.read` for canonical project metadata and current state.
3. Call `projects.tasks` when task ownership, due dates, or blockers are needed.
4. Call `projects.progress` when the user asks about completion, milestones, or variance from plan.
5. Reconcile contradictory task/progress values instead of silently choosing one.
6. If evidence is incomplete, identify the exact missing record or field.

## Output

Return project state, progress, blockers, overdue/at-risk items, and the next operational action. Preserve source identifiers and dates.
