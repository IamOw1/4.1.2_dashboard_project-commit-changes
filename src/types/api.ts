export type JsonObject = Record<string, unknown>;

export interface Telemetry {
  position: Record<string, number>;
  velocity: Record<string, number>;
  attitude: Record<string, number>;
  battery: number;
  timestamp: string;
}

export interface AgentStatus {
  agent_id?: string;
  state?: string;
  role?: string;
  mission?: unknown;
  telemetry?: JsonObject;
  sub_agent_online?: boolean;
  timestamp?: string;
}

export interface CommandRequest {
  command: string;
  params?: JsonObject;
}

export interface CommandResponse {
  success: boolean;
  command: string;
  result: JsonObject;
}

export interface MissionStartRequest {
  name: string;
  waypoints: Array<Record<string, number>>;
  altitude: number;
  speed: number;
  mission_type?: string;
}

export interface MissionStatusResponse {
  active: unknown;
  history: unknown[];
  demo?: boolean;
}

export interface LearningProgress {
  reward?: number;
  loss?: number;
  episodes?: number;
  tasks?: Array<{ name: string; progress: number }>;
  experimental?: boolean;
  status?: string;
}

export interface FleetDrone {
  id: string;
  name: string;
  battery: number;
  state: string;
  role?: string;
}

export interface FleetStatusResponse {
  leader_id: string;
  formation: string;
  drones: FleetDrone[];
  average_battery: number;
  demo?: boolean;
}

export interface EventItem {
  id?: string;
  timestamp: string;
  type?: string;
  level?: string;
  message?: string;
  data?: JsonObject;
}

export interface EventStatistics {
  by_type: Record<string, number>;
  by_level: Record<string, number>;
  total: number;
}

export interface BackupItem {
  id: string;
  filename?: string;
  created_at: string;
  size_bytes?: number;
}

export interface ToolCard {
  id: string;
  name: string;
  description: string;
  status?: string;
}

export interface DetectionResult {
  label?: string;
  confidence?: number;
  bbox?: number[];
}

export interface SubAgentAskResponse {
  answer: string;
  offline?: boolean;
}

export interface SimulatorInfo {
  id: string;
  name: string;
  active: boolean;
}
