import ServiceHealthCard from "./ServiceHealthCard";
import type { ServiceCard } from "../types";
import "./ServiceHealthGrid.css";

interface ServiceHealthGridProps {
  services: ServiceCard[];
}

// Presentational grid: renders cards without owning requests or loading state.
export default function ServiceHealthGrid({
  services,
}: ServiceHealthGridProps) {
  return (
    <section className="service-health-grid">
      {services.map((service) => (
        <ServiceHealthCard key={service.id} {...service} />
      ))}
    </section>
  );
}
