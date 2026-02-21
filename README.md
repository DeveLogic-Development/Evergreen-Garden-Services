# Evergreen Garden Services (MVP)

Mobile-first booking + admin management app for a single South African gardening business.

## Stack

- Frontend: React + TypeScript + Vite + React Router + Tailwind
- Data/Auth/Storage: Supabase (Postgres + Auth + Storage)
- State/data cache: TanStack Query
- Validation: Zod (`packages/shared`)
- Package manager: `pnpm`

## Monorepo Layout

- `apps/web`: customer + admin PWA web app
- `apps/landing`: immersive one-page landing site
- `packages/shared`: shared types and Zod schemas
- `packages/theme`: shared CSS tokens and Tailwind preset
- `supabase/schema.sql`: SQL bootstrap (tables, RLS, functions, storage policies)

## Brand Theme

Theme tokens are defined in `packages/theme/theme.css` and mapped via `packages/theme/tailwind-preset.js`.
Use only token-based Tailwind classes (`bg-brand-700`, `text-text`, `bg-bg`, etc.).

## Design System (Glassmorphism)

- Reusable primitives live in `apps/web/src/components/ui`:
  - `GlassCard`, `GlassPanel`
  - `Button` variants (`PrimaryButton`, `SecondaryButton`, `AppButton`)
  - `FormInput`, `FormTextArea`
  - `StatusBadge`
  - `FloatingNav`
  - `Stepper`
  - `BottomSheet`
  - `Skeleton`, `EmptyState`
- Global glass and background styles are in `apps/web/src/styles/index.css`.
- Customer navigation uses a floating glass pill bottom nav.
- First-run onboarding route: `/welcome` (persisted with localStorage).

## Logo Placeholder

`apps/web/src/components/BrandLogo.tsx` is the single replacement point.

- Option 1: set `VITE_LOGO_URL` in `apps/web/.env.local`
- Option 2: replace `apps/web/src/assets/logo-placeholder.svg`
- The code includes a comment marker: `Replace this with the final Evergreen logo`.

## Setup

1. Install dependencies

```bash
pnpm install
```

2. Create env file

```bash
cp apps/web/.env.example apps/web/.env.local
```

Set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)

3. Apply database schema

- Open Supabase SQL Editor
- Paste and run `supabase/schema.sql`
- Set admin user via `supabase/admin-setup.sql` (replace UUID first)

4. Auth redirect URLs (Supabase Auth -> URL Configuration)

Add at minimum:

- `http://localhost:5173/reset-password`
- your production `/reset-password` URL

See `supabase/checklist.md` for the complete finalization checklist.

5. Start development

```bash
pnpm dev
```

Landing env (optional, only for `apps/landing`):

```bash
cp apps/landing/.env.example apps/landing/.env.local
```

Set:

- `VITE_SIGN_IN_URL` (Sign in target URL)
- `VITE_LOGO_URL` (optional: hosted final logo URL)

## Scripts

- `pnpm dev` - run web app
- `pnpm dev:landing` - run landing app
- `pnpm build:landing` - build landing app
- `pnpm build` - build all packages
- `pnpm typecheck` - type-check all packages
- `pnpm lint` - lint all packages
- `pnpm format` - run Prettier

## Landing App

### Run locally

```bash
pnpm install
pnpm --filter @evergreen/landing dev
```

Landing runs at Vite default (typically `http://localhost:5173`).

### Deploy landing independently on Vercel (monorepo)

1. Create a new Vercel project from this repository.
2. In Project Settings:
- Framework Preset: `Vite`
- Root Directory: `apps/landing`
- Install Command: `pnpm install`
- Build Command: `pnpm --filter @evergreen/landing build`
- Output Directory: `dist`
3. Add environment variables:
- `VITE_APP_BASE_URL` = `https://evergreen-garden-services-web.vercel.app`
- `VITE_SIGN_IN_URL` = optional (absolute URL or `/login`, defaults to `${VITE_APP_BASE_URL}/login`)
- `VITE_LOGO_URL` = optional hosted logo URL
4. Deploy.

### Logo replacement

Single replacement points:

- `apps/landing/src/components/BrandLogo.tsx` (`DEFAULT_LOGO_URL` source)
- `apps/landing/src/assets/logo-placeholder.svg` (local fallback asset)

Set `VITE_LOGO_URL` for one-line logo swap without changing component markup.

### Auth link adjustment

Landing auth links are in `apps/landing/src/lib/app-links.ts`.
Current routes match the web app: `/signup` and `/login`.

## Admin Role Setup

Create a user through the app, then run in Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = 'USER_UUID_HERE';
```

Use your real auth user UUID.

## Core Flows

Customer:

- `/signup`, `/login`, `/reset-password`
- `/profile` must be completed before booking
- `/book`, `/bookings`, `/quotes`, `/invoices`
- quote accept/decline
- invoice print/download (browser print)
- EFT proof upload to private `documents` bucket

Admin:

- `/admin/dashboard`
- `/admin/customers`
- `/admin/bookings`
- `/admin/quotes`
- `/admin/invoices`
- `/admin/settings`

### Invoice Email Sending (Automatic on Create)

When an admin creates an invoice (from Invoices screen or from Quote), the app:

- marks it as `sent` (so it appears on the client side app)
- calls Supabase Edge Function: `send-invoice-email`

Deploy and configure:

```bash
supabase functions deploy send-invoice-email
```

Set function secrets:

- `RESEND_API_KEY`
- `INVOICE_FROM_EMAIL` (example: `Evergreen Garden <billing@yourdomain.com>`)
- `APP_URL` (example: `http://localhost:5173` or production app URL)

The function source is at:

- `supabase/functions/send-invoice-email/index.ts`

## PWA

- Manifest: `apps/web/public/manifest.webmanifest`
- Service worker: `apps/web/public/sw.js`
- Icons: `apps/web/public/icons/`

## Supabase Notes

- RLS is enabled on all business tables.
- `public.is_admin()` is used in policies and RPC authorization.
- Role escalation is blocked by trigger (`protect_profile_role`).
- Numbering is generated by DB functions to avoid duplicate quote/invoice numbers.
- Bucket `documents` is private, with policies for admin access and customer own POP paths.
