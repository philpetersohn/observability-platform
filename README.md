# Observability Platform

A learning and interview-preparation project for building a cloud observability experience with React, TypeScript, Node.js, and eventually OpenTelemetry and PostgreSQL.

## Run the backend

Requirements: Node.js 20 or newer.

```bash
cd backend
npm install
npm run dev
```

The API listens on http://127.0.0.1:3000.

Useful endpoints:
- http://127.0.0.1:3000/health
- http://127.0.0.1:3000/api/services
- http://127.0.0.1:3000/api/metrics/timeseries?serviceId=task-service
- http://127.0.0.1:3000/api/traces
- http://127.0.0.1:3000/api/incidents
- http://127.0.0.1:3000/api/docs

Trigger an outage:

```bash
curl -X POST http://127.0.0.1:3000/api/simulation/scenario \
  -H 'content-type: application/json' \
  -d '{"scenario":"service-outage"}'
```

Restore normal operation by posting {"scenario":"normal"} to the same endpoint.

## Checks

```bash
cd backend
npm test
npm run typecheck
```

## Data provenance

Synthetic service metrics, incidents and trace examples are demo data. The request recorder measures real traffic sent to this API, and the GitHub probe makes a real public HTTP request. This starter does not yet connect to PostgreSQL, OpenTelemetry Collector or Azure Monitor.

See [API documentation](docs/api.md), [architecture](docs/architecture.md), and the [project learning notes](docs/learning/README.md).
