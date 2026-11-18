# Backend API reference

Base URL: http://127.0.0.1:3000

| Method | Path | Purpose |
|---|---|---|
| GET | /health | API health and uptime |
| GET | /api/services | Latest summary for all simulated services |
| GET | /api/services/:serviceId | Latest summary for one service |
| GET | /api/metrics/timeseries?serviceId=task-service&limit=60 | Recent metrics |
| GET | /api/metrics/requests | Actual HTTP requests received by this API |
| GET | /api/traces?limit=30 | Simulated distributed traces |
| GET | /api/incidents | Current simulated incident |
| GET | /api/simulation/scenario | Current and available scenarios |
| POST | /api/simulation/scenario | Change the simulation scenario |
| GET | /api/probes/github | Real request to GitHub's public API |
| GET | /api/events | Server-Sent Events telemetry stream |
| GET | /api/docs | Machine-readable endpoint list |

## Change a scenario

POST /api/simulation/scenario
Content-Type: application/json

{ "scenario": "database-slowdown" }

Scenarios: normal, traffic-spike, database-slowdown, service-outage, intermittent-errors, recovery.

## Data provenance

- Service metrics, incidents and trace examples are simulated in memory. They are not Azure or production telemetry.
- /api/metrics/requests reports actual HTTP requests handled by this Node.js process.
- /api/probes/github makes a real request to GitHub's unauthenticated repository API. Do not poll it frequently; GitHub applies rate limits.

## CORS

The default allowlist contains http://localhost:5173 and http://127.0.0.1:5173. Override with comma-separated CORS_ORIGINS.

## Errors

The API returns JSON error objects with a code, message and requestId. Common statuses: 400 invalid input, 404 unknown route/service, 413 body too large, 500 internal error, 502 upstream unavailable, and 504 upstream timeout. Every request includes an X-Request-Id response header.
