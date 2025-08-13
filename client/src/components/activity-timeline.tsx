import { useTimeline } from "../hooks/useTimeline";
import { Mail, MessageCircle, Clock, FileText, User, CheckCircle, Send } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "email" | "reply" | "followup" | "note" | "profile";
  title: string;
  description: string;
  timeAgo: string;
  color: string;
  icon?: any;
}

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

function getEventStyle(type: string): { color: string; bgColor: string; icon: any } {
  switch (type) {
    case "email":
    case "email_sent":
    case "draft_generated":
      return { 
        color: "text-purple-600", 
        bgColor: "bg-purple-100",
        icon: Mail
      };
    case "reply":
    case "reply_received":
      return { 
        color: "text-green-600", 
        bgColor: "bg-green-100",
        icon: MessageCircle
      };
    case "followup":
      return { 
        color: "text-orange-600", 
        bgColor: "bg-orange-100",
        icon: Clock
      };
    case "note":
      return { 
        color: "text-blue-600", 
        bgColor: "bg-blue-100",
        icon: FileText
      };
    case "profile":
      return { 
        color: "text-purple-600", 
        bgColor: "bg-purple-100",
        icon: User
      };
    default:
      return { 
        color: "text-gray-600", 
        bgColor: "bg-gray-100",
        icon: CheckCircle
      };
  }
}

function formatDescription(description: any): string {
  if (typeof description === 'string') {
    return description;
  }
  
  if (typeof description === 'object' && description !== null) {
    // Handle reply description objects
    if (description.subject && description.snippet) {
      return `"${description.snippet.substring(0, 50)}${description.snippet.length > 50 ? '...' : ''}"`;
    }
    
    // Handle draft generation description objects
    if (description.purpose && description.tone) {
      const parts = [];
      if (description.purpose) parts.push(`${description.purpose} email`);
      if (description.tone) parts.push(`${description.tone} tone`);
      if (description.length) parts.push(`${description.length} length`);
      if (description.batch) parts.push('(batch)');
      return parts.join(', ');
    }
    
    // Fallback for other object types
    return Object.entries(description)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }
  
  return String(description);
}

export default function ActivityTimeline() {
  const { timeline, loading, error } = useTimeline();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
        Failed to load timeline: {error}
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-sm text-gray-500 bg-gray-50 p-6 rounded-xl text-center">
        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="font-medium">No recent activity</p>
        <p className="text-xs mt-1">Your activity will appear here</p>
      </div>
    );
  }

  const formattedEvents: TimelineEvent[] = timeline.map(event => {
    const style = getEventStyle(event.type);
    return {
      id: event.id,
      type: event.type,
      title: event.title,
      description: formatDescription(event.description),
      timeAgo: formatTimeAgo(event.at),
      color: style.color,
      bgColor: style.bgColor,
      icon: style.icon
    };
  });

  return (
    <div className="space-y-3">
      {formattedEvents.map((event) => {
        const Icon = event.icon;
        return (
          <div key={event.id} className="flex items-start space-x-3 group">
            <div className={`w-8 h-8 ${event.bgColor} rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110`}>
              <Icon className={`w-4 h-4 ${event.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-semibold">{event.title}</span>
                {event.description && (
                  <span className="text-gray-600 ml-1">{event.description}</span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{event.timeAgo}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}