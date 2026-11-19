import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getServices } from "../services/serviceApi";
import type { ServiceSummary } from "../types/services";
import { useServices } from "./useServices";

vi.mock("../services/serviceApi", () => ({
  getServices: vi.fn(),
}));

function service(id: string, name: string): ServiceSummary {
  return {
    id,
    serviceId: id,
    name,
    description: `${name} description`,
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
}

const services = [
  service("auth-api", "Authentication API"),
  service("task-service", "Task Service"),
];

describe("useServices", () => {
  it("loads two services", async () => {
    vi.mocked(getServices).mockResolvedValue({
      data: services,
      meta: { count: services.length, generatedAt: "2026-11-19T17:00:00.000Z" },
    });

    const { result } = renderHook(() => useServices());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.services).toHaveLength(2);
    });

    expect(result.current.services).toEqual(services);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("reports an error when the first request fails", async () => {
    vi.mocked(getServices).mockRejectedValue(new Error("Service unavailable"));

    const { result } = renderHook(() => useServices());

    await waitFor(() => {
      expect(result.current.error).toBe("Service unavailable");
    });

    expect(result.current.services).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.lastSuccessfulRefresh).toBeNull();
  });
});
