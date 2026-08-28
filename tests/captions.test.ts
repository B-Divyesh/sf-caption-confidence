import { describe, expect, it } from 'vitest';
import { emphasizeText, matchingTerms, parseCaptions, parsePairs, timestampToSeconds } from '../lib/captions';

describe('caption parsing', () => {
  it('parses SRT timestamps and strips safe formatting', () => {
    const cues = parseCaptions(`1\n00:00:01,000 --> 00:00:03,200\nThe <i>ship</i> is here.\n\n2\n00:00:03,100 --> 00:00:03,500\n[?] Fine.\n`);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toMatchObject({ start: 1, end: 3.2, text: 'The ship is here.' });
    expect(cues[1].sourceUncertain).toBe(true);
    expect(cues[1].timingStrain).toBe(true);
  });

  it('parses WEBVTT headers, identifiers, and cue settings', () => {
    const cues = parseCaptions(`WEBVTT\n\nintro\n00:01.000 --> 00:03.000 position:50%\nSip, then stop.\n`);
    expect(cues[0]).toMatchObject({ id: 'intro', start: 1, end: 3, text: 'Sip, then stop.' });
  });

  it('rejects empty and untimed files with useful messages', () => {
    expect(() => parseCaptions('')).toThrow(/empty/);
    expect(() => parseCaptions('plain transcript')).toThrow(/No timed captions/);
  });

  it('validates timestamp bounds', () => {
    expect(timestampToSeconds('01:02:03.450')).toBe(3723.45);
    expect(timestampToSeconds('00:99.000')).toBeNull();
  });
});

describe('word pair emphasis', () => {
  const pairs = parsePairs('sip / ship\nfine / vine\ninvalid');

  it('matches exact words without marking substrings', () => {
    expect([...matchingTerms('A ship is shipping a sip.', pairs)]).toEqual(['ship', 'sip']);
  });

  it('escapes caption markup before adding marks', () => {
    expect(emphasizeText('<script> ship & sip', pairs)).toBe('&lt;script&gt; <mark>ship</mark> &amp; <mark>sip</mark>');
  });
});
