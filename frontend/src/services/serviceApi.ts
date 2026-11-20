import type { ServiceSummary, ServicesResponse } from "../types/services";

const SERVICES_URL = "http://127.0.0.1:3000/api/services";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

function isServiceSummary(value: unknown): value is ServiceSummary {
  if (!isRecord(value)) return false;
  const strings = ["id", "serviceId", "name", "description"];
  const metrics = [
    "requestRate", "errorRatePct", "averageLatencyMs", "p50LatencyMs",
    "p95LatencyMs", "p99LatencyMs", "cpuUsagePct", "memoryUsagePct",
  ];
  return strings.every((key) => typeof value[key] === "string") &&
    metrics.every((key) => typeof value[key] === "number" && Number.isFinite(value[key])) &&
    isValidTimestamp(value.timestamp) &&
    (value.status === "healthy" || value.status === "degraded" || value.status === "down");
}

// Network JSON is untrusted at runtime even when a TypeScript return type exists.
export function parseServicesResponse(value: unknown): ServicesResponse {
  if (!isRecord(value) || !Array.isArray(value.data) || !isRecord(value.meta) ||
      !Number.isInteger(value.meta.count) || value.meta.count !== value.data.length ||
      !isValidTimestamp(value.meta.generatedAt) ||
      !value.data.every(isServiceSummary)) {
    throw new Error("Invalid services API response");
  }
  return value as unknown as ServicesResponse;
}

/** Fetch and validate service data; transport failures and invalid payloads throw. */
export async function getServices(signal?: AbortSignal): Promise<ServicesResponse> {
  const response = await fetch(SERVICES_URL, { signal });
  if (!response.ok) {
    throw new Error(`GET /api/services failed with ${response.status}`);
  }
  return parseServicesResponse(await response.json());
}
