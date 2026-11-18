import ServiceHealthCard from "./ServiceHealthCard";
import type { ServiceHealthCardsProps } from "../types";

interface ServiceHealthGridProps {
  services: ServiceHealthCardsProps[];
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
