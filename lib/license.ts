const LICENSE_KEY = 'supporterLicense';
const VERDICT_KEY = 'supporterVerdict';
const VERIFY_URL = 'https://api.sociobot.in/api/v1/products/caption-confidence/verify';
const DAY = 86_400_000;

export interface LicenseState {
  valid: boolean;
  reason: string;
  checkedAt: number;
  offline?: boolean;
}

export async function getLicense(): Promise<string> {
  return (await chrome.storage.local.get(LICENSE_KEY))[LICENSE_KEY] ?? '';
}

export async function storeLicense(token: string): Promise<void> {
  await chrome.storage.local.set({ [LICENSE_KEY]: token.trim() });
}

export async function cachedLicenseState(): Promise<LicenseState | null> {
  const value = (await chrome.storage.local.get(VERDICT_KEY))[VERDICT_KEY];
  return value && typeof value === 'object' ? value as LicenseState : null;
}

export async function verifyLicense(force = false): Promise<LicenseState> {
  const token = await getLicense();
  const cached = await cachedLicenseState();
  if (!token) return { valid: false, reason: 'missing', checkedAt: 0 };
  if (!force && cached && Date.now() - cached.checkedAt < DAY) return cached;
  try {
    const response = await fetch(`${VERIFY_URL}?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('unavailable');
    const result = await response.json() as { valid: boolean; reason: string };
    const state = { valid: result.valid, reason: result.reason, checkedAt: Date.now() };
    await chrome.storage.local.set({ [VERDICT_KEY]: state });
    return state;
  } catch {
    return cached?.valid
      ? { ...cached, offline: true }
      : { valid: false, reason: 'unavailable', checkedAt: cached?.checkedAt ?? 0, offline: true };
  }
}
