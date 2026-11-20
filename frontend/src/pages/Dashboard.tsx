import ServiceHealthGrid from "../components/ServiceHealthGrid";
import { useServices } from "../hooks/useServices";
import { toServiceCard } from "../services/toServiceCard";
import "./Dashboard.css";

// Display timestamps in the viewer's local timezone.
function formatRefreshTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export default function Dashboard() {
  const {
    services,
    isLoading,
    error,
    isRefreshing,
    lastSuccessfulRefresh,
    dataGeneratedAt,
    refresh,
  } = useServices();

  // The first request has no cached data to display.
  if (isLoading && services.length === 0) {
    return <p>Loading services…</p>;
  }

  // A failed initial load needs a retry action rather than stale-data UI.
  if (error && services.length === 0) {
    return (
      <section className="dashboard">
        <p role="alert">{error}</p>
        <button type="button" onClick={() => void refresh()}>
          Refresh
        </button>
      </section>
    );
  }

  return (
    <section className="dashboard" aria-busy={isRefreshing}>
      <header className="dashboard__toolbar">
        <button type="button" onClick={() => void refresh()}>
          Refresh
        </button>
        {isRefreshing ? (
          <p className="dashboard__status" role="status">
            Refreshing…
          </p>
        ) : null}
        <p className="dashboard__timestamp">
          Last successful refresh:{" "}
          {lastSuccessfulRefresh ? (
            <time dateTime={lastSuccessfulRefresh}>
              {formatRefreshTime(lastSuccessfulRefresh)}
            </time>
          ) : (
            "—"
          )}
        </p>
      </header>
      <p className="dashboard__timestamp">
        Data generated at: {dataGeneratedAt ? (
          <time dateTime={dataGeneratedAt}>{formatRefreshTime(dataGeneratedAt)}</time>
        ) : (
          "—"
        )}
      </p>
      {/* After a failed refresh, retain the last successful service snapshot. */}
      {error ? (
        <p className="dashboard__warning" role="alert">
          {error}. Showing the last successful data.
        </p>
      ) : null}
      <ServiceHealthGrid services={services.map(toServiceCard)} />
    </section>
  );
}
