import { emphasizeText, markTimingStrain, parseCaptions, parsePairs } from '../lib/captions';
import type { CaptionCue } from '../lib/types';

const DEMO_PREFIX = 'demo:caption-confidence:';
const DEFAULT_PAIRS = 'sip / ship\nfine / vine\ntin / kin';
const SAMPLE_CUES: CaptionCue[] = markTimingStrain([
  { id: 'arrival', start: 0.8, end: 3.8, text: 'The last ship leaves from pier six.', sourceUncertain: false, timingStrain: false },
  { id: 'wire', start: 4.2, end: 6.0, text: 'Please bring the fine wire to the lab.', sourceUncertain: false, timingStrain: false },
  { id: 'case', start: 5.8, end: 8.7, text: 'Take the tin case by the door.', sourceUncertain: false, timingStrain: false },
  { id: 'gate', start: 9.1, end: 12.2, text: 'The line after gate nine is unclear.', sourceUncertain: true, timingStrain: false }
]);

const caption = document.querySelector<HTMLElement>('#demo-caption')!;
const cueList = document.querySelector<HTMLOListElement>('#cue-list')!;
const pairInput = document.querySelector<HTMLTextAreaElement>('#demo-pairs')!;
const sizeSelect = document.querySelector<HTMLSelectElement>('#demo-size')!;
const timingInput = document.querySelector<HTMLInputElement>('#demo-timing')!;
const demoStage = document.querySelector<HTMLElement>('.demo-stage')!;
const playbackPosition = document.querySelector<HTMLOutputElement>('#playback-position')!;
const demoStatus = document.querySelector<HTMLElement>('#demo-status')!;
const importStatus = document.querySelector<HTMLElement>('#import-status')!;
const fileInput = document.querySelector<HTMLInputElement>('#demo-file')!;

let cues = SAMPLE_CUES.map((cue) => ({ ...cue }));
let currentIndex = 0;
let position = cues[0].start;

function timeLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return `${String(minutes).padStart(2, '0')}:${remainder.toFixed(1).padStart(4, '0')}`;
}

function flagsFor(cue: CaptionCue): string {
  const flags = [
    cue.sourceUncertain ? '<span class="caption-flag">source says uncertain</span>' : '',
    timingInput.checked && cue.timingStrain ? '<span class="caption-flag timing">tight timing</span>' : ''
  ];
  return flags.filter(Boolean).join('');
}

function cueMarkup(cue: CaptionCue): string {
  return `${emphasizeText(cue.text, parsePairs(pairInput.value))}${flagsFor(cue)}`;
}

function render(): void {
  const current = cues[currentIndex];
  demoStage.dataset.size = sizeSelect.value;
  caption.innerHTML = cueMarkup(current);
  playbackPosition.value = timeLabel(position);
  cueList.replaceChildren(...cues.map((cue, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.index = String(index);
    button.setAttribute('aria-current', index === currentIndex ? 'true' : 'false');
    button.innerHTML = `<span>${timeLabel(cue.start)}</span><span>${cueMarkup(cue)}</span>`;
    item.append(button);
    return item;
  }));
}

function selectCue(index: number): void {
  currentIndex = (index + cues.length) % cues.length;
  position = cues[currentIndex].start + 0.6;
  render();
  demoStatus.textContent = `Caption ${currentIndex + 1} of ${cues.length} selected.`;
}

function replay(): void {
  position = Math.max(0, cues[currentIndex].start - 0.8);
  render();
  demoStatus.textContent = `Replaying caption ${currentIndex + 1} from ${timeLabel(position)}.`;
}

function resetDemo(): void {
  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(DEMO_PREFIX)) sessionStorage.removeItem(key);
  }
  sessionStorage.setItem(`${DEMO_PREFIX}active`, 'true');
  cues = SAMPLE_CUES.map((cue) => ({ ...cue }));
  currentIndex = 0;
  position = cues[0].start;
  pairInput.value = DEFAULT_PAIRS;
  sizeSelect.value = '30';
  timingInput.checked = true;
  fileInput.value = '';
  importStatus.textContent = 'The four sample lines stay loaded until you choose a file.';
  demoStatus.textContent = 'Demo reset. Sample caption 1 of 4 is ready.';
  render();
}

pairInput.addEventListener('input', render);
sizeSelect.addEventListener('change', render);
timingInput.addEventListener('change', render);
document.querySelector('#previous-cue')?.addEventListener('click', () => selectCue(currentIndex - 1));
document.querySelector('#next-cue')?.addEventListener('click', () => selectCue(currentIndex + 1));
document.querySelector('#replay-cue')?.addEventListener('click', replay);
document.querySelector('#reset-demo')?.addEventListener('click', resetDemo);
cueList.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-index]');
  if (button) selectCue(Number(button.dataset.index));
});

document.querySelector('#start-real')?.addEventListener('click', () => {
  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(DEMO_PREFIX)) sessionStorage.removeItem(key);
  }
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  importStatus.textContent = 'Reading the caption file in this tab…';
  try {
    if (!/\.(vtt|srt)$/i.test(file.name)) throw new Error('Choose a file ending in .vtt or .srt.');
    if (file.size > 5_000_000) throw new Error('That file is over 5 MB. Choose a smaller caption file.');
    cues = parseCaptions(await file.text());
    currentIndex = 0;
    position = cues[0].start;
    render();
    importStatus.textContent = `${file.name} loaded in this tab with ${cues.length} caption ${cues.length === 1 ? 'line' : 'lines'}.`;
    demoStatus.textContent = `Imported caption 1 of ${cues.length} is ready.`;
  } catch (error) {
    importStatus.textContent = error instanceof Error ? error.message : 'The caption file could not be read.';
  } finally {
    fileInput.value = '';
  }
});

document.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement | null;
  const isTyping = target?.matches('input, textarea, select, [contenteditable="true"]');
  if (!isTyping && !event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLocaleLowerCase() === 'r') {
    event.preventDefault();
    replay();
  }
});

const offline = document.querySelector<HTMLElement>('#offline');
function updateOnlineState(): void {
  if (offline) offline.hidden = navigator.onLine;
}
window.addEventListener('online', updateOnlineState);
window.addEventListener('offline', updateOnlineState);
updateOnlineState();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
}

sessionStorage.setItem(`${DEMO_PREFIX}active`, 'true');
render();
