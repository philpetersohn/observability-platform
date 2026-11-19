import { useCallback, useEffect, useRef, useState } from "react";
import { getServices } from "../services/serviceApi";
import type { ServiceSummary } from "../types/services";

export function useServices() {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSuccessfulRefresh, setLastSuccessfulRefresh] = useState<
    string | null
  >(null);

  const abortRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

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
    refresh,
  };
}
