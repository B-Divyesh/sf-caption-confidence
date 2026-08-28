const LICENSE_KEY = 'sb_license:caption-confidence';
const VERDICT_KEY = 'sb_license_verdict:caption-confidence';
const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'https://pilot-api.sociobot.in/api/v1'
  : 'https://api.sociobot.in/api/v1';
const DAY = 86_400_000;

interface Verdict { valid: boolean; checkedAt: number; reason?: string }

const statusElement = document.querySelector<HTMLElement>('#license-status');
const restoreForm = document.querySelector<HTMLFormElement>('#restore-form');
const licenseInput = document.querySelector<HTMLInputElement>('#license');

function readVerdict(): Verdict | null {
  try { return JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null') as Verdict | null; }
  catch { return null; }
}

function renderLicense(valid: boolean, note?: string): void {
  if (!statusElement) return;
  document.documentElement.dataset.supporter = valid ? 'true' : 'false';
  statusElement.textContent = valid
    ? note ?? 'Supporter license active. Paste this license into the extension to unlock appearance profiles.'
    : note ?? 'The free extension works without a license.';
}

async function verifyLicense(token: string, force = false): Promise<boolean> {
  const cached = readVerdict();
  if (!force && cached && Date.now() - cached.checkedAt < DAY) {
    renderLicense(cached.valid);
    return cached.valid;
  }
  if (!navigator.onLine) {
    if (cached?.valid) renderLicense(true, 'Supporter license active from the last check. Verification will resume online.');
    else renderLicense(false, 'You’re offline. The license can be checked when your connection returns.');
    return Boolean(cached?.valid);
  }
  if (statusElement) statusElement.textContent = 'Checking the license…';
  try {
    const response = await fetch(`${API_BASE}/products/caption-confidence/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification service unavailable');
    const result = await response.json() as { valid: boolean; reason?: string };
    const verdict = { valid: result.valid, reason: result.reason, checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict));
    renderLicense(result.valid, result.valid ? undefined : 'License no longer active. Check the token or purchase a new license.');
    return result.valid;
  } catch {
    renderLicense(Boolean(cached?.valid), cached?.valid ? 'Using the last valid license check while verification is unavailable.' : 'Could not verify right now. The free extension is still available.');
    return Boolean(cached?.valid);
  }
}

const returnedLicense = new URLSearchParams(location.search).get('license');
if (returnedLicense) {
  localStorage.setItem(LICENSE_KEY, returnedLicense);
  history.replaceState({}, '', `${location.pathname}${location.hash}`);
}
const savedLicense = returnedLicense ?? localStorage.getItem(LICENSE_KEY);
const cached = readVerdict();
if (cached?.valid) renderLicense(true, 'Supporter access restored from this device. Rechecking quietly…');
if (savedLicense) void verifyLicense(savedLicense, Boolean(returnedLicense));

restoreForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const token = licenseInput?.value.trim();
  if (!token) return;
  localStorage.setItem(LICENSE_KEY, token);
  void verifyLicense(token, true);
});

const offline = document.querySelector<HTMLElement>('#offline');
function updateOnlineState(): void { if (offline) offline.hidden = navigator.onLine; }
window.addEventListener('online', updateOnlineState);
window.addEventListener('offline', updateOnlineState);
updateOnlineState();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
}
