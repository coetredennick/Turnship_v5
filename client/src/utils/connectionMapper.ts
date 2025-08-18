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
  state?: string;
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

  // Map state to status
  const getStatus = (state: string): DisplayConnection["status"] => {
    switch (state) {
      case "NOT_CONTACTED":
        return undefined;
      case "DRAFTING":
        return undefined;
      case "SENT":
        return "sent";
      case "AWAITING_REPLY":
        return "sent";
      case "REPLIED":
        return "replied";
      case "BOUNCED":
        return "due";
      case "DO_NOT_CONTACT":
        return undefined;
      case "CLOSED":
        return undefined;
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
    state: connection.state || "NOT_CONTACTED",
    currentDraftId: connection.currentDraftId || connection.current_draft_id,
    lastContactedAt: connection.lastContactedAt || connection.last_contacted_at,
    lastReplyAt: connection.lastReplyAt || connection.last_reply_at,
    replySentiment: connection.replySentiment || connection.reply_sentiment,
    timeAgo: getTimeAgo(connection.lastContactedAt || connection.last_contacted_at || connection.createdAt || connection.created_at),
    status: getStatus(connection.state || "NOT_CONTACTED"),
  };
}

export function groupConnectionsByState(connections: Connection[]): Record<string, DisplayConnection[]> {
  const groups: Record<string, DisplayConnection[]> = {
    "NOT_CONTACTED": [],
    "DRAFTING": [],
    "SENT": [],
    "AWAITING_REPLY": [],
    "REPLIED": [],
    "BOUNCED": [],
    "DO_NOT_CONTACT": [],
    "CLOSED": []
  };

  connections.forEach(connection => {
    const displayConnection = mapConnectionToDisplayConnection(connection);
    const state = connection.state || "NOT_CONTACTED";
    
    if (groups[state]) {
      groups[state].push(displayConnection);
    } else {
      groups["NOT_CONTACTED"].push(displayConnection);
    }
  });

  return groups;
}

// Keep the old function for backward compatibility during migration
export function groupConnectionsByStage(connections: Connection[]): Record<string, DisplayConnection[]> {
  console.warn('groupConnectionsByStage is deprecated. Use groupConnectionsByState instead.');
  
  // Map state to legacy stage for backward compatibility
  const stateToStage: Record<string, string> = {
    "NOT_CONTACTED": "Not Contacted",
    "DRAFTING": "First Outreach",
    "SENT": "First Outreach",
    "AWAITING_REPLY": "First Outreach",
    "REPLIED": "Second Outreach",
    "BOUNCED": "Third Outreach",
    "DO_NOT_CONTACT": "Third Outreach",
    "CLOSED": "Third Outreach"
  };
  
  const groups: Record<string, DisplayConnection[]> = {
    "Not Contacted": [],
    "First Outreach": [],
    "Second Outreach": [],
    "Third Outreach": [],
  };

  connections.forEach(connection => {
    const displayConnection = mapConnectionToDisplayConnection(connection);
    const state = connection.state || "NOT_CONTACTED";
    const stage = stateToStage[state] || "Not Contacted";
    
    if (groups[stage]) {
      groups[stage].push(displayConnection);
    }
  });

  return groups;
}