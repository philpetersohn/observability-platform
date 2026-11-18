import type { ServiceHealthCardsProps } from "../types";

export default function ServiceHealthCard({
  title,
  service,
  status,
}: ServiceHealthCardsProps) {
  return (
    <div>
      <h1>{title}</h1>
      <p>{service}</p>
      <p>{status}</p>
    </div>
  );
}
