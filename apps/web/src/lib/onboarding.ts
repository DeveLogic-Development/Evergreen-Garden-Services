const ONBOARDING_KEY_PREFIX = 'egs_onboarding_complete';

function keyForUser(userId: string): string {
  return `${ONBOARDING_KEY_PREFIX}:${userId}`;
}

export function hasCompletedOnboarding(userId: string | null | undefined): boolean {
  if (!userId) {
    return false;
  }
  try {
    return window.localStorage.getItem(keyForUser(userId)) === 'true';
  } catch {
    return false;
  }
}

export function setOnboardingComplete(userId: string | null | undefined, value: boolean): void {
  if (!userId) {
    return;
  }
  try {
    window.localStorage.setItem(keyForUser(userId), value ? 'true' : 'false');
  } catch {
    // no-op
  }
}
