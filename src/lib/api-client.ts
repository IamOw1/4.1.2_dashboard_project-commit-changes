/**
 * Типизированный клиент к Python FastAPI бэкенду COBA AI
 * (репозиторий IamOw1/4.1.2_dashboard_project, файл api/rest_api.py)
 *
 * 47 эндпоинтов сгруппированы по доменам. Каждый метод:
 *   1) пытается дозвониться до бэкенда (BASE из VITE_API_URL, по умолч. http://localhost:8000)
 *   2) при ошибке возвращает fallback из мок-данных (если задан) — дашборд продолжает работать.
 *
 * Если нужно жёстко требовать ответ от бэка (без фолбэка) — передавайте { strict: true }.
 */

const BASE: string =
  (typeof import.meta !== "undefined" &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_URL) ||
  "http://localhost:8000";

const TIMEOUT_MS = 6000;

export type ApiResult<T> = {
  data: T;
  ok: boolean; // true — пришло с бэка, false — fallback / ошибка
  error?: string;
  source: "backend" | "mock" | "error";
};

let lastBackendOk = false;
let lastCheck = 0;
const HEALTH_CACHE_MS = 5000;

async function rawFetch<T>(
  path: string,
  init: RequestInit = {},
  fallback?: T,
  strict = false,
): Promise<ApiResult<T>> {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    const data = (ct.includes("application/json") ? await res.json() : await res.text()) as T;
    lastBackendOk = true;
    return { data, ok: true, source: "backend" };
  } catch (e) {
    clearTimeout(id);
    lastBackendOk = false;
    const msg = e instanceof Error ? e.message : String(e);
    if (strict || fallback === undefined) {
      return { data: fallback as T, ok: false, source: "error", error: msg };
    }
    return { data: fallback, ok: false, source: "mock", error: msg };
  }
}

/** Проверка здоровья бэка с кэшем 5с (используется индикатором в шапке). */
export async function pingBackend(): Promise<boolean> {
  const now = Date.now();
  if (now - lastCheck < HEALTH_CACHE_MS) return lastBackendOk;
  lastCheck = now;
  const r = await rawFetch<{ status?: string }>("/health", {}, undefined, true);
  return r.ok;
}

export function getApiBaseUrl(): string {
  return BASE;
}

// ===== Доменные обёртки =====
// (здесь только сигнатуры под все 47 эндпоинтов; вызывать из контекстов/страниц)

