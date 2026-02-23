# Evergreen Landing (`apps/landing`)

Single-page marketing website built with React + TypeScript + Tailwind, with GSAP ScrollTrigger motion and Swiper sliders.

## Run locally

From repo root:

```bash
pnpm install
pnpm dev:landing
```

Build only landing:

```bash
pnpm --filter @evergreen/landing build
```

## Test email locally (contact form)

Use Vercel local dev so `/api/contact` runs (plain `vite` dev does not run `api/*` routes).

From repo root:

```bash
pnpm dev:landing:email
```

Open `http://localhost:3001`.

Required local env in `apps/landing/.env.local`:

- `SMTP_USER=jsuperman55@gmail.com`
- `SMTP_PASS=<Gmail App Password>`
- `EMAIL_FROM=jsuperman55@gmail.com` (optional)
- `CONTACT_TO_EMAIL=jsuperman55@gmail.com` (optional)

Quick API smoke test:

```bash
curl -X POST http://localhost:3001/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Local Test","area":"Cape Town","service":"Garden maintenance","message":"Local contact form email test"}'
```

## Environment

Create `apps/landing/.env.local`:

```bash
cp apps/landing/.env.example apps/landing/.env.local
```

Variables:

- `VITE_APP_BASE_URL` (default: `https://evergreen-garden-services-web.vercel.app`)
  - Base URL for the separate web app deployment.
- `VITE_SIGN_IN_URL` (optional)
  - If absolute (`https://...`) it is used directly.
  - If relative (`/login`) it is resolved against `VITE_APP_BASE_URL`.
  - If omitted, it defaults to `${VITE_APP_BASE_URL}/login`.
- `VITE_LOGO_URL` (optional)
  - Set this to replace the placeholder logo quickly.
- `SMTP_USER`, `SMTP_PASS`
  - Gmail SMTP credentials for `/api/contact` (use a Gmail App Password, not your normal password).
- `EMAIL_FROM` (optional)
  - Defaults to `SMTP_USER`.
- `CONTACT_TO_EMAIL` (optional)
  - Defaults to `jsuperman55@gmail.com` (temporary recipient).

## Deploy independently on Vercel (monorepo)

Create a separate Vercel project pointing to this repo, then use:

- Framework Preset: `Vite`
- Root Directory: `apps/landing`
- Install Command: `pnpm install`
- Build Command: `pnpm --filter @evergreen/landing build`
- Output Directory: `dist`

Add env vars in Vercel:

- `VITE_APP_BASE_URL`
- `VITE_SIGN_IN_URL`
- `VITE_LOGO_URL` (optional)
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM` (optional)
- `CONTACT_TO_EMAIL` (optional)

## Brand tokens

This app imports the shared token source from `@evergreen/theme`:

- CSS tokens: `packages/theme/theme.css`
- Tailwind preset: `packages/theme/tailwind-preset.js`

## Logo replacement

Primary logo component:

- `apps/landing/src/components/BrandLogo.tsx`

Set `VITE_LOGO_URL` to swap to your real brand asset.
