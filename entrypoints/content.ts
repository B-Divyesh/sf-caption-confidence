import { emphasizeText, markTimingStrain, parsePairs } from '../lib/captions';
import { loadSettings } from '../lib/storage';
import type { CaptionCue, CaptionSettings } from '../lib/types';

type IncomingMessage =
  | { type: 'CC_LOAD_CUES'; cues: CaptionCue[]; name: string }
  | { type: 'CC_USE_TRACK' }
  | { type: 'CC_SETTINGS'; settings: CaptionSettings }
  | { type: 'CC_REPLAY' }
  | { type: 'CC_STATE' };

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  main() {
    let cues: CaptionCue[] = [];
    let sourceName = '';
    let settings: CaptionSettings;
    let activeCue: CaptionCue | null = null;
    let selectedVideo: HTMLVideoElement | null = null;
    let timer: number | undefined;

    const host = document.createElement('div');
    host.id = 'caption-confidence-root';
    host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;pointer-events:none;display:none;';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .caption { box-sizing: border-box; max-width: min(900px, calc(100vw - 24px)); margin: auto; padding: 12px 18px 14px; color: #fffdf4; background: rgba(16,20,16,.95); border: 2px solid #d6e35a; border-radius: 2px; box-shadow: 5px 5px 0 rgba(0,0,0,.55); font: 700 30px/1.35 Georgia, serif; letter-spacing: .01em; text-align: center; text-wrap: balance; opacity: 0; transform: translateY(8px); transition: opacity 140ms ease, transform 180ms ease; }
        .caption.visible { opacity: 1; transform: translateY(0); }
        .caption.theme-moss { background: rgba(29,54,29,.96); border-color: #fffdf4; }
        .caption.theme-paper { color: #171b17; background: rgba(255,253,244,.97); border-color: #171b17; box-shadow: 5px 5px 0 rgba(50,92,50,.8); }
        .caption.theme-paper .flag { color: #171b17; }
        mark { color: #101410; background: #d6e35a; padding: 0 .1em; border-bottom: .14em solid #fffdf4; font-weight: 900; }
        .flag { display: inline-block; margin-inline-start: .65em; color: #fffdf4; border-bottom: .18em repeating-linear-gradient(90deg,#e28a61 0 5px,transparent 5px 8px); font: 700 12px/1.5 ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; vertical-align: .3em; }
        @media (max-width: 520px) { .caption { padding: 10px 12px 12px; box-shadow: 3px 3px 0 rgba(0,0,0,.55); } }
        @media (prefers-reduced-motion: reduce) { .caption { transition: none; transform: none; } }
      </style>
      <div class="caption" role="status" aria-live="polite" aria-atomic="true"></div>`;
    const caption = shadow.querySelector<HTMLDivElement>('.caption')!;
    document.documentElement.append(host);

    function findVideo(): HTMLVideoElement | null {
      const candidates = [...document.querySelectorAll('video')].filter((video) => {
        const rect = video.getBoundingClientRect();
        return rect.width >= 200 && rect.height >= 100;
      });
      return candidates.sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return br.width * br.height - ar.width * ar.height;
      })[0] ?? null;
    }

    function placeOverlay(): void {
      if (!selectedVideo) return;
      const rect = selectedVideo.getBoundingClientRect();
      const width = Math.max(0, Math.min(rect.width - 24, 900));
      host.style.left = `${Math.max(12, rect.left + (rect.width - width) / 2)}px`;
      host.style.width = `${width}px`;
      host.style.bottom = `${Math.max(12, window.innerHeight - rect.bottom + Math.min(34, rect.height * .08))}px`;
    }

    function showCue(cue: CaptionCue | null): void {
      activeCue = cue;
      if (!cue || !settings.overlayEnabled) {
        caption.classList.remove('visible');
        host.style.display = 'none';
        return;
      }
      caption.style.fontSize = `${settings.fontSize}px`;
      caption.className = `caption theme-${settings.appearance}`;
      const pairMarkup = emphasizeText(cue.text, parsePairs(settings.pairsText));
      const flags = [
        cue.sourceUncertain ? '<span class="flag">source says uncertain</span>' : '',
        settings.showTiming && cue.timingStrain ? '<span class="flag">tight timing</span>' : ''
      ].join('');
      caption.innerHTML = `${pairMarkup}${flags}`;
      host.style.display = 'block';
      placeOverlay();
      requestAnimationFrame(() => caption.classList.add('visible'));
    }

    function update(): void {
      if (!selectedVideo || !cues.length) return showCue(null);
      const time = selectedVideo.currentTime;
      const current = cues.find((cue) => time >= cue.start && time <= cue.end) ?? null;
      if (current?.id !== activeCue?.id) showCue(current);
      else if (current) placeOverlay();
    }

    function connectVideo(): HTMLVideoElement {
      const video = findVideo();
      if (!video) throw new Error('No visible HTML5 video was found on this page. Start the video, then try again.');
      if (selectedVideo !== video) {
        if (selectedVideo) {
          selectedVideo.removeEventListener('timeupdate', update);
          selectedVideo.removeEventListener('seeked', update);
        }
        selectedVideo = video;
        video.addEventListener('timeupdate', update);
        video.addEventListener('seeked', update);
      }
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(update, 120);
      return video;
    }

    function replay(): { ok: boolean; message: string } {
      const video = selectedVideo ?? findVideo();
      if (!video || !activeCue) return { ok: false, message: 'Play into a caption first, then press R to replay it.' };
      video.currentTime = Math.max(0, activeCue.start - settings.replayLead);
      void video.play().catch(() => undefined);
      return { ok: true, message: 'Replaying the current caption.' };
    }

    function readPageTrack(): { cues: CaptionCue[]; label: string } {
      const video = connectVideo();
      const tracks = [...video.textTracks];
      const track = tracks.find((candidate) => candidate.kind === 'captions' && candidate.mode === 'showing')
        ?? tracks.find((candidate) => candidate.kind === 'subtitles' && candidate.mode === 'showing')
        ?? tracks.find((candidate) => candidate.kind === 'captions' || candidate.kind === 'subtitles');
      if (!track) throw new Error('This video does not expose an accessible caption track. Import its VTT or SRT file instead.');
      track.mode = 'hidden';
      const nativeCues = [...(track.cues ?? [])];
      if (!nativeCues.length) throw new Error('The exposed track has no loaded cues yet. Play the video briefly, then try again.');
      const mapped = nativeCues.map((cue, index): CaptionCue => {
        const textCue = cue as VTTCue;
        const raw = textCue.text ?? '';
        return {
          id: cue.id || String(index + 1),
          start: cue.startTime,
          end: cue.endTime,
          text: raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
          sourceUncertain: /\[\?\]|\((?:unclear|inaudible)\)|<c[ .][^>]*(?:low|uncertain)/i.test(raw),
          timingStrain: false
        };
      }).filter((cue) => cue.text);
      return { cues: markTimingStrain(mapped), label: track.label || track.language || 'page track' };
    }

    void loadSettings().then((loaded) => { settings = loaded; }).catch(() => undefined);

    chrome.runtime.onMessage.addListener((message: IncomingMessage, _sender, respond) => {
      void (async () => {
        settings ??= await loadSettings();
        if (message.type === 'CC_LOAD_CUES') {
          cues = markTimingStrain(message.cues);
          sourceName = message.name;
          connectVideo();
          update();
          return { ok: true, cueCount: cues.length, sourceName };
        }
        if (message.type === 'CC_USE_TRACK') {
          const result = readPageTrack();
          cues = result.cues;
          sourceName = result.label;
          update();
          return { ok: true, cueCount: cues.length, sourceName };
        }
        if (message.type === 'CC_SETTINGS') {
          settings = message.settings;
          update();
          return { ok: true };
        }
        if (message.type === 'CC_REPLAY') return replay();
        return {
          ok: true,
          hasVideo: Boolean(findVideo()),
          cueCount: cues.length,
          sourceName,
          overlayEnabled: settings.overlayEnabled
        };
      })().then(respond).catch((error: unknown) => respond({
        ok: false,
        message: error instanceof Error ? error.message : 'Caption Confidence could not access this page.'
      }));
      return true;
    });

    window.addEventListener('resize', placeOverlay, { passive: true });
    document.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (!isTyping && !event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLocaleLowerCase() === 'r') {
        const result = replay();
        if (result.ok) event.preventDefault();
      }
    });
  }
});
