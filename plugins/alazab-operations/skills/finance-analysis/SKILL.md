---
name: finance-analysis
description: Read and analyze Alazab finance data without drafting approvals, approving transactions, or executing payments.
---

Use this skill for finance-data lookup, variance analysis, reconciliation context, and read-only financial investigation.

## Allowed MCP actions

- `finance.read`
- `finance.analyze`

## Never call from this skill

- `finance.draft`
- `finance.approve`
- any payment action
- any production write, raw SQL, shell, user deletion, or secret-reading action

## Workflow

1. Resolve the account, project, period, document, or transaction scope before analysis.
2. Use `finance.read` to obtain source records and totals.
3. Use `finance.analyze` only after the underlying source data is available.
4. Reconcile totals and periods explicitly when values disagree.
5. Separate recorded facts, calculations, and analytical conclusions.
6. Do not interpret analysis as authorization to approve, pay, refund, or post anything.

## Output

Return the financial finding, supporting values and periods, reconciliation gaps, and the action requiring human review. Do not invent missing balances or transactions.
