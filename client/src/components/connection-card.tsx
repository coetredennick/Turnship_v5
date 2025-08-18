import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Send,
  Edit3,
  RefreshCw,
  MessageCircle
} from "lucide-react";

interface ConnectionCardProps {
  id?: string;
  name: string;
  role: string;
  company: string;
  timeAgo?: string;
  isAlumni?: boolean;
  state?: string;
  currentDraftId?: string;
  lastContactedAt?: string;
  onAction?: (action: string, connectionId: string) => void;
  onClick?: () => void;
}

export default function ConnectionCard({
  id,
  name,
  role,
  company,
  timeAgo,
  isAlumni,
  state = "NOT_CONTACTED",
  currentDraftId,
  lastContactedAt,
  onAction,
  onClick
}: ConnectionCardProps) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase();
  
  // State-based status indicator configuration
  const statusIndicators = {
    NOT_CONTACTED: { 
      icon: <AlertCircle className="w-3 h-3" />, 
      color: "bg-gray-400", 
      tooltip: "Not contacted" 
    },
    DRAFTING: { 
      icon: <Edit3 className="w-3 h-3" />, 
      color: "bg-yellow-500", 
      tooltip: "Drafting email" 
    },
    SENT: { 
      icon: <Send className="w-3 h-3" />, 
      color: "bg-blue-500", 
      tooltip: "Email sent" 
    },
    AWAITING_REPLY: { 
      icon: <Clock className="w-3 h-3" />, 
      color: "bg-blue-500", 
      tooltip: "Awaiting reply" 
    },
    REPLIED: {
      icon: <MessageCircle className="w-3 h-3" />, 
      color: "bg-green-500", 
      tooltip: "Received reply" 
    },
    BOUNCED: {
      icon: <AlertCircle className="w-3 h-3" />, 
      color: "bg-red-500", 
      tooltip: "Email bounced" 
    },
    DO_NOT_CONTACT: {
      icon: <AlertCircle className="w-3 h-3" />, 
      color: "bg-red-400", 
      tooltip: "Do not contact" 
    },
    CLOSED: { 
      icon: <CheckCircle className="w-3 h-3" />, 
      color: "bg-gray-400", 
      tooltip: "Closed" 
    }
  };

  // Action button configuration based on state
  const getActionButton = () => {
    if (!id || !onAction) return null;

    switch (state) {
      case "NOT_CONTACTED":
        return (
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-300"
            onClick={(e) => {
              e.stopPropagation();
              onAction("generate", id);
            }}
          >
            <Mail className="w-4 h-4 mr-2" />
            Generate Email
          </Button>
        );
      
      case "DRAFTING":
        if (currentDraftId) {
          return (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300"
              onClick={(e) => {
                e.stopPropagation();
                onAction("send", id);
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Review & Send
            </Button>
          );
        }
        break;
      
      case "AWAITING_REPLY":
        const daysSinceContact = lastContactedAt 
          ? Math.floor((Date.now() - new Date(lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        if (daysSinceContact >= 3) {
          return (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
              onClick={(e) => {
                e.stopPropagation();
                onAction("followup", id);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Send Follow-up ({daysSinceContact}d)
            </Button>
          );
        } else {
          return (
            <div className="mt-3 text-xs text-gray-500 text-center">
              Follow-up available in {3 - daysSinceContact} days
            </div>
          );
        }
        break;
      
      case "REPLIED":
        return (
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
            onClick={(e) => {
              e.stopPropagation();
              onAction("advance", id);
            }}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Next Cycle
          </Button>
        );
        break;
    }
    
    return null;
  };

  const statusIndicator = statusIndicators[state] || statusIndicators.NOT_CONTACTED;

  return (
    <div 
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all relative hover-lift"
      onClick={onClick}
    >
      {/* Status Indicator Dot */}
      <div 
        className={`absolute top-3 right-3 w-2 h-2 ${statusIndicator.color} rounded-full`}
        title={statusIndicator.tooltip}
      />
      
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-gray-700">{initials}</span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-medium text-gray-900 truncate">{name}</h4>
            {timeAgo && (
              <span className="text-xs text-gray-500 ml-2">{timeAgo}</span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 truncate">{role}</p>
          <p className="text-sm text-gray-500 truncate">{company}</p>
          
          <div className="flex items-center mt-2 gap-4">
            {isAlumni && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Alumni
              </Badge>
            )}
            
            <Badge variant="outline" className="text-xs">
              {state?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Not Contacted'}
            </Badge>
            
            {state === "DRAFTING" && currentDraftId && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                Draft
              </Badge>
            )}
            
            {(state === 'SENT' || state === 'AWAITING_REPLY') && lastContactedAt && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                {Math.floor((Date.now() - new Date(lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))}d ago
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Action Button */}
      {getActionButton()}
    </div>
  );
}