export const DEFAULT_SERVICE_AREAS = [
  'Hartenbos',
  'Hartenbos Heuwels',
  'Hartenbosrif',
  'Bayview',
  'Menkenkop',
  'Voorbaai',
  'De Bakke',
  'Heiderand',
  'Aalwyndal',
  "D'Almeida",
  'Mossel Bay Central',
  'Diaz Beach',
  'Dana Bay',
  'Tergniet',
  'Reebok',
  'Fraai Uitsig',
  'Klein Brak River',
  'Great Brak River',
  'Outeniqua Strand',
  'Glentana',
] as const;

export const SERVICE_AREAS = [...DEFAULT_SERVICE_AREAS];

export type ServiceArea = (typeof DEFAULT_SERVICE_AREAS)[number];

const WESTERN_CAPE_SUFFIX = 'Western Cape';

export function resolveServiceAreas(customAreas: string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const area of [...DEFAULT_SERVICE_AREAS, ...(customAreas ?? [])]) {
    const value = area.trim();
    if (!value) {
      continue;
    }
    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(value);
  }

  return normalized;
}

export function composeServiceAddress(streetAddress: string, area: string): string {
  return `${streetAddress.trim()}, ${area}, ${WESTERN_CAPE_SUFFIX}`;
}

export function parseServiceAddress(
  value: string | null | undefined,
  allowedAreas?: string[] | null,
): { streetAddress: string; area: string } {
  if (!value) {
    return { streetAddress: '', area: '' };
  }

  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return { streetAddress: value.trim(), area: '' };
  }

  let normalizedParts = [...parts];
  const lastPart = normalizedParts.at(-1)?.toLowerCase();
  if (lastPart === WESTERN_CAPE_SUFFIX.toLowerCase()) {
    normalizedParts = normalizedParts.slice(0, -1);
  }

  const area = normalizedParts.at(-1) ?? '';
  const streetAddress = normalizedParts.slice(0, -1).join(', ').trim();

  const areas = resolveServiceAreas(allowedAreas);
  const matchedArea = areas.find((allowedArea) => allowedArea.toLowerCase() === area.toLowerCase());
  if (!matchedArea) {
    return { streetAddress: value.trim(), area: '' };
  }

  return { streetAddress, area: matchedArea };
}