export const api = {
  // --- Agent ---
  agentStatus: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/agent/status", {}, fb),
  agentInitialize: <T = unknown>(body?: unknown) =>
    rawFetch<T>("/api/v1/agent/initialize", { method: "POST", body: JSON.stringify(body ?? {}) }),
  agentShutdown: <T = unknown>() =>
    rawFetch<T>("/api/v1/agent/shutdown", { method: "POST" }),

  // --- Mission ---
  missionStart: <T = unknown>(body: unknown) =>
    rawFetch<T>("/api/v1/mission/start", { method: "POST", body: JSON.stringify(body) }),
  missionStop: <T = unknown>(body?: unknown) =>
    rawFetch<T>("/api/v1/mission/stop", { method: "POST", body: JSON.stringify(body ?? {}) }),
  missionStatus: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/mission/status", {}, fb),

  // --- Command / Emergency ---
  command: <T = unknown>(command: string, params: Record<string, unknown> = {}) =>
    rawFetch<T>("/api/v1/command", { method: "POST", body: JSON.stringify({ command, params }) }),
  emergencyStop: <T = unknown>() =>
    rawFetch<T>("/api/v1/emergency/stop", { method: "POST" }),

  // --- Telemetry ---
  telemetry: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/telemetry", {}, fb),

  // --- Tools ---
  toolsList: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/tools", {}, fb),
  toolExecute: <T = unknown>(toolName: string, params: Record<string, unknown> = {}) =>
    rawFetch<T>(`/api/v1/tools/${encodeURIComponent(toolName)}/execute`, {
      method: "POST",
      body: JSON.stringify(params),
    }),

  // --- Learning ---
  learningProgress: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/learning/progress", {}, fb),
  learningStart: <T = unknown>(body: unknown) =>
    rawFetch<T>("/api/v1/learning/start", { method: "POST", body: JSON.stringify(body) }),
  learningConfigUpdate: <T = unknown>(body: unknown) =>
    rawFetch<T>("/api/v1/learning/config", { method: "PUT", body: JSON.stringify(body) }),
  learningTasks: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/learning/tasks", {}, fb),
  learningCurriculumProgress: <T = unknown>(body: unknown) =>
    rawFetch<T>("/api/v1/learning/curriculum/progress", { method: "POST", body: JSON.stringify(body) }),
  learningExport: <T = unknown>(body?: unknown) =>
    rawFetch<T>("/api/v1/learning/export", { method: "POST", body: JSON.stringify(body ?? {}) }),

  // --- Memory / Sub-agent / Reports ---
  memoryShortTerm: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/memory/short_term", {}, fb),
  subAgentAsk: <T = unknown>(question: string) =>
    rawFetch<T>(`/api/v1/sub_agent/ask?q=${encodeURIComponent(question)}`),
  reportsMissions: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/reports/missions", {}, fb),

  // --- Health / Settings ---
  health: () => rawFetch<{ status: string }>("/health", {}, undefined, true),
  settingsGet: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/settings", {}, fb),
  settingsSet: <T = unknown>(body: { key: string; value: unknown }) =>
    rawFetch<T>("/api/v1/settings", { method: "POST", body: JSON.stringify(body) }),

  // --- Fleet / Mesh ---
  fleetStatus: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/fleet/status", {}, fb),
  fleetTelemetry: <T = unknown>(droneId: string, fb?: T) =>
    rawFetch<T>(`/api/v1/fleet/${encodeURIComponent(droneId)}/telemetry`, {}, fb),
  fleetFormation: <T = unknown>(body: { formation: string; spacing?: number }) =>
    rawFetch<T>("/api/v1/fleet/formation", { method: "POST", body: JSON.stringify(body) }),
  fleetSwapLeader: <T = unknown>(body?: unknown) =>
    rawFetch<T>("/api/v1/fleet/swap_leader", { method: "POST", body: JSON.stringify(body ?? {}) }),
  meshTopology: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/mesh/topology", {}, fb),

  // --- Camera ---
  cameraFrame: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/camera/frame", {}, fb),
  cameraStreamUrl: () => `${BASE}/api/v1/camera/stream`,
  cameraRecordStart: <T = unknown>() =>
    rawFetch<T>("/api/v1/camera/record/start", { method: "POST" }),
  cameraRecordStop: <T = unknown>() =>
    rawFetch<T>("/api/v1/camera/record/stop", { method: "POST" }),

  // --- Detection ---
  detectionResults: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/detection/results", {}, fb),

  // --- Events ---
  eventsLog: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/events/log", {}, fb),
  eventsFilter: <T = unknown>(query: Record<string, string>, fb?: T) => {
    const qs = new URLSearchParams(query).toString();
    return rawFetch<T>(`/api/v1/events/filter?${qs}`, {}, fb);
  },
  eventsAlertConfig: <T = unknown>(body: { email?: string; telegram?: string; webhook?: string }) =>
    rawFetch<T>("/api/v1/events/alert/config", { method: "POST", body: JSON.stringify(body) }),
  eventsDelete: <T = unknown>(eventId: string) =>
    rawFetch<T>(`/api/v1/events/log/${encodeURIComponent(eventId)}`, { method: "DELETE" }),
  eventsExport: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/events/export", {}, fb),
  eventsStatistics: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/events/statistics", {}, fb),

  // --- Backups ---
  backupCreate: <T = unknown>(body: { components: string[] }) =>
    rawFetch<T>("/api/v1/backup/create", { method: "POST", body: JSON.stringify(body) }),
  backupList: <T = unknown>(fb?: T) => rawFetch<T>("/api/v1/backup/list", {}, fb),
  backupRestore: <T = unknown>(backupId: string, body: { mode: "merge" | "replace" }) =>
    rawFetch<T>(`/api/v1/backup/restore/${encodeURIComponent(backupId)}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  backupDelete: <T = unknown>(backupId: string) =>
    rawFetch<T>(`/api/v1/backup/${encodeURIComponent(backupId)}`, { method: "DELETE" }),

  // --- Export ---
  exportMissions: <T = unknown>(body: { format: "json" | "csv"; start?: string; end?: string }) =>
    rawFetch<T>("/api/v1/export/missions", { method: "POST", body: JSON.stringify(body) }),
  exportTelemetry: <T = unknown>(body: { format: "json" | "csv"; start?: string; end?: string }) =>
    rawFetch<T>("/api/v1/export/telemetry", { method: "POST", body: JSON.stringify(body) }),
  exportModels: <T = unknown>(body?: unknown) =>
    rawFetch<T>("/api/v1/export/models", { method: "POST", body: JSON.stringify(body ?? {}) }),
};
