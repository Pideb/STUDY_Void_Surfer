# Task: T02 Vercel Deployment Guide

## Status: done

## Goal

Provide an operator-only setup guide so organization users need only the deployed Vercel URL and their Entra account.

## Implementation

- Related Files:
  - `README.md` :: concise user run/deployment handoff; modify
  - `docs/entra-vercel-deploy.md` :: new end-to-end operator guide
  - `docs/supabase-setup.md`, `docs/vercel-deploy.md` :: update/replace stale references as needed

### Details

- Document Entra single-tenant app registration, Entra client-secret handling, allowed local and production redirect URLs, and required Supabase Azure provider client ID/secret configuration. Clearly distinguish the Entra app secret (stored only in Supabase provider configuration) from browser Vite variables.
- Document Supabase URL/Anon Key as the only Vercel build environment variables; never instruct users to publish `.env` or add a tenant ID to browser configuration.
- Document Vercel GitHub import, build command `npm run build`, output directory `dist`, SPA rewrite/callback verification, production URL allow-listing in Supabase and Entra, and rollback/update flow.
- State that Graph/photos are intentionally out of scope and that end users only open the deployed link and authenticate with an organization account.
- Add a verification checklist: signed-out visit, organization sign-in, score submission, leaderboard read, sign-out, blocked external-account attempt, and callback URL test.

## Acceptance Criteria

- [ ] An operator can configure Entra, Supabase, and Vercel without reading source code.
- [ ] End users need no clone, `.env`, Supabase account, or Graph permission.
- [ ] Documentation never exposes or requests committing secrets.

## Validation

- `npm run verify:config`
- `npm run build`

## Commit Message

```text
docs(deploy): add Entra Vercel deployment guide

Plan: 2026-09-22-entra-vercel-auth
Phase: P01-entra-vercel-auth
Task: T02-vercel-deployment-guide

- document tenant OAuth and Vercel environment setup
- provide link-only user verification checklist
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending
