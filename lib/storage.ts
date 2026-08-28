import { DEFAULT_SETTINGS, type CaptionSettings } from './types';

const SETTINGS_KEY = 'captionSettings';

export function sanitizeSettings(value: unknown): CaptionSettings {
  const input = value && typeof value === 'object' ? value as Partial<CaptionSettings> : {};
  return {
    pairsText: typeof input.pairsText === 'string' ? input.pairsText.slice(0, 1000) : DEFAULT_SETTINGS.pairsText,
    fontSize: clampNumber(input.fontSize, 20, 48, DEFAULT_SETTINGS.fontSize),
    replayLead: clampNumber(input.replayLead, 0, 3, DEFAULT_SETTINGS.replayLead),
    showTiming: typeof input.showTiming === 'boolean' ? input.showTiming : DEFAULT_SETTINGS.showTiming,
    overlayEnabled: typeof input.overlayEnabled === 'boolean' ? input.overlayEnabled : DEFAULT_SETTINGS.overlayEnabled,
    appearance: input.appearance === 'moss' || input.appearance === 'paper' ? input.appearance : 'standard'
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export async function loadSettings(): Promise<CaptionSettings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return sanitizeSettings(stored[SETTINGS_KEY]);
}

export async function saveSettings(settings: CaptionSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: sanitizeSettings(settings) });
}
