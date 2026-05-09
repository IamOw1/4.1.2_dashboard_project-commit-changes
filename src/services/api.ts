import { del, getBlobUrl, getJSON, postJSON } from './http';
import type {
  AgentStatus,
  BackupItem,
  CommandRequest,
  CommandResponse,
  EventItem,
  EventStatistics,
  FleetStatusResponse,
  JsonObject,
  LearningProgress,
  MissionStartRequest,
  MissionStatusResponse,
  SubAgentAskResponse,
  Telemetry,
  ToolCard,
} from '../types/api';

export const api = {
  health: () => getJSON<{ status: string; agent_connected?: boolean }>('/health'),

  telemetry: () => getJSON<Telemetry>('/api/v1/telemetry'),
  status: () => getJSON<AgentStatus>('/api/v1/status'),
  motors: () => getJSON<JsonObject>('/api/v1/motors'),
  mesh: () => getJSON<JsonObject>('/api/v1/mesh'),
  openq: () => getJSON<JsonObject>('/api/v1/openq'),
  flights: () => getJSON<unknown>('/api/v1/flights'),

  command: (command: string, params: JsonObject = {}) =>
    postJSON<CommandResponse>('/api/v1/command', { command, params } satisfies CommandRequest),

  emergencyStop: () => postJSON<JsonObject>('/api/v1/emergency/stop', {}),
  emergencyLand: () => postJSON<JsonObject>('/api/v1/emergency/land', {}),

  startMission: (body: MissionStartRequest) => postJsonBody('/api/v1/mission/start', body),
  stopMission: () => postJsonBody('/api/v1/mission/stop', {}),
  missionStatus: () => getJSON<MissionStatusResponse>('/api/v1/mission/status'),
  saveMission: (body: MissionStartRequest) => postJsonBody('/api/v1/mission/save', body),
  listMissions: () => getJSON<unknown>('/api/v1/missions'),
  missionTypes: () => getJSON<string[]>('/api/v1/mission/types'),

  fleetStatus: () => getJSON<FleetStatusResponse>('/api/v1/fleet/status'),
  fleetFormation: (formation: string) =>
    postJsonBody('/api/v1/fleet/formation', { formation }),
  fleetSwapLeader: (leader_id: string) =>
    postJsonBody('/api/v1/fleet/swap_leader', { leader_id }),

  learningProgress: () => getJSON<LearningProgress>('/api/v1/learning/progress'),
  learningStart: () => postJsonBody('/api/v1/learning/start', {}),
  learningPause: () => postJsonBody('/api/v1/learning/pause', {}),
  learningReset: () => postJsonBody('/api/v1/learning/reset', {}),
  learningExport: () => postJsonBody('/api/v1/learning/export', {}),

  cameraSnapshotUrl: (ts: string) => getBlobUrl('/api/v1/camera/snapshot', { ts }),
  cameraRecordStart: () => postJsonBody('/api/v1/camera/record/start', {}),
  cameraRecordStop: () => postJsonBody('/api/v1/camera/record/stop', {}),
  cameraDetections: () => getJsonAny('/api/v1/camera/detections'),
  cameraZoom: (value: number) => postJsonBody('/api/v1/camera/zoom', { value }),
  cameraBrightness: (value: number) => postJsonBody('/api/v1/camera/brightness', { value }),

  events: (params?: { limit?: number; type?: string; level?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.type) q.set('type', params.type);
    if (params?.level) q.set('level', params.level);
    const s = q.toString();
    return getJSON<{ events: EventItem[]; demo?: boolean }>(
      `/api/v1/events${s ? `?${s}` : ''}`
    );
  },
  eventStatistics: () => getJSON<EventStatistics>('/api/v1/events/statistics'),

  backupCreate: () => postJsonBody('/api/v1/backup/create', {}),
  backupList: () => getJSON<{ items: BackupItem[] }>('/api/v1/backup/list'),
  backupRestore: (id: string) => postJsonBody(`/api/v1/backup/restore/${id}`, {}),
  backupDelete: (id: string) => del(`/api/v1/backup/${id}`),
  backupDownloadUrl: (id: string) => getBlobUrl(`/api/v1/backup/download/${encodeURIComponent(id)}`),

  subAgentAsk: (question: string) =>
    postJSON<SubAgentAskResponse>('/api/v1/sub_agent/ask', { question }),

  tools: () => getJSON<{ tools: ToolCard[] }>('/api/v1/tools'),
  toolExecute: (toolId: string) => postJsonBody('/api/v1/tools/execute', { tool_id: toolId }),

  simulators: () => getJSON<{ simulators: { id: string; name: string; active: boolean }[] }>(
    '/api/v1/simulators'
  ),
  simulatorsSwitch: (simulator: string) =>
    postJsonBody('/api/v1/simulators/switch', { simulator }),
};

async function postJsonBody<T = JsonObject>(path: string, body: unknown): Promise<T> {
  return postJSON<T>(path, body);
}

async function getJsonAny(path: string): Promise<unknown> {
  return getJSON<unknown>(path);
}
