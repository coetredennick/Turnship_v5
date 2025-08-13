import type { Connection } from "@/lib/api";

export interface DisplayConnection {
  id: string;
  name: string;
  role?: string;
  company?: string;
  email?: string;
  tags?: string[];
  alumni?: boolean;
  school?: string;
  grad_year?: number;
  stage?: string;
  stageStatus?: "ready" | "draft_saved" | "waiting" | "completed";
  currentDraftId?: string;
  lastContactedAt?: string;
  lastReplyAt?: string;
  replySentiment?: "positive" | "neutral" | "negative";
  timeAgo?: string;
  status?: "sent" | "replied" | "due" | "active";
}

export function mapConnectionToDisplayConnection(connection: Connection): DisplayConnection {
  // Calculate time ago from last_contacted_at or created_at
  const getTimeAgo = (date: Date | string | null): string => {
    if (!date) return "Never";
    
    // Convert string dates to Date objects
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) return "Never";
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1d";
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
    return `${Math.floor(diffDays / 30)}mo`;
  };

  // Map stage to status
  const getStatus = (stage: string): DisplayConnection["status"] => {
    switch (stage?.toLowerCase()) {
      case "not contacted":
        return undefined;
      case "first outreach":
        return "sent";
      case "second outreach":
        return "replied";
      case "third outreach":
        return "due";
      default:
        return undefined;
    }
  };

  return {
    id: connection.id,
    name: connection.fullName || connection.full_name || "Unknown",
    role: connection.role,
    company: connection.company,
    email: connection.email,
    tags: connection.tags,
    alumni: connection.alumni,
    school: connection.school,
    grad_year: connection.gradYear || connection.grad_year,
    stage: connection.stage || "Not Contacted",
    stageStatus: connection.stageStatus || connection.stage_status || "ready",
    currentDraftId: connection.currentDraftId || connection.current_draft_id,
    lastContactedAt: connection.lastContactedAt || connection.last_contacted_at,
    lastReplyAt: connection.lastReplyAt || connection.last_reply_at,
    replySentiment: connection.replySentiment || connection.reply_sentiment,
    timeAgo: getTimeAgo(connection.lastContactedAt || connection.last_contacted_at || connection.createdAt || connection.created_at),
    status: getStatus(connection.stage),
  };
}

export function groupConnectionsByStage(connections: Connection[]): Record<string, DisplayConnection[]> {
  const groups: Record<string, DisplayConnection[]> = {
    "Not Contacted": [],
    "First Outreach": [],
    "Second Outreach": [],
    "Third Outreach": [],
  };

  connections.forEach(connection => {
    const displayConnection = mapConnectionToDisplayConnection(connection);
    const stage = connection.stage || "Not Contacted";
    
    if (groups[stage]) {
      groups[stage].push(displayConnection);
    } else {
      // Default to Not Contacted if stage doesn't match known stages
      groups["Not Contacted"].push(displayConnection);
    }
  });

  return groups;
}