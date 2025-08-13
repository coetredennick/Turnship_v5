import { useState, useEffect } from "react";

export interface Followup {
  id: string;
  userId: string;
  connectionId: string;
  dueAt: string;
  status: string;
  rule?: string;
  note?: string;
  connection?: {
    id: string;
    fullName: string;
    email: string;
    company?: string;
    role?: string;
  };
  // Calculated fields from API
  timeAgo?: string;
  urgency?: 'high' | 'medium' | 'low';
  diffDays?: number;
}

export function useFollowups() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/followups', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch follow-ups');
      const data = await response.json();
      setFollowups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch follow-ups");
    } finally {
      setLoading(false);
    }
  };

  const fetchDueFollowups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/followups/due', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch due follow-ups');
      const data = await response.json();
      setFollowups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch due follow-ups");
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (followupId: string) => {
    try {
      const response = await fetch(`/api/followups/${followupId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      if (!response.ok) throw new Error('Failed to update follow-up');
      
      // Refresh the list
      await fetchDueFollowups();
    } catch (err) {
      console.error('Error marking follow-up as completed:', err);
      throw err;
    }
  };

  const createFollowup = async (connectionId: string, dueAt: string, note?: string) => {
    try {
      const response = await fetch('/api/followups', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: connectionId,
          due_at: dueAt,
          note
        })
      });
      if (!response.ok) throw new Error('Failed to create follow-up');
      
      const newFollowup = await response.json();
      setFollowups(prev => [...prev, newFollowup]);
      return newFollowup;
    } catch (err) {
      console.error('Error creating follow-up:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchDueFollowups();
  }, []);

  return {
    followups,
    loading,
    error,
    refetch: fetchFollowups,
    fetchDueFollowups,
    markAsCompleted,
    createFollowup,
  };
}