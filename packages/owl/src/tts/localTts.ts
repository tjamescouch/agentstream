import type { TtsResult, VisemeFrame } from '../events/types';

/**
 * v0 local TTS stub: returns a bundled wav file + a canned viseme timeline.
 *
 * NOTE: This is not real TTS. It’s just a deterministic local asset so we can
 * wire the UI and lipsync scheduling.
 */
export function localTtsStub(text: string): TtsResult {
  // Canned timeline: simple open/close envelope.
  const visemes: VisemeFrame[] = [
    { t: 0.0, weights: { mouthOpen: 0.0 } },
    { t: 0.1, weights: { mouthOpen: 0.8 } },
    { t: 0.2, weights: { mouthOpen: 0.2 } },
    { t: 0.3, weights: { mouthOpen: 0.9 } },
    { t: 0.45, weights: { mouthOpen: 0.1 } },
    { t: 0.6, weights: { mouthOpen: 0.85 } },
    { t: 0.75, weights: { mouthOpen: 0.0 } }
  ];

  // Keep the stub deterministic but include the text in case we want to log it.
  void text;

  return {
    audio: { kind: 'url', url: '/audio/beep.wav' },
    visemes,
  };
}
