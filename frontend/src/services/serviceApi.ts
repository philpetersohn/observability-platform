import type { ServicesResponse } from "../types/services";

const SERVICES_URL = "http://127.0.0.1:3000/api/services";

export async function getServices(): Promise<ServicesResponse> {
  const response = await fetch(SERVICES_URL);

  if (!response.ok) {
    throw new Error(`GET /api/services failed with ${response.status}`);
  }

  return (await response.json()) as ServicesResponse;
}
