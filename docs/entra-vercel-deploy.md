# Entra organization login and Vercel deployment

VOID SURFER keeps authentication and leaderboard sessions in Supabase. Players
only need the deployed game URL and an account from the configured Microsoft
Entra organization. The steps below are performed once by the project operator.

## 1. Register the Entra application

In the [Microsoft Entra admin center](https://entra.microsoft.com/), open
**App registrations** and create a registration with these values:

| Setting | Value |
| --- | --- |
| Supported account types | Accounts in this organizational directory only (single tenant) |
| Platform | Web |
| Redirect URI | `https://<project-ref>.supabase.co/auth/v1/callback` |

After registering it, copy the **Application (client) ID** and create a client
secret. Copy the *secret value* immediately; it is shown only once. The secret
belongs in Supabase, never in this repository, `.env`, or Vercel.

`<project-ref>` is the subdomain shown in the Supabase project URL. For example,
the project URL `https://abcde.supabase.co` uses
`https://abcde.supabase.co/auth/v1/callback`.

## 2. Configure the Supabase Azure provider

In Supabase Dashboard, open **Authentication → Providers → Azure** and enable
the provider. Enter:

| Supabase field | Value |
| --- | --- |
| Client ID | Entra Application (client) ID |
| Client Secret | Entra secret value |
| Azure Tenant URL | `https://login.microsoftonline.com/<tenant-id>` |

Use the Entra **Directory (tenant) ID** in `<tenant-id>`. This Azure Tenant URL
is what restricts login to the organization. It is configured server-side by
Supabase; the game deliberately does not send tenant parameters from browser
code.

The existing popup login requests the Supabase `azure` provider with the
`openid`, `profile`, and `email` scopes. It does not require Microsoft Graph
permissions or profile-photo access.

## 3. Allow application return URLs in Supabase

In **Authentication → URL Configuration**, set the Site URL to the production
Vercel origin and add these redirect URLs:

```
http://localhost:5173/auth/callback
https://<your-production-domain>/auth/callback
```

If Vercel preview deployments are used for sign-in testing, add each preview
origin's `/auth/callback` URL as well (or a carefully scoped wildcard supported
by Supabase). Keep the final production URL explicitly listed.

## 4. Deploy on Vercel

Import the GitHub repository into Vercel. Vercel detects Vite automatically;
the expected build command is `npm run build` and output directory is `dist`.

Add these environment variables for the environments that should connect to the
shared leaderboard:

```
VITE_SUPABASE_URL=<Supabase project URL>
VITE_SUPABASE_ANON_KEY=<Supabase publishable/anon key>
```

Values beginning with `VITE_` are public browser configuration. Never add an
Entra client secret, an Entra tenant URL, a Supabase service-role key, or any
other private credential to Vercel's browser build variables.

The repository's `vercel.json` already rewrites `/auth/callback` to the Vite
application, so the popup completion route works on a refreshed deployed page.

## 5. Verify before sharing

1. Open the production URL in a private browser window and choose Microsoft
   login.
2. Sign in with an account from the configured organization; the popup should
   close and return to the game menu.
3. Start a run, end it, and confirm the score appears in the shared leaderboard.
4. Sign out and sign in again to confirm session restoration and sign-out both
   work.
5. Confirm an account outside the Entra tenant is refused by the Entra login
   flow.

For Supabase-side field names and provider updates, refer to the official
[Azure social-login documentation](https://supabase.com/docs/guides/auth/social-login/auth-azure).
