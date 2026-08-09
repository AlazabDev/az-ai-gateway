---
name: bim-operations
description: Read and analyze Alazab BIM and AzBIM project data, BOQs, and engineering context without approving or mutating production records.
---

Use this skill for BIM/project engineering review, BOQ inspection, scope analysis, and read-only technical investigation.

## Allowed MCP actions

- `bim.read`
- `bim.analyze`
- `bim.boq`

## Never call from this skill

- `bim.approval`
- any production write, payment, raw SQL, shell, user deletion, or secret-reading action

## Workflow

1. Resolve the project, branch, document, BOQ, or BIM object identifier before analysis.
2. Use `bim.read` for source facts and current state.
3. Use `bim.boq` only when quantities, items, scope, or BOQ structure are relevant.
4. Use `bim.analyze` for engineering interpretation after source data has been read.
5. Keep source values, calculated values, and engineering conclusions explicitly separated.
6. Do not treat an analysis result as an approval.

## Output

Lead with the engineering finding, then supporting source data, discrepancies, and required follow-up. Do not infer quantities or specifications that the tools did not return.
