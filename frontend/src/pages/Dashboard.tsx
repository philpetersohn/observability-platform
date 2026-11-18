import { useServices } from "../hooks/useServices";

export default function Dashboard() {
  const { services, isLoading, error } = useServices();

  if (isLoading && services.length === 0) {
    return <p>Loading services…</p>;
  }

  if (error && services.length === 0) {
    return <p>{error}</p>;
  }

  return (
    <div>
      Home
      <ul>
        {services.map((service) => (
          <li key={service.id}>{service.name}</li>
        ))}
      </ul>
    </div>
  );
}
