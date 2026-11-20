import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServices } from "../services/serviceApi";
import type { ServiceSummary, ServicesResponse } from "../types/services";
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

function response(
  data: ServiceSummary[],
  generatedAt = "2026-11-19T17:00:00.000Z",
): ServicesResponse {
  return { data, meta: { count: data.length, generatedAt } };
}

describe("useServices", () => {
  beforeEach(() => {
    vi.mocked(getServices).mockReset();
    vi.useRealTimers();
  });

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
    expect(result.current.dataGeneratedAt).toBe("2026-11-19T17:00:00.000Z");
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
    expect(result.current.dataGeneratedAt).toBeNull();
  });

  it("preserves existing services when refresh fails", async () => {
    vi.mocked(getServices).mockResolvedValueOnce({
      data: services,
      meta: { count: services.length, generatedAt: "2026-11-19T17:00:00.000Z" },
    });

    const { result } = renderHook(() => useServices());

    await waitFor(() => {
      expect(result.current.services).toHaveLength(2);
    });

    vi.mocked(getServices).mockRejectedValueOnce(new Error("Refresh failed"));

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Refresh failed");
    });

    expect(result.current.services).toEqual(services);
    expect(result.current.dataGeneratedAt).toBe("2026-11-19T17:00:00.000Z");
    expect(result.current.isRefreshing).toBe(false);
  });

  it("clears the error and updates data after a successful refresh", async () => {
    const updatedServices = services.map((item) => ({
      ...item,
      requestRate: item.requestRate + 30,
      errorRatePct: 1.4,
      status: "degraded" as const,
    }));

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-19T17:00:00.000Z"));

    vi.mocked(getServices).mockResolvedValueOnce({
      data: services,
      meta: { count: services.length, generatedAt: "2026-11-19T17:00:00.000Z" },
    });

    const { result } = renderHook(() => useServices());

    await waitFor(() => {
      expect(result.current.services).toEqual(services);
    });

    const firstRefresh = result.current.lastSuccessfulRefresh;

    vi.mocked(getServices).mockRejectedValueOnce(new Error("Refresh failed"));

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Refresh failed");
    });

    expect(result.current.services).toEqual(services);

    vi.setSystemTime(new Date("2026-11-19T17:05:00.000Z"));
    vi.mocked(getServices).mockResolvedValueOnce({
      data: updatedServices,
      meta: {
        count: updatedServices.length,
        generatedAt: "2026-11-19T17:05:00.000Z",
      },
    });

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });

    expect(result.current.services).toEqual(updatedServices);
    expect(result.current.dataGeneratedAt).toBe("2026-11-19T17:05:00.000Z");
    expect(result.current.lastSuccessfulRefresh).not.toBe(firstRefresh);
    expect(result.current.lastSuccessfulRefresh).toBe(
      "2026-11-19T17:05:00.000Z",
    );
    expect(result.current.isRefreshing).toBe(false);

    vi.useRealTimers();
  });

  it("uses the latest response when refreshes overlap", async () => {
    const updatedServices = services.map((item) => ({
      ...item,
      requestRate: 80,
    }));
    const pending: Array<{
      signal: AbortSignal | undefined;
      resolve: (value: ServicesResponse) => void;
    }> = [];

    vi.mocked(getServices).mockResolvedValueOnce(response(services));

    const { result } = renderHook(() => useServices());

    await waitFor(() => {
      expect(result.current.services).toEqual(services);
    });

    vi.mocked(getServices).mockImplementation((signal) => {
      return new Promise((resolve) => {
        pending.push({ signal, resolve });
      });
    });

    act(() => {
      void result.current.refresh();
      void result.current.refresh();
    });

    await waitFor(() => {
      expect(pending).toHaveLength(2);
    });

    expect(pending[0]?.signal?.aborted).toBe(true);
    expect(pending[1]?.signal?.aborted).toBe(false);

    await act(async () => {
      pending[1]?.resolve(
        response(updatedServices, "2026-11-19T17:06:00.000Z"),
      );
      pending[0]?.resolve(response(services));
    });

    await waitFor(() => {
      expect(result.current.services).toEqual(updatedServices);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isRefreshing).toBe(false);
  });

  it("cancels an in-flight request when the hook unmounts", async () => {
    let signal: AbortSignal | undefined;
    let resolveRequest: (value: ServicesResponse) => void = () => undefined;

    vi.mocked(getServices).mockImplementation((nextSignal) => {
      signal = nextSignal;
      return new Promise((resolve) => {
        resolveRequest = resolve;
      });
    });

    const { result, unmount } = renderHook(() => useServices());

    expect(result.current.isLoading).toBe(true);

    unmount();

    expect(signal?.aborted).toBe(true);

    await act(async () => {
      resolveRequest(response(services));
    });

    expect(result.current.services).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
