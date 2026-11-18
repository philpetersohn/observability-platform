export type HostKind = "localhost" | "other";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function hostKind(hostname: string): HostKind {
  return LOCAL_HOSTS.has(hostname) ? "localhost" : "other";
}
