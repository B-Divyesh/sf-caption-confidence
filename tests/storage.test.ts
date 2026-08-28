import { describe, expect, it } from 'vitest';
import { sanitizeSettings } from '../lib/storage';

describe('settings sanitization', () => {
  it('uses defaults for invalid input and clamps ranges', () => {
    const settings = sanitizeSettings({ fontSize: 200, replayLead: -5, appearance: 'neon' });
    expect(settings.fontSize).toBe(48);
    expect(settings.replayLead).toBe(0);
    expect(settings.appearance).toBe('standard');
  });

  it('keeps valid local preferences', () => {
    expect(sanitizeSettings({ pairsText: 'see / she', appearance: 'moss', showTiming: false })).toMatchObject({
      pairsText: 'see / she', appearance: 'moss', showTiming: false
    });
  });
});
