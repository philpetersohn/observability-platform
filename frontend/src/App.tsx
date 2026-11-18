import ServiceHealthGrid from "./components/ServiceHealthGrid";
import type { ServiceHealthCardsProps } from "./types";

const services: ServiceHealthCardsProps[] = [
  {
    id: "auth-api",
    title: "Authentication API",
    service: "Authentication",
    status: "Running",
  },
  {
    id: "payments",
    title: "Payment Service",
    service: "Payments",
    status: "Degraded",
  },
  {
    id: "notifications",
    title: "Notification Service",
    service: "Notification",
    status: "Down",
  },
];

export function App() {
  return (
    <main>
      <ServiceHealthGrid services={services} />
    </main>
  );
}
