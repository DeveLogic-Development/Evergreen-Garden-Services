const defaultAppBaseUrl = 'https://evergreen-garden-services-web.vercel.app';
const envAppBaseUrl = (import.meta.env.VITE_APP_BASE_URL as string | undefined)?.trim() || defaultAppBaseUrl;
const envSignInUrl = (import.meta.env.VITE_SIGN_IN_URL as string | undefined)?.trim();

function toAbsoluteUrl(value: string | undefined, fallbackPath: string): string {
  const safeBase = envAppBaseUrl.endsWith('/') ? envAppBaseUrl : `${envAppBaseUrl}/`;
  if (!value) {
    return new URL(fallbackPath, safeBase).toString();
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (value.startsWith('/')) {
    return new URL(value, safeBase).toString();
  }
  return new URL(fallbackPath, safeBase).toString();
}

export const appLinks = {
  signin: toAbsoluteUrl(envSignInUrl, '/login'),
};
