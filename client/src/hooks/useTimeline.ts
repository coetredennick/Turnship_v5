import { useState, useEffect } from "react";
import { getTimeline } from "../lib/api";

export interface TimelineEvent {
  id: string;
  type: "email" | "reply" | "followup" | "note" | "profile";
  title: string;
  description: string;
  timeAgo: string;
  color: string;
  at: string; // ISO timestamp
  connectionId?: string;
}

export function useTimeline() {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTimeline();
      setTimeline(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch timeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  return {
    timeline,
    loading,
    error,
    refetch: fetchTimeline,
  };
}