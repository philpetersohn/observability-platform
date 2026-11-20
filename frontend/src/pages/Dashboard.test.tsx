import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useServices } from "../hooks/useServices";
import type { ServiceSummary } from "../types/services";
import Dashboard from "./Dashboard";

vi.mock("../hooks/useServices", () => ({
  useServices: vi.fn(),
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

function hookState(
  overrides: Partial<ReturnType<typeof useServices>> = {},
): ReturnType<typeof useServices> {
  return {
    services: [],
    isLoading: false,
    error: null,
    isRefreshing: false,
    lastSuccessfulRefresh: null,
    dataGeneratedAt: null,
    refresh: vi.fn(),
    ...overrides,
  };
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.mocked(useServices).mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a loading message before the first response", () => {
    vi.mocked(useServices).mockReturnValue(hookState({ isLoading: true }));

    render(<Dashboard />);

    expect(screen.getByText("Loading services…")).toBeTruthy();
  });

  it("shows the initial error and a refresh button", () => {
    vi.mocked(useServices).mockReturnValue(
      hookState({ error: "Service unavailable" }),
    );

    render(<Dashboard />);

    expect(screen.getByRole("alert").textContent).toBe("Service unavailable");
    expect(screen.getByRole("button", { name: "Refresh" })).toBeTruthy();
  });

  it("renders the loaded services and last refresh time", () => {
    vi.mocked(useServices).mockReturnValue(
      hookState({
        services,
        lastSuccessfulRefresh: "2026-11-19T17:00:00.000Z",
        dataGeneratedAt: "2026-11-19T16:59:00.000Z",
      }),
    );

    render(<Dashboard />);

    expect(screen.getByText("Data generated at:", { exact: false })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Authentication API" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Task Service" })).toBeTruthy();
    expect(screen.getAllByText("Running")).toHaveLength(2);
    expect(document.querySelector("time")?.dateTime).toBe(
      "2026-11-19T17:00:00.000Z",
    );
  });

  it("shows a refreshing indicator without hiding the services", () => {
    vi.mocked(useServices).mockReturnValue(
      hookState({
        services,
        isRefreshing: true,
        lastSuccessfulRefresh: "2026-11-19T17:00:00.000Z",
      }),
    );

    render(<Dashboard />);

    expect(screen.getByRole("status").textContent).toBe("Refreshing…");
    expect(
      screen.getByRole("heading", { name: "Authentication API" }),
    ).toBeTruthy();
  });

  it("warns when refresh fails and keeps the previous services", () => {
    vi.mocked(useServices).mockReturnValue(
      hookState({
        services,
        error: "Refresh failed",
        lastSuccessfulRefresh: "2026-11-19T17:00:00.000Z",
      }),
    );

    render(<Dashboard />);

    expect(screen.getByRole("alert").textContent).toBe(
      "Refresh failed. Showing the last successful data.",
    );
    expect(screen.getByRole("heading", { name: "Task Service" })).toBeTruthy();
  });

  it("calls refresh when the button is clicked", () => {
    const refresh = vi.fn();
    vi.mocked(useServices).mockReturnValue(
      hookState({
        services,
        refresh,
        lastSuccessfulRefresh: "2026-11-19T17:00:00.000Z",
      }),
    );

    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(refresh).toHaveBeenCalledOnce();
  });
});
