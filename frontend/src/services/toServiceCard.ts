import type { ServiceCard, StatusType } from "../types";
import type { ServiceStatus, ServiceSummary } from "../types/services";

const statusLabels: Record<ServiceStatus, StatusType> = {
  healthy: "Running",
  degraded: "Degraded",
  down: "Down",
};

export function toServiceCard(service: ServiceSummary): ServiceCard {
  return {
    id: service.id,
    title: service.name,
    description: service.description,
    status: statusLabels[service.status],
  };
}
