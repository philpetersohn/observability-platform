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
  requestRate,
  errorRatePct,
  averageLatencyMs,
  p95LatencyMs,
  cpuUsagePct,
  memoryUsagePct,
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

      <dl className="service-health-card__metrics">
        <div>
          <dt>Requests</dt>
          <dd>{requestRate}/s</dd>
        </div>
        <div>
          <dt>Errors</dt>
          <dd>{errorRatePct}%</dd>
        </div>
        <div>
          <dt>Avg latency</dt>
          <dd>{averageLatencyMs} ms</dd>
        </div>
        <div>
          <dt>p95</dt>
          <dd>{p95LatencyMs} ms</dd>
        </div>
        <div>
          <dt>CPU</dt>
          <dd>{cpuUsagePct}%</dd>
        </div>
        <div>
          <dt>Memory</dt>
          <dd>{memoryUsagePct}%</dd>
        </div>
      </dl>
    </article>
  );
}
