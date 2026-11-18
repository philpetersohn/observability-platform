export type ServiceHealth = "healthy" | "degraded" | "down";

export interface ServiceSummary {
  id: string;
  name: string;
  status: ServiceHealth;
  requestRate: number;
  errorRatePct: number;
  averageLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  cpuUsagePct: number;
  memoryUsagePct: number;
  timestamp: string;
}

export type SimulationScenario =
  | "normal"
  | "traffic-spike"
  | "database-slowdown"
  | "service-outage"
  | "intermittent-errors"
  | "recovery";

export interface TelemetrySample {
  serviceId: string;
  timestamp: string;
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
