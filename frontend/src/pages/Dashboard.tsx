import ServiceHealthGrid from "../components/ServiceHealthGrid";
import { useServices } from "../hooks/useServices";
import { toServiceCard } from "../services/toServiceCard";

export default function Dashboard() {
  const { services, isLoading, error } = useServices();

  if (isLoading && services.length === 0) {
    return <p>Loading services…</p>;
  }

  if (error && services.length === 0) {
    return <p>{error}</p>;
  }

  return <ServiceHealthGrid services={services.map(toServiceCard)} />;
}
