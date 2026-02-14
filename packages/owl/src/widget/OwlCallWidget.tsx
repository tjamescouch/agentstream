import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { OwlCallState } from './types';

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
  const [sttTranscript, setSttTranscript] = useState('');

  const sttTimerRef = useRef<null | number>(null);


  const statusText = useMemo(() => {
    if (!open) return 'closed';
    return state;
  }, [open, state]);

  function append(msg: string) {
    setLog((prev) => [...prev.slice(-100), msg]);
  }


  function stopStt(reason = 'stop') {
    if (sttTimerRef.current != null) {
      window.clearInterval(sttTimerRef.current);
      sttTimerRef.current = null;
    }
    append(`[stt] stop (${reason})`);
  }

  function startStt() {
    stopStt('restart');
    append('[stt] start (stub)');
    const words = ['hello', 'world', 'this', 'is', 'owl', 'stt', 'stub'];
    let i = 0;
    sttTimerRef.current = window.setInterval(() => {
      const w = words[i % words.length];
      i += 1;
      setSttTranscript((prev) => (prev ? `${prev} ${w}` : w));
    }, 500);
  }

  useEffect(() => {
    return () => stopStt('unmount');
  }, []);

  return (
    <div style={styles.shell}>
      {!open ? (
        <button
          style={styles.openButton}
          onClick={() => {
            setOpen(true);
            setState('idle');
            append(`[ui] open`);
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
                append(`[ui] close`);
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
                  setState((s) => {
                    const next = nextStateForToggle(s, 'listening');
                    if (next === 'listening') startStt();
                    else stopStt('toggle');
                    return next;
                  });
                  append('[ui] toggle listen (stub)');
                }}
              >
                Listen (STT)
              </button>
              <button
                style={styles.btn}
                onClick={() => {
                  setState((s) => nextStateForToggle(s, 'speaking'));
                  append(`[ui] toggle speak`);
                }}
              >
                Speak (TTS)
              </button>
              <button
                style={styles.btn}
                onClick={() => {
                  append(`[ui] toggle vision`);
                }}
              >
                Vision
              </button>
              <button
                style={styles.btn}
                onClick={() => {
                  stopStt('stop');
                  setState('idle');
                  append(`[ui] stop all`);
                }}
              >
                Stop
              </button>
            </div>

            <div style={styles.transcript}>
              {sttTranscript ? `stt: ${sttTranscript}\n\n` : ''}{log.length ? log.join('\n') : 'Transcript / event log…'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
