import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, RotateCcw, Loader2, AlertCircle, CheckCircle2, User, Building2 } from "lucide-react";
import { generateEmail, sendEmail, type EmailDraft } from "@/lib/api";
import { useConnections } from "@/hooks/useConnections";
import { getConnectionStatus, formatTimeSince } from "@/lib/stateMachine";
import type { Connection } from "@/lib/api";

interface EmailComposerProps {
  selectedContacts?: string[];
}

const PURPOSE_OPTIONS = [
  {
    value: "advice",
    label: "Seeking Advice",
    description: "Ask for career guidance or insights"
  },
  {
    value: "internship", 
    label: "Internship Inquiry",
    description: "Explore internship opportunities"
  },
  {
    value: "reaching-out",
    label: "Just Reaching Out", 
    description: "General networking and connection"
  },
  {
    value: "custom",
    label: "Custom",
    description: "Write your own purpose"
  }
];

export default function EmailComposer({ selectedContacts = [] }: EmailComposerProps) {
  const { connections } = useConnections();
  const [purpose, setPurpose] = useState("advice");
  const [customPurpose, setCustomPurpose] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get the selected connection
  const selectedConnection = selectedContacts.length > 0 
    ? connections.find(c => c.id === selectedContacts[0])
    : null;

  const handleGenerate = async () => {
    if (!selectedConnection) return;
    
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const finalPurpose = purpose === "custom" ? customPurpose : purpose;
      
      if (!finalPurpose.trim()) {
        throw new Error("Please enter a custom purpose");
      }

      const draft = await generateEmail({
        connection_id: selectedConnection.id,
        purpose: finalPurpose,
        tone: "warm",
        length: "medium"
      });
      
      setEmailDraft(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate email");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedConnection || !emailDraft) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const finalPurpose = purpose === "custom" ? customPurpose : purpose;
      const newDraft = await generateEmail({
        connection_id: selectedConnection.id,
        purpose: finalPurpose,
        tone: "warm",
        length: "medium"
      });
      
      setEmailDraft(newDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate email");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!emailDraft) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      await sendEmail(emailDraft.id);
      setSuccess("Email sent successfully! The connection status has been updated.");
      setEmailDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const isCustomPurpose = purpose === "custom";
  const canGenerate = selectedConnection && (isCustomPurpose ? customPurpose.trim() : true);

  return (
    <div className="card-base card-hover">
      {/* Selected Contacts */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selected Contacts
        </label>
        
        {selectedContacts.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a connection to compose an email.
            </AlertDescription>
          </Alert>
        )}

        {selectedContacts.length > 1 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Multi-contact email generation coming soon! Please select only one connection for now.
            </AlertDescription>
          </Alert>
        )}

        {selectedConnection && selectedContacts.length === 1 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 !text-white rounded-xl p-2">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium text-gray-900">{selectedConnection.fullName || selectedConnection.full_name}</h3>
                  {selectedConnection.alumni && (
                    <Badge variant="secondary">Alumni</Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {selectedConnection.role && selectedConnection.company && (
                    <div className="flex items-center space-x-1">
                      <Building2 className="w-3 h-3" />
                      <span>{selectedConnection.role} at {selectedConnection.company}</span>
                    </div>
                  )}
                  {selectedConnection.school && (
                    <div>{selectedConnection.school}</div>
                  )}
                  <div className="space-y-1">
                    {(() => {
                      const { stateInfo, actionInfo, cycle, followupCount } = getConnectionStatus(selectedConnection);
                      return (
                        <>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={stateInfo.color === 'gray' ? 'outline' : stateInfo.color === 'blue' ? 'default' : 
                                       stateInfo.color === 'yellow' ? 'warning' : stateInfo.color === 'green' ? 'success' : 
                                       stateInfo.color === 'red' ? 'destructive' : 'secondary'}
                            >
                              {stateInfo.label}
                            </Badge>
                            {cycle > 1 && (
                              <Badge variant="outline">Cycle {cycle}</Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {actionInfo.description}
                            {followupCount > 0 && ` • ${followupCount} follow-ups sent`}
                            {selectedConnection.lastContactedAt && ` • Last contacted ${formatTimeSince(selectedConnection.lastContactedAt)}`}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Purpose */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Email Purpose</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PURPOSE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={purpose === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPurpose(option.value)}
              className={`h-auto p-4 text-left justify-start ${
                purpose === option.value 
                  ? "" 
                  : "hover:bg-gray-50"
              }`}
            >
              <div>
                <div className={`font-medium ${
                  purpose === option.value ? "!text-gray-900" : "text-gray-900"
                }`}>{option.label}</div>
                <div className={`text-xs mt-1 ${
                  purpose === option.value ? "!text-gray-800" : "text-gray-500"
                }`}>
                  {option.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        {isCustomPurpose && (
          <div className="mt-3">
            <Input
              placeholder="Enter your custom purpose..."
              value={customPurpose}
              onChange={(e) => setCustomPurpose(e.target.value)}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="mb-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Generate Button */}
      <div className="mb-6">
        <Button 
          className="w-full"
          disabled={!canGenerate || isGenerating || selectedContacts.length !== 1}
          onClick={handleGenerate}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Email...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Generate Email with AI
            </>
          )}
        </Button>
      </div>

      {/* Email Display */}
      {emailDraft && (
        <div className="mb-6">
          {/* Subject Line */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
            <Input
              value={emailDraft.subject}
              readOnly
              className="bg-gray-50"
            />
          </div>

          {/* Email Body */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Email Body</label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80"
                onClick={handleRegenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-1" />
                )}
                Regenerate
              </Button>
            </div>
            <Textarea
              value={emailDraft.body}
              readOnly
              className="min-h-64 bg-gray-50 resize-none"
            />
          </div>

          {/* Send Button */}
          <Button 
            className="w-full"
            disabled={isSending}
            onClick={handleSend}
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending Email...
              </>
            ) : (
              <>
                Send Email
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}