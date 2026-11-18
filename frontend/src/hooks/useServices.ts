import { useEffect, useState } from "react";
import type { ServiceSummary } from "../types/services";

export function useServices() {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return { services, isLoading, error };
}
