# Codex Repair Validation

## Scope

This branch contains the production-hardening and merge-repair pass for the Alazab AI Console.

## Security corrections

- Sensitive routes require the `admin` role.
- Public sign-up was removed from the frontend.
- New Supabase users are restricted to approved Alazab email domains by migration.
- WhatsApp messages and media are admin-only; the media bucket is private.
- Browser-side AI and GitHub credentials were removed.
- AI requests use the server-side `azure-ai-chat` gateway with request and usage limits.
- GitHub access uses the admin-only `github-proxy` Edge Function.

## Build corrections

- Node.js 22 and pnpm 10 are the supported toolchain.
- `pnpm-lock.yaml` is the only dependency lockfile.
- Vitest, jsdom, and Three.js types are aligned in the frozen lockfile.
- TypeScript uses project-reference build checking.
- Application routes are lazy-loaded to split heavy engineering, PDF, chart, and 3D modules.

## Required verification

The pull-request quality gate must complete all of the following before merge:

```text
pnpm install --frozen-lockfile
pnpm run type-check
pnpm run lint
pnpm run test:run
pnpm run build
```

## Deployment prerequisites

Before deploying the repaired branch:

1. Apply the new Supabase migration.
2. Deploy the updated Edge Functions.
3. Configure the server-side Azure and GitHub secrets.
4. Confirm the intended users have the correct `admin` or `user` roles.
5. Verify WhatsApp data and media access with both role types.
