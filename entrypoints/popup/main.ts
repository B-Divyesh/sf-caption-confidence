import './style.css';
import { parseCaptions } from '../../lib/captions';
import { cachedLicenseState, getLicense, storeLicense, verifyLicense } from '../../lib/license';
import { loadSettings, saveSettings } from '../../lib/storage';
import type { CaptionSettings } from '../../lib/types';

const fileInput = document.querySelector<HTMLInputElement>('#caption-file')!;
const useTrack = document.querySelector<HTMLButtonElement>('#use-track')!;
const pairs = document.querySelector<HTMLTextAreaElement>('#pairs')!;
const showTiming = document.querySelector<HTMLInputElement>('#show-timing')!;
const overlayEnabled = document.querySelector<HTMLInputElement>('#overlay-enabled')!;
const fontSize = document.querySelector<HTMLInputElement>('#font-size')!;
const replayLead = document.querySelector<HTMLInputElement>('#replay-lead')!;
const fontOutput = document.querySelector<HTMLOutputElement>('#font-output')!;
const replayOutput = document.querySelector<HTMLOutputElement>('#replay-output')!;
const replayButton = document.querySelector<HTMLButtonElement>('#replay')!;
const appearance = document.querySelector<HTMLSelectElement>('#appearance')!;
const licenseForm = document.querySelector<HTMLFormElement>('#license-form')!;
const licenseInput = document.querySelector<HTMLInputElement>('#license')!;
const licenseState = document.querySelector<HTMLElement>('#license-state')!;
const pageState = document.querySelector<HTMLElement>('#page-state')!;
const message = document.querySelector<HTMLElement>('#message')!;

async function activeTab(): Promise<chrome.tabs.Tab | undefined> {
  return (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
}

async function send<T>(payload: object): Promise<T> {
  const tab = await activeTab();
  if (!tab?.id || !/^https?:/.test(tab.url ?? '')) throw new Error('Open a regular web page with an HTML5 video, then try again.');
  try {
    return await chrome.tabs.sendMessage(tab.id, payload) as T;
  } catch {
    throw new Error('This page cannot be accessed. Reload it once after installing the extension.');
  }
}

function announce(text: string, kind: 'success' | 'error' | 'neutral' = 'neutral'): void {
  message.textContent = text;
  message.dataset.kind = kind;
}

function currentSettings(): CaptionSettings {
  return {
    pairsText: pairs.value,
    fontSize: Number(fontSize.value),
    replayLead: Number(replayLead.value),
    showTiming: showTiming.checked,
    overlayEnabled: overlayEnabled.checked,
    appearance: appearance.value as CaptionSettings['appearance']
  };
}

async function initializeLicense(settings: CaptionSettings): Promise<void> {
  const token = await getLicense();
  const cached = await cachedLicenseState();
  const optimistic = Boolean(token && cached?.valid);
  appearance.disabled = !optimistic;
  if (optimistic) licenseState.textContent = 'Supporter active from the last verification.';
  if (!token) return;
  const state = await verifyLicense();
  appearance.disabled = !state.valid;
  licenseState.textContent = state.valid
    ? state.offline ? 'Supporter active from the last check; currently offline.' : 'Supporter license active.'
    : state.reason === 'unavailable' ? 'Could not verify. Caption tools remain available.' : 'License no longer active. Check the token or purchase again.';
  if (!state.valid && settings.appearance !== 'standard') {
    appearance.value = 'standard';
    await persist();
  }
}

async function persist(): Promise<void> {
  const settings = currentSettings();
  await saveSettings(settings);
  fontOutput.value = `${settings.fontSize} px`;
  replayOutput.value = `${settings.replayLead.toFixed(1)} s`;
  await send({ type: 'CC_SETTINGS', settings }).catch(() => undefined);
}

async function initialize(): Promise<void> {
  const settings = await loadSettings();
  pairs.value = settings.pairsText;
  fontSize.value = String(settings.fontSize);
  replayLead.value = String(settings.replayLead);
  showTiming.checked = settings.showTiming;
  overlayEnabled.checked = settings.overlayEnabled;
  appearance.value = settings.appearance;
  fontOutput.value = `${settings.fontSize} px`;
  replayOutput.value = `${settings.replayLead.toFixed(1)} s`;
  await initializeLicense(settings);
  const state = await send<{ ok: boolean; hasVideo: boolean; cueCount: number; sourceName: string; message?: string }>({ type: 'CC_STATE' });
  if (!state.ok) throw new Error(state.message);
  pageState.textContent = state.cueCount
    ? `Connected · ${state.cueCount} cues from ${state.sourceName}`
    : state.hasVideo ? 'Video found · choose a caption source' : 'No visible HTML5 video yet';
  useTrack.disabled = !state.hasVideo;
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  announce('Reading captions…');
  try {
    if (!/\.(vtt|srt)$/i.test(file.name)) throw new Error('Choose a file ending in .vtt or .srt.');
    if (file.size > 5_000_000) throw new Error('That file is over 5 MB. Choose a smaller caption file.');
    const cues = parseCaptions(await file.text());
    const result = await send<{ ok: boolean; cueCount?: number; message?: string }>({ type: 'CC_LOAD_CUES', cues, name: file.name });
    if (!result.ok) throw new Error(result.message);
    pageState.textContent = `Connected · ${result.cueCount} cues from ${file.name}`;
    announce(`Ready. ${result.cueCount} captions loaded locally.`, 'success');
  } catch (error) {
    announce(error instanceof Error ? error.message : 'The caption file could not be read.', 'error');
  } finally {
    fileInput.value = '';
  }
});

useTrack.addEventListener('click', async () => {
  announce('Checking the page caption track…');
  try {
    const result = await send<{ ok: boolean; cueCount?: number; sourceName?: string; message?: string }>({ type: 'CC_USE_TRACK' });
    if (!result.ok) throw new Error(result.message);
    pageState.textContent = `Connected · ${result.cueCount} cues from ${result.sourceName}`;
    announce(`Ready. ${result.cueCount} page captions loaded.`, 'success');
  } catch (error) {
    announce(error instanceof Error ? error.message : 'The page track could not be used.', 'error');
  }
});

replayButton.addEventListener('click', async () => {
  const result = await send<{ ok: boolean; message: string }>({ type: 'CC_REPLAY' }).catch((error: Error) => ({ ok: false, message: error.message }));
  announce(result.message, result.ok ? 'success' : 'error');
});

for (const control of [pairs, showTiming, overlayEnabled, fontSize, replayLead, appearance]) {
  control.addEventListener(control instanceof HTMLTextAreaElement ? 'change' : 'input', () => void persist());
}

licenseForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const token = licenseInput.value.trim();
  if (!token) {
    licenseState.textContent = 'Paste the license from your receipt first.';
    return;
  }
  licenseState.textContent = 'Checking the license…';
  await storeLicense(token);
  const state = await verifyLicense(true);
  appearance.disabled = !state.valid;
  licenseState.textContent = state.valid
    ? 'Supporter license active. Moss and paper are unlocked.'
    : 'That license could not be verified. Check the token and try again.';
  licenseInput.value = '';
});

void initialize().catch((error: Error) => {
  pageState.textContent = 'Not connected';
  useTrack.disabled = true;
  announce(error.message, 'error');
});
