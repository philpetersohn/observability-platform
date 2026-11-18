import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import { createApiServer } from "../src/server.js";

describe("Observability API", () => {
  let server: Server;
  let baseUrl: string;
  let telemetryStore: ReturnType<typeof createApiServer>["telemetryStore"];

  before(async () => {
    const app = createApiServer();
    server = app.server;
    telemetryStore = app.telemetryStore;
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    baseUrl = "http://127.0.0.1:" + address.port;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });

  it("returns API health", async () => {
    const response = await fetch(baseUrl + "/health");
    const body = await response.json() as { status: string };
    assert.equal(response.status, 200);
    assert.equal(body.status, "healthy");
  });

  it("returns five simulated services", async () => {
    const response = await fetch(baseUrl + "/api/services");
    const body = await response.json() as { data: Array<{ id: string }> };
    assert.equal(response.status, 200);
    assert.equal(body.data.length, 5);
    assert.ok(body.data.some((service) => service.id === "task-service"));
  });

  it("returns a service by ID", async () => {
    const response = await fetch(baseUrl + "/api/services/task-service");
    const body = await response.json() as { data: { id: string; name: string } };
    assert.equal(body.data.id, "task-service");
    assert.equal(body.data.name, "Task Service");
  });

  it("returns bounded time-series samples", async () => {
    const response = await fetch(baseUrl + "/api/metrics/timeseries?serviceId=task-service&limit=5");
    const body = await response.json() as { data: { points: Array<{ timestamp: string }> } };
    assert.equal(response.status, 200);
    assert.equal(body.data.points.length, 5);
    assert.ok(body.data.points[0].timestamp);
  });

  it("requires a serviceId for time-series queries", async () => {
    const response = await fetch(baseUrl + "/api/metrics/timeseries");
    const body = await response.json() as { error: { code: string } };
    assert.equal(response.status, 400);
    assert.equal(body.error.code, "SERVICE_ID_REQUIRED");
  });

  it("returns 404 for unknown services", async () => {
    const response = await fetch(baseUrl + "/api/services/not-a-service");
    const body = await response.json() as { error: { code: string } };
    assert.equal(response.status, 404);
    assert.equal(body.error.code, "SERVICE_NOT_FOUND");
  });

  it("changes scenario and marks Task Service down", async () => {
    const response = await fetch(baseUrl + "/api/simulation/scenario", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenario: "service-outage" }),
    });
    const body = await response.json() as { data: { current: string } };
    assert.equal(response.status, 200);
    assert.equal(body.data.current, "service-outage");
    assert.equal(telemetryStore.getServiceSummary("task-service")?.status, "down");
    telemetryStore.setScenario("normal");
  });

  it("rejects unknown simulation scenarios", async () => {
    const response = await fetch(baseUrl + "/api/simulation/scenario", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenario: "not-a-scenario" }),
    });
    const body = await response.json() as { error: { code: string } };
    assert.equal(response.status, 400);
    assert.equal(body.error.code, "INVALID_SCENARIO");
  });

  it("returns traces with spans", async () => {
    const response = await fetch(baseUrl + "/api/traces?limit=10");
    const body = await response.json() as { data: Array<{ traceId: string; spans: unknown[] }> };
    assert.equal(body.data.length, 10);
    assert.ok(body.data[0].traceId);
    assert.ok(body.data[0].spans.length > 0);
  });

  it("returns an incident for a simulated outage", async () => {
    telemetryStore.setScenario("service-outage");
    const response = await fetch(baseUrl + "/api/incidents");
    const body = await response.json() as { data: Array<{ id: string; severity: string }> };
    assert.equal(body.data[0].id, "INC-1003");
    assert.equal(body.data[0].severity, "critical");
    telemetryStore.setScenario("normal");
  });

  it("records actual API requests", async () => {
    await fetch(baseUrl + "/api/incidents");
    const response = await fetch(baseUrl + "/api/metrics/requests");
    const body = await response.json() as { data: { totalRequests: number } };
    assert.ok(body.data.totalRequests > 0);
  });

  it("allows the Vite frontend origin through CORS", async () => {
    const response = await fetch(baseUrl + "/api/services", {
      headers: { origin: "http://localhost:5173" },
    });
    assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:5173");
  });
});
