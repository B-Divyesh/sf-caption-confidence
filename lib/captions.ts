import type { CaptionCue, ConfusionPair } from './types';

const timestampPattern = /^(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3})$/;

export function timestampToSeconds(raw: string): number | null {
  const match = raw.trim().match(timestampPattern);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const milliseconds = Number(match[4]);
  if (minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

function cleanCaptionText(raw: string): { text: string; uncertain: boolean } {
  const uncertain = /\[\?\]|\((?:unclear|inaudible)\)|<c[ .][^>]*(?:low|uncertain)/i.test(raw);
  const withoutTags = raw
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { text: withoutTags, uncertain };
}

export function markTimingStrain(cues: CaptionCue[]): CaptionCue[] {
  return cues.map((cue, index) => {
    const duration = cue.end - cue.start;
    const words = cue.text.split(/\s+/).filter(Boolean).length;
    const previous = cues[index - 1];
    const overlaps = Boolean(previous && cue.start < previous.end - 0.05);
    const tooCompressed = duration < Math.max(0.7, words * 0.28);
    return { ...cue, timingStrain: overlaps || tooCompressed };
  });
}

export function parseCaptions(input: string): CaptionCue[] {
  const normalized = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  if (!normalized) throw new Error('The caption file is empty. Choose a VTT or SRT file with timed cues.');
  const lines = normalized.split('\n');
  if (lines[0]?.trim().startsWith('WEBVTT')) lines.shift();

  const cues: CaptionCue[] = [];
  let index = 0;
  while (index < lines.length) {
    while (index < lines.length && !lines[index].trim()) index += 1;
    if (index >= lines.length) break;
    if (/^(NOTE|STYLE|REGION)(?:\s|$)/.test(lines[index].trim())) {
      index += 1;
      while (index < lines.length && lines[index].trim()) index += 1;
      continue;
    }

    let id = String(cues.length + 1);
    let timingLine = lines[index].trim();
    if (!timingLine.includes('-->')) {
      id = timingLine;
      index += 1;
      timingLine = lines[index]?.trim() ?? '';
    }
    const timing = timingLine.match(/^(\S+)\s+-->\s+(\S+)/);
    if (!timing) {
      index += 1;
      continue;
    }
    const start = timestampToSeconds(timing[1]);
    const end = timestampToSeconds(timing[2]);
    index += 1;
    const textLines: string[] = [];
    while (index < lines.length && lines[index].trim()) {
      textLines.push(lines[index]);
      index += 1;
    }
    if (start === null || end === null || end <= start) continue;
    const cleaned = cleanCaptionText(textLines.join(' '));
    if (!cleaned.text) continue;
    cues.push({ id, start, end, text: cleaned.text, sourceUncertain: cleaned.uncertain, timingStrain: false });
  }

  if (!cues.length) throw new Error('No timed captions were found. Check that the file is valid VTT or SRT.');
  return markTimingStrain(cues.sort((a, b) => a.start - b.start));
}

export function parsePairs(value: string): ConfusionPair[] {
  return value
    .split(/\n|,/)
    .map((line) => line.split('/').map((part) => part.trim().toLocaleLowerCase()))
    .filter((parts): parts is [string, string] => parts.length === 2 && parts.every(Boolean))
    .map(([left, right]) => ({ left, right }));
}

export function matchingTerms(text: string, pairs: ConfusionPair[]): Set<string> {
  const words = text.toLocaleLowerCase().match(/[\p{L}\p{N}'’-]+/gu) ?? [];
  const candidates = new Set(pairs.flatMap((pair) => [pair.left, pair.right]));
  return new Set(words.filter((word) => candidates.has(word)));
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character] ?? character);
}

export function emphasizeText(text: string, pairs: ConfusionPair[]): string {
  const matches = matchingTerms(text, pairs);
  return text.split(/([\p{L}\p{N}'’-]+)/gu).map((part) => {
    const safe = escapeHtml(part);
    return matches.has(part.toLocaleLowerCase()) ? `<mark>${safe}</mark>` : safe;
  }).join('');
}
