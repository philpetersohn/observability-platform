import "./ServiceHealthCard.css";
import type { ServiceCard } from "../types";

const statusClass: Record<ServiceCard["status"], string> = {
  Running: "service-health-card__status--running",
  Degraded: "service-health-card__status--degraded",
  Down: "service-health-card__status--down",
};

export default function ServiceHealthCard({
  title,
  description,
  status,
}: ServiceCard) {
  return (
    <article className="service-health-card">
      <div className="service-health-card__top">
        <div className="service-health-card__identity">
          <span className="service-health-card__icon" aria-hidden="true">
            ◇
          </span>

          <div className="service-health-card__name-group">
            <h2 className="service-health-card__title">{title}</h2>
            <p className="service-health-card__type">{description}</p>
          </div>
        </div>

        <span
          className={`service-health-card__status ${statusClass[status]}`}
          aria-label={`Service status: ${status}`}
        >
          <span
            className="service-health-card__status-dot"
            aria-hidden="true"
          />
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
