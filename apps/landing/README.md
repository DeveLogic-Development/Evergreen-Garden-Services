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

## Brand tokens

This app imports the shared token source from `@evergreen/theme`:

- CSS tokens: `packages/theme/theme.css`
- Tailwind preset: `packages/theme/tailwind-preset.js`

## Logo replacement

Primary logo component:

- `apps/landing/src/components/BrandLogo.tsx`

Set `VITE_LOGO_URL` to swap to your real brand asset.
