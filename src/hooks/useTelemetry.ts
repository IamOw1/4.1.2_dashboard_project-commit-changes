import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useTelemetryWS } from '../services/ws';
import type { Telemetry } from '../types/api';

function mergeFromWs(
  base: Telemetry,
  raw: Record<string, unknown> | null
): Telemetry {
  if (!raw) return base;
  return {
    position: (raw.position as Telemetry['position']) ?? base.position,
    velocity: (raw.velocity as Telemetry['velocity']) ?? base.velocity,
    attitude: (raw.attitude as Telemetry['attitude']) ?? base.attitude,
    battery: typeof raw.battery === 'number' ? raw.battery : base.battery,
    timestamp: (raw.timestamp as string) ?? base.timestamp,
  };
}

export function useTelemetry() {
  const { connected, last } = useTelemetryWS(true);
  const [rest, setRest] = useState<Telemetry | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const t = await api.telemetry();
        setRest(t);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    };
    void load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  const data = useMemo(() => {
    const base: Telemetry = rest ?? {
      position: { x: 0, y: 0, z: 0 },
      velocity: { vx: 0, vy: 0, vz: 0 },
      attitude: { roll: 0, pitch: 0, yaw: 0 },
      battery: 0,
      timestamp: new Date().toISOString(),
    };
    if (connected && last) {
      return mergeFromWs(base, last);
    }
    return base;
  }, [connected, last, rest]);

  return { data, connected, error };
}
