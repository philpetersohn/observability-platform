export type HostKind = "localhost" | "other";

export type ServiceType =
  | "Web Server"
  | "Cache"
  | "Database"
  | "Web Application"
  | "API Service"
  | "Worker"
  | "Authentication"
  | "Payments"
  | "Notification";

export type StatusType = "Running" | "Degraded" | "Down";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function hostKind(hostname: string): HostKind {
  return LOCAL_HOSTS.has(hostname) ? "localhost" : "other";
}

export interface ServiceCard {
  id: string;
  title: string;
  description: string;
  status: StatusType;
  requestRate: number;
  errorRatePct: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  cpuUsagePct: number;
  memoryUsagePct: number;
}
