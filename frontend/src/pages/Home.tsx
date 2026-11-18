import { Hello } from "../components/Hello";
import { useIsLocalhost } from "../hooks/useIsLocalhost";

export function Home() {
  const isLocalhost = useIsLocalhost();

  if (!isLocalhost) {
    return <p>Open this app on localhost to see the hello page.</p>;
  }

  return <Hello />;
}
