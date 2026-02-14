import React, { useMemo, useRef, useState } from 'react';
import type { OwlCallState } from './types';
import { localTtsStub } from '../tts/localTts';
import { scheduleLipSync } from '../lipsync/scheduleLipSync';

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  openButton: {
    appearance: 'none',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    color: 'inherit',
    padding: '10px 12px',
    borderRadius: 10,
    cursor: 'pointer',
  },
  popout: {
    width: 360,
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  title: { fontSize: 13, fontWeight: 600, opacity: 0.9 },
  status: { fontSize: 12, opacity: 0.7 },
  body: { padding: 12, display: 'grid', gap: 10 },
  avatar: {
    height: 220,
    borderRadius: 12,
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.10)',
    display: 'grid',
    placeItems: 'center',
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
  },
  controls: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  btn: {
    appearance: 'none',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: 'inherit',
    padding: '8px 10px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 12,
  },
  btnDanger: {
    border: '1px solid rgba(255,120,120,0.25)',
    background: 'rgba(255,80,80,0.10)',
  },
  transcript: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 12,
    lineHeight: 1.5,
    padding: 10,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.25)',
    minHeight: 90,
    whiteSpace: 'pre-wrap',
  },
};

function nextStateForToggle(current: OwlCallState, target: 'listening' | 'speaking'): OwlCallState {
  if (current === target) return 'idle';
  if (current === 'closed') return 'opening';
  return target;
}

export function OwlCallWidget() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<OwlCallState>('closed');
  const [log, setLog] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lipSyncStopRef = useRef<null | (() => void)>(null);

  const statusText = useMemo(() => {
    if (!open) return 'closed';
    return state;
  }, [open, state]);

  function append(msg: string) {
    setLog((prev) => [...prev.slice(-100), msg]);
  }

  async function stopAll(reason = 'stop') {
    append(`[ui] stop all (${reason})`);
    lipSyncStopRef.current?.();
    lipSyncStopRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setState('idle');
  }

  async function speakOnce() {
    const tts = localTtsStub('hello');
    append(`[tts] audio=${tts.audio.kind}:${tts.audio.url}`);

    // Ensure we stop prior playback.
    await stopAll('speak');

    const audio = new Audio(tts.audio.url);
    audioRef.current = audio;

    if (tts.visemes?.length) {
      const ctl = scheduleLipSync({
        frames: tts.visemes,
        sink: {
          onFrame: (f) => append(`[viseme] t=${f.t.toFixed(2)} ${JSON.stringify(f.weights)}`),
        },
      });
      lipSyncStopRef.current = ctl.stop;
      void ctl.done.then(() => append('[viseme] done'));
    }

    setState('speaking');
    append('[tts] play');

    try {
      await audio.play();
    } catch (err) {
      append(`[tts] play failed: ${String(err)}`);
      setState('error');
      return;
    }

    audio.addEventListener(
      'ended',
      () => {
        append('[tts] ended');
        void stopAll('ended');
      },
      { once: true }
    );
  }

  return (
    <div style={styles.shell}>
      {!open ? (
        <button
          style={styles.openButton}
          onClick={() => {
            setOpen(true);
            setState('idle');
            append('[ui] open');
          }}
        >
          Open OWL
        </button>
      ) : (
        <div style={styles.popout}>
          <div style={styles.header}>
            <div>
              <div style={styles.title}>OWL</div>
              <div style={styles.status}>{statusText}</div>
            </div>
            <button
              style={{ ...styles.btn, ...styles.btnDanger }}
              onClick={() => {
                setOpen(false);
                setState('closed');
                append('[ui] close');
              }}
            >
              Close
            </button>
          </div>

          <div style={styles.body}>
            <div style={styles.avatar}>
              Avatar canvas placeholder
              <br />
              (embed visage3d here)
            </div>

            <div style={styles.controls}>
              <button
                style={styles.btn}
                onClick={() => {
                  setState((s) => nextStateForToggle(s, 'listening'));
                  append('[ui] toggle listen');
                }}
              >
                Listen (STT)
              </button>
              <button
                style={styles.btn}
                onClick={() => {
                  void speakOnce();
                }}
              >
                Speak (TTS)
              </button>
              <button
                style={styles.btn}
                onClick={() => {
                  append('[ui] toggle vision');
                }}
              >
                Vision
              </button>
              <button
                style={styles.btn}
                onClick={() => {
                  void stopAll('button');
                }}
              >
                Stop
              </button>
            </div>

            <div style={styles.transcript}>
              {log.length ? log.join('\n') : 'Transcript / event log…'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
