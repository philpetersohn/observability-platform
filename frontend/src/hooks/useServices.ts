import { useEffect, useState } from "react";
import { getServices } from "../services/serviceApi";
import type { ServiceSummary } from "../types/services";

export function useServices() {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);

    getServices()
      .then((response) => {
        if (cancelled) {
          return;
        }
        setServices(response.data);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        setError(
          cause instanceof Error ? cause.message : "Failed to load services",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { services, isLoading, error };
}
