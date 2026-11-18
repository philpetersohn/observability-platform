import "./ServiceHealthCard.css";
import type { ServiceHealthCardsProps } from "../types";

const statusClass: Record<ServiceHealthCardsProps["status"], string> = {
  Running: "service-health-card__status--running",
  Degraded: "service-health-card__status--degraded",
  Down: "service-health-card__status--down",
};

export default function ServiceHealthCard({
  title,
  service,
  status,
}: ServiceHealthCardsProps) {
  return (
    <article className="service-health-card">
      <div className="service-health-card__top">
        <div className="service-health-card__identity">
          <span
            className="service-health-card__icon"
            aria-hidden="true"
          >
            {service === "Database" || service === "Cache" ? "▤" : "◇"}
          </span>

          <div className="service-health-card__name-group">
            <h2 className="service-health-card__title">{title}</h2>
            <p className="service-health-card__type">{service}</p>
          </div>
        </div>

        <span
          className={`service-health-card__status ${statusClass[status]}`}
          aria-label={`Service status: ${status}`}
        >
          <span className="service-health-card__status-dot" aria-hidden="true" />
          {status}
        </span>
      </div>

      <div className="service-health-card__divider" />

      <p className="service-health-card__hint">
        Service health
        <span>Live monitoring</span>
      </p>
    </article>
  );
}
