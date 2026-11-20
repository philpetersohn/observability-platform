import { describe, expect, it } from "vitest";
import { parseServicesResponse } from "./serviceApi";

const validService = {
  id: "auth-api",
  serviceId: "auth-api",
  name: "Authentication API",
  description: "Auth service",
  timestamp: "2026-11-19T17:00:00.000Z",
  requestRate: 12,
  errorRatePct: 0.2,
  averageLatencyMs: 40,
  p50LatencyMs: 30,
  p95LatencyMs: 80,
  p99LatencyMs: 120,
  cpuUsagePct: 25,
  memoryUsagePct: 40,
  status: "healthy",
};

describe("parseServicesResponse", () => {
  const valid = {
    data: [validService],
    meta: { count: 1, generatedAt: "2026-11-19T17:00:00.000Z" },
  };

  it("accepts a valid response", () => {
    expect(parseServicesResponse(valid)).toEqual(valid);
  });

  it("rejects missing fields and malformed payloads", () => {
    expect(() => parseServicesResponse(null)).toThrow("Invalid services API response");
    expect(() => parseServicesResponse({ data: [] })).toThrow("Invalid services API response");
    expect(() => parseServicesResponse({ ...valid, data: [{ ...validService, status: "unknown" }] })).toThrow("Invalid services API response");
  });

  it("rejects invalid metrics and timestamps", () => {
    expect(() => parseServicesResponse({ ...valid, data: [{ ...validService, requestRate: "12" }] })).toThrow("Invalid services API response");
    expect(() => parseServicesResponse({ ...valid, meta: { count: 1, generatedAt: "not-a-date" } })).toThrow("Invalid services API response");
  });

  it("rejects inconsistent metadata counts", () => {
    expect(() => parseServicesResponse({ ...valid, meta: { ...valid.meta, count: 2 } })).toThrow("Invalid services API response");
  });
});
