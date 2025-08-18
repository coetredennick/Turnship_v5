import { useState, useEffect } from "react";
import { getAnalytics } from "../lib/api";

export interface AnalyticsData {
  // Email metrics
  sendsLast7: number;
  sendsLast28: number;
  
  // Connection metrics
  totalConnections: number;
  activeConnections: number;
  
  // Reply metrics
  totalReplies: number;
  replyRate: number;
  positiveReplies: number;
  negativeReplies: number;
  positiveReplyRate: number;
  
  // Follow-up metrics
  followupsScheduled: number;
  followupsOverdue: number;
  followupsOnTime: number;
  
  // State-based breakdown (NEW - use these!)
  stateFunnel: Record<string, number>;
  stateBreakdown: Array<{ state: string; _count: { state: number } }>;
  
  // Legacy breakdown (keep for now, remove later)
  stageFunnel: Record<string, number>;
  stageBreakdown: Array<{ stage: string; _count: { stage: number } }>;
  
  // Activity trends
  dailyActivity: Array<{ date: string; emails: number }>;
  
  // Performance insights
  insights: {
    bestReplyDay: string;
    averageResponseTime: string;
    topPerformingStage: string;
  };
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}