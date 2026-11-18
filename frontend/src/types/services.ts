export type ServiceStatus = "healthy" | "degraded" | "down";

export interface ServiceSummary {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  timestamp: string;
  requestRate: number;
  errorRatePct: number;
  averageLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  cpuUsagePct: number;
  memoryUsagePct: number;
  status: ServiceStatus;
}

export interface ServicesResponse {
  data: ServiceSummary[];
  meta: {
    count: number;
    generatedAt: string;
  };
}
