
import { useState, useEffect } from "react";
import type { Connection } from "../lib/api";
import { getConnections } from "../lib/api";

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConnections();
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch connections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  return {
    connections,
    loading,
    error,
    refetch: fetchConnections,
  };
}
