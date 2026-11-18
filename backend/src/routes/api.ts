import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { ApiError, SIMULATION_SCENARIOS, type SimulationScenario } from "../types.js";
import { RequestRecorder } from "../services/request-recorder.js";
import { TelemetryStore } from "../services/telemetry-store.js";

const DEFAULT_REPOSITORY = "philpetersohn/engineering-learning";
const MAX_BODY_BYTES = 10_000;

function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  if (response.writableEnded) return;
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
  });
  response.end(body);
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += part.length;
    if (size > MAX_BODY_BYTES) throw new ApiError(413, "Request body too large.", "BODY_TOO_LARGE");
    chunks.push(part);
  }
  if (!size) throw new ApiError(400, "JSON request body required.", "BODY_REQUIRED");
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new ApiError(400, "Invalid JSON request body.", "INVALID_JSON");
  }
}

function parseLimit(value: string | null, fallback: number, maximum: number): number {
  if (value === null) return fallback;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > maximum) {
    throw new ApiError(400, "limit must be between 1 and " + maximum + ".", "INVALID_LIMIT");
  }
  return limit;
}

function setCors(request: IncomingMessage, response: ServerResponse): void {
  const configured = process.env.CORS_ORIGINS?.split(",").map((value) => value.trim()).filter(Boolean);
  const allowed = configured?.length
    ? configured
    : [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
      ];
  const origin = request.headers.origin;
  if (origin && allowed.includes(origin)) {
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("vary", "Origin");
  }
  response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  response.setHeader("access-control-allow-headers", "Content-Type");
  response.setHeader("x-content-type-options", "nosniff");
}

