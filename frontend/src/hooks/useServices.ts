import { useEffect, useState } from "react";
import { getServices } from "../services/serviceApi";
import type { ServiceSummary } from "../types/services";

export function useServices() {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);

    getServices(controller.signal)
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }
        setServices(response.data);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(
          cause instanceof Error ? cause.message : "Failed to load services",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  return { services, isLoading, error };
}
