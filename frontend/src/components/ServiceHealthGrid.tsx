import ServiceHealthCard from "./ServiceHealthCard";
import type { ServiceCard } from "../types";
import "./ServiceHealthGrid.css";

interface ServiceHealthGridProps {
  services: ServiceCard[];
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
          description={service.description}
          status={service.status}
        />
      ))}
    </section>
  );
}
