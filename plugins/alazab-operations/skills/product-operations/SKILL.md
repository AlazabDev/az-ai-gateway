---
name: product-operations
description: Search Alazab product data and inspect stock and pricing without updating catalog records.
---

Use this skill for product lookup, product-code/name resolution, price checks, stock checks, and read-only catalog investigation.

## Allowed MCP actions

- `products.search`
- `products.stock`
- `products.price`

## Never call from this skill

- `products.update_draft`
- any production write, payment, approval, raw SQL, shell, user deletion, or secret-reading action

## Workflow

1. Search first when the product identifier is not exact.
2. Preserve the canonical product ID/code returned by `products.search`.
3. Use that canonical identifier for `products.stock` and `products.price`.
4. When multiple matches exist, compare identifiers and descriptions rather than selecting by name alone.
5. Treat price, stock, and catalog text as separate dimensions; do not infer one from another.

## Output

Return the matched product identity first, then price and stock facts, ambiguities, and any data-quality issue that needs correction. Do not mutate the catalog.
