export interface CaptionCue {
  id: string;
  start: number;
  end: number;
  text: string;
  sourceUncertain: boolean;
  timingStrain: boolean;
}

export interface ConfusionPair {
  left: string;
  right: string;
}

export interface CaptionSettings {
  pairsText: string;
  fontSize: number;
  replayLead: number;
  showTiming: boolean;
  overlayEnabled: boolean;
  appearance: 'standard' | 'moss' | 'paper';
}

export const DEFAULT_SETTINGS: CaptionSettings = {
  pairsText: 'sip / ship\nfine / vine\ntin / kin',
  fontSize: 30,
  replayLead: 0.8,
  showTiming: true,
  overlayEnabled: true,
  appearance: 'standard'
};
