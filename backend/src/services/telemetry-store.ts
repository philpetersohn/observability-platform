import { randomUUID } from "node:crypto";
import { SIMULATION_SCENARIOS } from "../types.js";
import type {
  Incident,
  ServiceDefinition,
  ServiceHealth,
  ServiceSummary,
  SimulationScenario,
  TelemetrySample,
  TraceRecord,
} from "../types.js";

const SERVICE_CATALOG: ServiceDefinition[] = [
  { id: "auth-api", name: "Authentication API", description: "Login, token issuance, and identity validation", baselineRequestRate: 118, baselineLatencyMs: 42, baselineErrorRatePct: 0.15, baselineCpuPct: 31, baselineMemoryPct: 48, phase: 0.2 },
  { id: "user-service", name: "User Service", description: "User profiles and account preferences", baselineRequestRate: 92, baselineLatencyMs: 58, baselineErrorRatePct: 0.25, baselineCpuPct: 37, baselineMemoryPct: 61, phase: 1.3 },
  { id: "task-service", name: "Task Service", description: "Task creation, updates, and project workflows", baselineRequestRate: 154, baselineLatencyMs: 74, baselineErrorRatePct: 0.2, baselineCpuPct: 44, baselineMemoryPct: 57, phase: 2.1 },
  { id: "notification-service", name: "Notification Service", description: "Email and in-app notification delivery", baselineRequestRate: 57, baselineLatencyMs: 34, baselineErrorRatePct: 0.1, baselineCpuPct: 23, baselineMemoryPct: 43, phase: 2.8 },
  { id: "payment-service", name: "Payment Service", description: "Payment intents and transaction processing", baselineRequestRate: 46, baselineLatencyMs: 86, baselineErrorRatePct: 0.35, baselineCpuPct: 36, baselineMemoryPct: 54, phase: 3.7 },
];

const MAX_SAMPLES_PER_SERVICE = 120;
const MAX_TRACES = 300;

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function healthFor(errorRatePct: number, p95LatencyMs: number, forceDown = false): ServiceHealth {
  if (forceDown) return "down";
  if (errorRatePct >= 5 || p95LatencyMs >= 250) return "degraded";
  return "healthy";
}

export class TelemetryStore {
  private scenario: SimulationScenario = "normal";
  private scenarioStartedAt = new Date().toISOString();
  private sampleIndex = 0;
  private readonly samples = new Map<string, TelemetrySample[]>();
  private traces: TraceRecord[] = [];

  constructor() {
    for (const service of SERVICE_CATALOG) this.samples.set(service.id, []);
    const now = Date.now();
    for (let offset = 59; offset >= 0; offset -= 1) {
      this.appendSamples(new Date(now - offset * 5_000));
    }
  }

  getScenario(): SimulationScenario { return this.scenario; }
  getAvailableScenarios(): SimulationScenario[] { return [...SIMULATION_SCENARIOS]; }

  setScenario(scenario: SimulationScenario): void {
    this.scenario = scenario;
    this.scenarioStartedAt = new Date().toISOString();
    this.tick();
  }

  tick(): TelemetrySample[] { return this.appendSamples(new Date()); }

  getServiceSummaries(): ServiceSummary[] {
    return SERVICE_CATALOG.flatMap((service) => {
      const latest = this.samples.get(service.id)?.at(-1);
      return latest ? [{ ...latest, id: service.id, name: service.name, description: service.description }] : [];
    });
  }

  getServiceSummary(serviceId: string): ServiceSummary | undefined {
    return this.getServiceSummaries().find((service) => service.id === serviceId);
  }

  hasService(serviceId: string): boolean {
    return SERVICE_CATALOG.some((service) => service.id === serviceId);
  }

  getTimeSeries(serviceId: string, limit: number): TelemetrySample[] {
    return (this.samples.get(serviceId) ?? []).slice(-limit);
  }

  getTraces(serviceId: string | undefined, limit: number): TraceRecord[] {
    return this.traces.filter((trace) => !serviceId || trace.serviceId === serviceId).slice(0, limit);
  }

  getIncidents(): Incident[] {
    const base = { startedAt: this.scenarioStartedAt, status: "investigating" as const };
    switch (this.scenario) {
      case "normal": return [];
      case "traffic-spike": return [{ ...base, id: "INC-1001", title: "Traffic spike detected", description: "Request volume is approximately three times its baseline and compute utilization is elevated.", severity: "warning", affectedServices: ["auth-api", "user-service", "task-service", "payment-service"] }];
      case "database-slowdown": return [{ ...base, id: "INC-1002", title: "Database response time elevated", description: "Services that depend on database reads and writes are experiencing increased latency.", severity: "critical", affectedServices: ["user-service", "task-service", "payment-service"] }];
      case "service-outage": return [{ ...base, id: "INC-1003", title: "Task Service unavailable", description: "The Task Service is returning service-unavailable responses. Dependent workflows may fail.", severity: "critical", affectedServices: ["task-service"] }];
      case "intermittent-errors": return [{ ...base, id: "INC-1004", title: "Intermittent User Service errors", description: "A portion of User Service requests are failing. Investigate recent traces and dependencies.", severity: "warning", affectedServices: ["user-service"] }];
      case "recovery": return [{ ...base, id: "INC-1005", title: "Service recovery in progress", description: "The incident has been cleared in the simulator and service metrics are returning to baseline.", severity: "warning", status: "recovering", affectedServices: ["task-service"] }];
    }
  }

