# Decisions: Entra Vercel Authentication

- Date: 2026-09-22
- Status: Confirmed

## D01. Authentication boundary

- **Chosen**: Retain Supabase Auth as the Microsoft OAuth broker and configure its Azure provider in the Supabase Dashboard with a Microsoft Entra single-tenant application and Azure Tenant URL.
- **Rationale**: This preserves the current browser session, RLS-protected leaderboard RPCs, and score submission contract without introducing a custom token-verification backend.

## D02. Account eligibility

- **Chosen**: Only accounts in the configured Entra organization can sign in, play, and submit leaderboard records.
- **Rationale**: The shared deployment link is public, but access must remain limited to the organization's intended users.

## D03. Deployment and user setup

- **Chosen**: Deploy the Vite SPA through Vercel, with Supabase URL and publishable Anon Key configured as Vercel build environment variables.
- **Rationale**: Users receive a single web link and need no repository clone, local `.env`, Supabase account, or project configuration.

## D04. Microsoft Graph scope

- **Chosen**: Do not add Microsoft Graph profile-photo or organization-directory access in this change.
- **Rationale**: Authentication and reliable leaderboard deployment are the first priority; omitting Graph avoids `User.Read.All` administrator consent and unnecessary personal-data handling.

## D05. Entra SPA registration

- **Chosen**: Register the OAuth application as a single-tenant Entra web app with Supabase's `/auth/v1/callback` URL as its Entra redirect URI. Store the Entra client ID, client secret, and tenant URL only in Supabase's Azure provider configuration. Configure local and Vercel URLs in Supabase Auth redirect allow-lists; no client secret or tenant control is embedded in the SPA.
- **Rationale**: Supabase's Azure provider enforces tenant selection server-side and owns the Entra client secret, while the browser only receives its public Supabase project configuration.
