const DEFAULT_TIMEOUT_MS = 15000;

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

async function parseJSON(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function getJSON<T>(path: string, opts?: { timeoutMs?: number }): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const res = await fetch(url, { signal: ctrl.signal });
    const data = await parseJSON(res);
    if (!res.ok) {
      throw new HttpError(`HTTP ${res.status}`, res.status, data);
    }
    return data as T;
  } finally {
    clearTimeout(t);
  }
}

export async function postJSON<T>(
  path: string,
  body?: unknown,
  opts?: { timeoutMs?: number }
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await parseJSON(res);
    if (!res.ok) {
      throw new HttpError(`HTTP ${res.status}`, res.status, data);
    }
    return data as T;
  } finally {
    clearTimeout(t);
  }
}

export async function del<T>(path: string, opts?: { timeoutMs?: number }): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const res = await fetch(url, { method: 'DELETE', signal: ctrl.signal });
    const data = await parseJSON(res);
    if (!res.ok) {
      throw new HttpError(`HTTP ${res.status}`, res.status, data);
    }
    return data as T;
  } finally {
    clearTimeout(t);
  }
}

export function getBlobUrl(path: string, params?: Record<string, string>): string {
  const q = params
    ? '?' +
      new URLSearchParams(params).toString()
    : '';
  return path.startsWith('http') ? path + q : `${API_BASE}${path}${q}`;
}
