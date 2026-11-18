import { useMemo } from "react";
import { hostKind } from "../types";

export function useIsLocalhost(): boolean {
  return useMemo(() => hostKind(window.location.hostname) === "localhost", []);
}