  private appendSamples(timestamp: Date): TelemetrySample[] {
    this.sampleIndex += 1;
    return SERVICE_CATALOG.map((service) => {
      const sample = this.createSample(service, timestamp);
      const history = this.samples.get(service.id) ?? [];
      history.push(sample);
      if (history.length > MAX_SAMPLES_PER_SERVICE) history.shift();
      this.samples.set(service.id, history);
      this.addTrace(sample);
      return sample;
    });
  }

  private createSample(service: ServiceDefinition, timestamp: Date): TelemetrySample {
    const wave = Math.sin(this.sampleIndex / 4 + service.phase);
    const noise = 1 + wave * 0.055;
    let requestMultiplier = 1;
    let latencyMultiplier = 1;
    let errorRate = service.baselineErrorRatePct + Math.max(0, wave) * 0.12;
    let cpuBoost = 0;
    let memoryBoost = 0;
    let forcedDown = false;

    switch (this.scenario) {
      case "traffic-spike": requestMultiplier = 3.1; latencyMultiplier = 1.65; errorRate += 1.8; cpuBoost = 28; memoryBoost = 9; break;
      case "database-slowdown": if (["user-service", "task-service", "payment-service"].includes(service.id)) { latencyMultiplier = 3.2; errorRate += 2.3; cpuBoost = 7; } break;
      case "service-outage": if (service.id === "task-service") { requestMultiplier = 0.15; latencyMultiplier = 0; errorRate = 100; forcedDown = true; } break;
      case "intermittent-errors": if (service.id === "user-service") errorRate = 18 + Math.max(0, wave * 3); break;
      case "recovery": latencyMultiplier = 1.12; errorRate = Math.max(0.1, errorRate * 0.7); break;
      case "normal": break;
    }

    const requestRate = Math.max(0, Math.round(service.baselineRequestRate * requestMultiplier * noise));
    const averageLatencyMs = Math.max(0, round(service.baselineLatencyMs * latencyMultiplier * noise));
    const p50LatencyMs = round(averageLatencyMs * 0.72);
    const p95LatencyMs = round(averageLatencyMs * 2.15);
    const p99LatencyMs = round(averageLatencyMs * 3.5);
    const cpuUsagePct = Math.min(99, round(service.baselineCpuPct * noise + cpuBoost));
    const memoryUsagePct = Math.min(99, round(service.baselineMemoryPct + memoryBoost + wave * 2));
    const safeErrorRate = Math.min(100, Math.max(0, round(errorRate)));

    return {
      timestamp: timestamp.toISOString(), serviceId: service.id, requestRate,
      errorRatePct: safeErrorRate, averageLatencyMs, p50LatencyMs, p95LatencyMs,
      p99LatencyMs, cpuUsagePct, memoryUsagePct,
      status: healthFor(safeErrorRate, p95LatencyMs, forcedDown),
    };
  }

  private addTrace(sample: TelemetrySample): void {
    const service = SERVICE_CATALOG.find((candidate) => candidate.id === sample.serviceId);
    if (!service) return;
    const failed = sample.status === "down" || sample.errorRatePct >= 5;
    const total = Math.max(1, round(sample.p95LatencyMs * (0.72 + (this.sampleIndex % 5) / 10)));
    const api = round(total * 0.18);
    const handler = round(total * 0.37);
    const database = Math.max(0, round(total - api - handler));
    this.traces.unshift({
      traceId: randomUUID(), timestamp: sample.timestamp, serviceId: sample.serviceId,
      serviceName: service.name,
      operation: service.id === "task-service" ? "GET /api/tasks" : `GET /api/${service.id.replace("-service", "")}`,
      durationMs: total, statusCode: sample.status === "down" ? 503 : failed ? 500 : 200,
      status: failed ? "error" : "ok",
      spans: [
        { name: "HTTP request", service: "api-gateway", durationMs: api, status: failed ? "error" : "ok" },
        { name: "Service handler", service: service.name, durationMs: handler, status: failed ? "error" : "ok" },
        { name: "Database query", service: "postgresql", durationMs: database, status: failed ? "error" : "ok" },
      ],
    });
    if (this.traces.length > MAX_TRACES) this.traces.length = MAX_TRACES;
  }
}
