import { useCallback, useEffect, useRef, useState } from "react";
import { getServices } from "../services/serviceApi";
import type { ServiceSummary } from "../types/services";

/** Owns the service request lifecycle; components consume its state, not fetch directly. */
export function useServices() {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSuccessfulRefresh, setLastSuccessfulRefresh] = useState<
    string | null
  >(null);

  const [dataGeneratedAt, setDataGeneratedAt] = useState<string | null>(null);

  // Refs survive renders without triggering a render themselves.
  const abortRef = useRef<AbortController | null>(null);
  // Tracks whether the initial successful load completed.
  const hasLoadedRef = useRef(false);

  // Cancel the previous request so an older response cannot replace newer data.
  const refresh = useCallback(async () => {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    // Refreshing retains the previous service cards; initial loading does not.
    if (hasLoadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await getServices(controller.signal);

      if (controller.signal.aborted) {
        return;
      }

      setServices(response.data);
      setDataGeneratedAt(response.meta.generatedAt);
      setError(null);
      setLastSuccessfulRefresh(new Date().toISOString());
      hasLoadedRef.current = true;
    } catch (cause: unknown) {
      if (controller.signal.aborted) {
        return;
      }

      setError(
        cause instanceof Error ? cause.message : "Failed to load services",
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // Fetch on mount; abort pending work when the effect is cleaned up.
  useEffect(() => {
    void refresh();

    return () => {
      abortRef.current?.abort();
    };
  }, [refresh]);

  return {
    services,
    isLoading,
    error,
    isRefreshing,
    lastSuccessfulRefresh,
    dataGeneratedAt,
    refresh,
  };
}
