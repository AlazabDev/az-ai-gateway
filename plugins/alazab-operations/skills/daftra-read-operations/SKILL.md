---
name: daftra-read-operations
description: Read Daftra products, clients, invoices, expenses, and work orders through the Alazab MCP gateway without creating or modifying records.
---

Use this skill for read-only Daftra lookup and operational inspection.

## Available plugin tools

- `daftra_list_products`
- `daftra_list_clients`
- `daftra_list_invoices`
- `daftra_list_expenses`
- `daftra_list_work_orders`

## Workflow

1. Choose the narrowest list tool matching the requested Daftra object.
2. Use `search` when the user supplied a name, code, document number, or other search text.
3. Use pagination deliberately; do not claim a complete dataset when only one page was returned.
4. Preserve Daftra IDs, document numbers, dates, totals, names, and statuses exactly as returned.
5. Separate source values from calculations or conclusions.
6. If the user asks to create, update, approve, delete, post, or pay anything, state that plugin v0.1 is read-only and do not substitute a write-capable gateway action.

## Prohibited in v0.1

Do not call Daftra create/update CRUD operations, approve or pay transactions, execute raw SQL or shell commands, delete users, or read secrets.

## Output

Return the requested Daftra records first, followed by ambiguities, data-quality issues, and any exact follow-up needed. Do not invent fields that are absent from the response.
