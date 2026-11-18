import ServiceHealthCard from "./ServiceHealthCard";
import type { ServiceSummary } from "../types";
import "./ServiceHealthGrid.css";

interface ServiceHealthGridProps {
  services: ServiceSummary[];
}

export default function ServiceHealthGrid({
  services,
}: ServiceHealthGridProps) {
  return (
    <section className="service-health-grid">
      {services.map((service) => (
        <ServiceHealthCard
          key={service.id}
          id={service.id}
          title={service.title}
          service={service.service}
          status={service.status}
        />
      ))}
    </section>
  );
}
