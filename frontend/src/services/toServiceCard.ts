import type { ServiceCard, StatusType } from "../types";
import type { ServiceStatus, ServiceSummary } from "../types/services";

const statusLabels: Record<ServiceStatus, StatusType> = {
  healthy: "Running",
  degraded: "Degraded",
  down: "Down",
};

// Keep API data shape independent from presentational component props.
export function toServiceCard(service: ServiceSummary): ServiceCard {
  return {
    id: service.id,
    title: service.name,
    description: service.description,
    status: statusLabels[service.status],
    requestRate: service.requestRate,
    errorRatePct: service.errorRatePct,
    averageLatencyMs: service.averageLatencyMs,
    p95LatencyMs: service.p95LatencyMs,
    cpuUsagePct: service.cpuUsagePct,
    memoryUsagePct: service.memoryUsagePct,
  };
}
