import type { VisemeFrame } from '../events/types';

export type LipSyncSink = {
  onFrame: (frame: VisemeFrame) => void;
};

export type LipSyncController = {
  stop: () => void;
  done: Promise<void>;
};

/**
 * Schedule viseme frames against `performance.now()`.
 */
export function scheduleLipSync(opts: {
  frames: VisemeFrame[];
  sink: LipSyncSink;
}): LipSyncController {
  const { frames, sink } = opts;

  const startMs = performance.now();
  let raf = 0;
  let stopped = false;

  let resolveDone: () => void;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  function tick() {
    if (stopped) return;

    const t = (performance.now() - startMs) / 1000;

    // Emit any frames whose time has passed.
    // (We keep an index-less approach for simplicity; frames are tiny in v0.)
    for (const f of frames) {
      if (!('___emitted' in (f as any)) && f.t <= t) {
        (f as any).___emitted = true;
        sink.onFrame(f);
      }
    }

    const remaining = frames.some((f) => !('___emitted' in (f as any)));
    if (!remaining) {
      resolveDone();
      return;
    }

    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);

  return {
    stop: () => {
      stopped = true;
      cancelAnimationFrame(raf);
      resolveDone();
    },
    done,
  };
}
