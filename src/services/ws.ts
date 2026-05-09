import { useEffect, useRef, useState } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws/telemetry';

export type TelemetryWSMessage = {
  type: string;
  data?: Record<string, unknown>;
};

function connectWS(
  url: string,
  onMessage: (msg: TelemetryWSMessage) => void,
  onOpen?: () => void,
  onClose?: () => void
): () => void {
  let ws: WebSocket | null = null;
  let stopped = false;
  let attempt = 0;
  const maxDelay = 10000;
  const base = 1000;

  const run = () => {
    if (stopped) return;
    ws = new WebSocket(url);
    ws.onopen = () => {
      attempt = 0;
      onOpen?.();
    };
    ws.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data as string) as TelemetryWSMessage;
        onMessage(parsed);
      } catch {
        /* ignore */
      }
    };
    ws.onerror = () => {
      /* handled in onclose */
    };
    ws.onclose = () => {
      onClose?.();
      if (stopped) return;
      const delay = Math.min(maxDelay, base * 2 ** attempt);
      attempt += 1;
      setTimeout(run, delay);
    };
  };

  run();

  return () => {
    stopped = true;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };
}

export function useTelemetryWS(
  enabled = true
): { connected: boolean; last: Record<string, unknown> | null; error: string | null } {
  const [connected, setConnected] = useState(false);
  const [last, setLast] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastRef = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    setError(null);
    const cleanup = connectWS(
      WS_URL,
      (msg) => {
        if (msg.type === 'telemetry' && msg.data) {
          lastRef.current = msg.data as Record<string, unknown>;
          setLast(msg.data as Record<string, unknown>);
        }
      },
      () => {
        setConnected(true);
        setError(null);
      },
      () => {
        setConnected(false);
      }
    );
    return cleanup;
  }, [enabled]);

  return { connected, last, error };
}
