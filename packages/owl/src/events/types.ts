export type VisemeFrame = {
  /** timestamp, seconds from start */
  t: number;
  /** arbitrary viseme weight map; values should be 0..1 */
  weights: Record<string, number>;
};

export type TranscriptEvent = {
  t: number;
  text: string;
  final: boolean;
};

export type TtsResult = {
  audio: { kind: 'url'; url: string };
  visemes?: VisemeFrame[];
};