async function probeGithub(): Promise<Record<string, unknown>> {
  const repository = process.env.GITHUB_PROBE_REPOSITORY ?? DEFAULT_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    throw new ApiError(500, "GITHUB_PROBE_REPOSITORY must use owner/repository format.", "INVALID_PROBE_CONFIG");
  }
  const started = performance.now();
  let upstream: Response;
  try {
    upstream = await fetch("https://api.github.com/repos/" + repository, {
      headers: { accept: "application/vnd.github+json", "user-agent": "observability-platform-demo" },
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    throw new ApiError(timeout ? 504 : 502, timeout ? "GitHub API probe timed out." : "GitHub API is unavailable.", timeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE");
  }
  const latencyMs = Math.round((performance.now() - started) * 10) / 10;
  let payload: unknown;
  try {
    payload = await upstream.json();
  } catch {
    throw new ApiError(502, "GitHub returned an invalid response.", "INVALID_UPSTREAM_RESPONSE");
  }
  const data = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  return {
    ok: upstream.ok,
    repository: typeof data.full_name === "string" ? data.full_name : repository,
    description: typeof data.description === "string" ? data.description : null,
    stars: typeof data.stargazers_count === "number" ? data.stargazers_count : null,
    forks: typeof data.forks_count === "number" ? data.forks_count : null,
    openIssues: typeof data.open_issues_count === "number" ? data.open_issues_count : null,
    defaultBranch: typeof data.default_branch === "string" ? data.default_branch : null,
    upstreamStatus: upstream.status,
    latencyMs,
    rateLimitRemaining: Number(upstream.headers.get("x-ratelimit-remaining") ?? 0),
    checkedAt: new Date().toISOString(),
  };
}

function sendEvent(response: ServerResponse, event: string, data: unknown): void {
  response.write("event: " + event + "\n");
  response.write("data: " + JSON.stringify(data) + "\n\n");
}

export function handleApiRequest(
  request: IncomingMessage,
  response: ServerResponse,
  store: TelemetryStore,
  recorder: RequestRecorder,
): void {
  const requestId = randomUUID();
  response.setHeader("x-request-id", requestId);
  setCors(request, response);
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const started = performance.now();
  const url = new URL(request.url ?? "/", "http://localhost");
  const method = request.method ?? "GET";
  if (url.pathname !== "/api/metrics/requests" && url.pathname !== "/api/events") {
    response.once("finish", () => recorder.record({
      timestamp: new Date().toISOString(),
      method,
      path: url.pathname,
      statusCode: response.statusCode,
      durationMs: Math.max(0, Math.round((performance.now() - started) * 10) / 10),
    }));
  }

  void routeRequest(request, response, url, store, recorder).catch((error: unknown) => {
    if (response.headersSent) {
      response.destroy();
      return;
    }
    const apiError = error instanceof ApiError
      ? error
      : new ApiError(500, "Unexpected server error.", "INTERNAL_SERVER_ERROR");
    sendJson(response, apiError.statusCode, {
      error: { code: apiError.code, message: apiError.message, requestId },
    });
  });
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
  store: TelemetryStore,
  recorder: RequestRecorder,
): Promise<void> {
  const method = request.method ?? "GET";
  const path = url.pathname;

  if (method === "GET" && path === "/") {
    sendJson(response, 200, { name: "Observability Platform API", version: "0.1.0", health: "/health", docs: "/api/docs" });
    return;
  }
  if (method === "GET" && (path === "/health" || path === "/api/health")) {
    sendJson(response, 200, { status: "healthy", uptimeSeconds: Math.round(process.uptime()), timestamp: new Date().toISOString() });
    return;
  }
  if (method === "GET" && path === "/api/services") {
    const data = store.getServiceSummaries();
    sendJson(response, 200, { data, meta: { count: data.length, generatedAt: new Date().toISOString() } });
    return;
  }
  const match = path.match(/^\/api\/services\/([^/]+)$/);
  if (method === "GET" && match) {
    const service = store.getServiceSummary(decodeURIComponent(match[1]));
    if (!service) throw new ApiError(404, "Service not found.", "SERVICE_NOT_FOUND");
    sendJson(response, 200, { data: service });
    return;
  }
  if (method === "GET" && path === "/api/metrics/timeseries") {
    const serviceId = url.searchParams.get("serviceId");
    if (!serviceId) throw new ApiError(400, "serviceId is required.", "SERVICE_ID_REQUIRED");
    if (!store.hasService(serviceId)) throw new ApiError(404, "Service not found.", "SERVICE_NOT_FOUND");
    const limit = parseLimit(url.searchParams.get("limit"), 60, 120);
    sendJson(response, 200, { data: { serviceId, points: store.getTimeSeries(serviceId, limit) } });
    return;
  }
  if (method === "GET" && path === "/api/metrics/requests") {
    sendJson(response, 200, { data: recorder.getSnapshot() });
    return;
  }
  if (method === "GET" && path === "/api/traces") {
    const serviceId = url.searchParams.get("serviceId") ?? undefined;
    if (serviceId && !store.hasService(serviceId)) throw new ApiError(404, "Service not found.", "SERVICE_NOT_FOUND");
    sendJson(response, 200, { data: store.getTraces(serviceId, parseLimit(url.searchParams.get("limit"), 30, 100)) });
    return;
  }
  if (method === "GET" && path === "/api/incidents") {
    sendJson(response, 200, { data: store.getIncidents(), meta: { scenario: store.getScenario() } });
    return;
  }
  if (method === "GET" && path === "/api/simulation/scenario") {
    sendJson(response, 200, { data: { current: store.getScenario(), available: store.getAvailableScenarios() } });
    return;
  }
  if (method === "POST" && path === "/api/simulation/scenario") {
    const body = await readJsonBody(request);
    if (!body || typeof body !== "object" || !("scenario" in body)) throw new ApiError(400, "scenario is required.", "SCENARIO_REQUIRED");
    const scenario = (body as { scenario?: unknown }).scenario;
    if (typeof scenario !== "string" || !SIMULATION_SCENARIOS.includes(scenario as SimulationScenario)) {
      throw new ApiError(400, "Unsupported simulation scenario.", "INVALID_SCENARIO");
    }
    store.setScenario(scenario as SimulationScenario);
    sendJson(response, 200, { data: { current: store.getScenario(), incidents: store.getIncidents() } });
    return;
  }
  if (method === "GET" && path === "/api/probes/github") {
    sendJson(response, 200, { data: await probeGithub() });
    return;
  }
  if (method === "GET" && path === "/api/events") {
    response.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive" });
    response.write("retry: 5000\n\n");
    sendEvent(response, "connected", { scenario: store.getScenario(), connectedAt: new Date().toISOString() });
    const timer = setInterval(() => {
      sendEvent(response, "telemetry", { scenario: store.getScenario(), services: store.tick(), generatedAt: new Date().toISOString() });
    }, 5_000);
    response.once("close", () => clearInterval(timer));
    return;
  }
  if (method === "GET" && path === "/api/docs") {
    sendJson(response, 200, { endpoints: [
      { method: "GET", path: "/health", description: "API health" },
      { method: "GET", path: "/api/services", description: "All service summaries" },
      { method: "GET", path: "/api/services/:serviceId", description: "One service" },
      { method: "GET", path: "/api/metrics/timeseries", description: "Service time series" },
      { method: "GET", path: "/api/metrics/requests", description: "Actual API request metrics" },
      { method: "GET", path: "/api/traces", description: "Simulated distributed traces" },
      { method: "GET", path: "/api/incidents", description: "Current incidents" },
      { method: "GET", path: "/api/simulation/scenario", description: "Current scenario" },
      { method: "POST", path: "/api/simulation/scenario", description: "Change scenario" },
      { method: "GET", path: "/api/probes/github", description: "Real GitHub API probe" },
      { method: "GET", path: "/api/events", description: "SSE telemetry stream" },
    ] });
    return;
  }
  throw new ApiError(404, "Route not found.", "ROUTE_NOT_FOUND");
}
