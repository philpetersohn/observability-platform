export const SIMULATION_SCENARIOS = [
  "normal",
  "traffic-spike",
  "database-slowdown",
  "service-outage",
  "intermittent-errors",
  "recovery",
] as const;

export type SimulationScenario = (typeof SIMULATION_SCENARIOS)[number];
export type ServiceHealth = "healthy" | "degraded" | "down";

export interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  baselineRequestRate: number;
  baselineLatencyMs: number;
  baselineErrorRatePct: number;
  baselineCpuPct: number;
  baselineMemoryPct: number;
  phase: number;
}

export interface TelemetrySample {
  timestamp: string;
  serviceId: string;
  requestRate: number;
  errorRatePct: number;
  averageLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  cpuUsagePct: number;
  memoryUsagePct: number;
  status: ServiceHealth;
}

export interface ServiceSummary extends TelemetrySample {
  id: string;
  name: string;
  description: string;
}

export interface TraceSpan {
  name: string;
  service: string;
  durationMs: number;
  status: "ok" | "error";
}

export interface TraceRecord {
  traceId: string;
  timestamp: string;
  serviceId: string;
  serviceName: string;
  operation: string;
  durationMs: number;
  statusCode: number;
  status: "ok" | "error";
  spans: TraceSpan[];
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: "warning" | "critical";
  status: "investigating" | "recovering";
  startedAt: string;
  affectedServices: string[];
}

export interface RequestRecord {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
