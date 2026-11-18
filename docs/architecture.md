# Architecture

The repository contains a React + TypeScript frontend and a Node.js + TypeScript backend.

## Current backend

The backend uses Node's built-in `node:http` server. We are deliberately starting with Node runtime and HTTP fundamentals before adding a framework such as Express.

- `src/routes/api.ts`: routing, request validation, CORS, JSON responses, real GitHub API probe and SSE endpoint.
- `src/services/telemetry-store.ts`: in-memory synthetic metrics, traces and incident scenarios.
- `src/services/request-recorder.ts`: measurements of actual requests received by this API process.
- `src/types.ts`: domain contracts.
- `src/server.ts`: injectable server factory for tests.
- `src/index.ts`: process entry point and five-second simulation tick.

## Data provenance

1. **Synthetic telemetry:** service metrics, traces and incidents are generated in memory. These are not production or Azure data.
2. **Observed API traffic:** request counts, status codes and latency are recorded from requests handled by this Node.js process.
3. **External probe:** `GET /api/probes/github` makes a real request to GitHub's public API.

This first milestone does not connect to Azure Monitor, an OpenTelemetry Collector, or PostgreSQL.

## Data flow

```text
React + TypeScript
       |
       | HTTP / JSON and Server-Sent Events
       v
Node.js HTTP API
       |
       +--> TelemetryStore (synthetic demo metrics and traces)
       +--> RequestRecorder (actual API request timings)
       +--> GitHub public API (real upstream probe)
```

## Planned evolution

1. Connect the React dashboard to these API contracts.
2. Add OpenTelemetry instrumentation.
3. Export real metrics and traces to a local collector/backend.
4. Add PostgreSQL for durable storage when query and retention needs are clear.
5. Integrate Azure Monitor only when Azure resources and credentials are configured.
