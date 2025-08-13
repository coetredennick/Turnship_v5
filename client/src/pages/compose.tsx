import { useState, useEffect } from "react";
import ConnectionSelector from "@/components/connection-selector";
import GeneratedDraftsModal from "@/components/generated-drafts-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mail, 
  Zap, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  batchGenerateEmails, 
  updateDraft, 
  sendEmail, 
  deleteDraft,
  type BatchGenerateResponse 
} from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useNavigationState } from "@/lib/useRouter";
import { useConnections } from "@/hooks/useConnections";

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
    value: "follow-up",
    label: "Follow-up",
    description: "Continue previous conversation"
  },
  {
    value: "custom",
    label: "Custom",
    description: "Write your own purpose"
  }
];


export default function Compose() {
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [purpose, setPurpose] = useState("advice");
  const [customPurpose, setCustomPurpose] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<BatchGenerateResponse | null>(null);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const { toast } = useToast();
  const navigationState = useNavigationState('/compose');
  const { refetch: refetchConnections } = useConnections();

  // Auto-select connection if navigated from connections page
  useEffect(() => {
    if (navigationState?.selectedConnection) {
      setSelectedConnections([navigationState.selectedConnection]);
    }
  }, [navigationState]);

  const handleGenerate = async () => {
    if (selectedConnections.length === 0) {
      toast({
        title: "No connections selected",
        description: "Please select at least one connection to generate emails",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setResults(null);

    try {
      let finalPurpose = purpose;
      
      if (purpose === "custom") {
        if (!customPurpose.trim()) {
          toast({
            title: "Custom purpose required",
            description: "Please enter a custom purpose for your email",
            variant: "destructive"
          });
          return;
        }
        finalPurpose = customPurpose;
      } else if (purpose === "context") {
        finalPurpose = "context-aware";
      }

      const response = await batchGenerateEmails({
        connection_ids: selectedConnections,
        purpose: finalPurpose,
        tone: "warm",
        length: "medium"
      });

      setResults(response);
      
      // Refresh connections to show updated stages
      await refetchConnections();
      
      // Open modal to show generated drafts
      if (response.success > 0) {
        setShowDraftsModal(true);
        setSelectedConnections([]);
      } else {
        toast({
          title: "Email generation complete",
          description: response.summary,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate emails",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async (draftId: string, subject: string, body: string) => {
    try {
      const result = await updateDraft(draftId, subject, body);
      console.log('Draft saved successfully:', result);
      // Refresh connections to show updated stage
      await refetchConnections();
      return result;
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Save failed", 
        description: "Failed to save draft. Please try again.",
        variant: "destructive"
      });
      throw error; // Re-throw so the modal can handle it
    }
  };

  const handleSendDraft = async (draftId: string) => {
    await sendEmail(draftId);
  };

  const handleDeleteDraft = async (draftId: string) => {
    await deleteDraft(draftId);
  };

  const getButtonText = () => {
    if (isGenerating) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating {selectedConnections.length} Email{selectedConnections.length !== 1 ? 's' : ''}...
        </>
      );
    }
    
    return (
      <>
        <Zap className="w-4 h-4 mr-2" />
        Generate {selectedConnections.length} Email{selectedConnections.length !== 1 ? 's' : ''}
      </>
    );
  };

  const getUserFirstName = () => {
    return "Student"; // In real app, would get from user context
  };

  return (
    <main className="px-6 py-8 animate-fade-in bg-gradient-to-br from-orange-50 via-powder-50 to-background min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">
          Ready to reach out, {getUserFirstName()}?
        </h1>
        <p className="text-lg text-gray-600 font-medium">
          select connections and generate personalized outreach emails.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Connection Selection */}
        <div className="space-y-6">
          <ConnectionSelector
            selectedConnections={selectedConnections}
            onSelectionChange={setSelectedConnections}
          />
        </div>

        {/* Right Column: Generation Controls */}
        <div className="space-y-8">
          <Card className="bg-white/70 backdrop-blur-sm border-border/50 shadow-soft-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <Mail className="w-5 h-5 text-primary" />
                Email Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Email Purpose */}
              <div>
                <label className="block text-sm font-display font-medium text-foreground mb-4">
                  Email Purpose
                </label>
                
                {/* 2x2 Grid with Context Button */}
                <div className="relative">
                  <div className="grid grid-cols-2 gap-3">
                    {PURPOSE_OPTIONS.slice(0, 4).map((option) => (
                      <Button
                        key={option.value}
                        variant={purpose === option.value ? "default" : "outline"}
                        size="lg"
                        onClick={() => setPurpose(option.value)}
                        className={`h-24 p-4 text-left justify-start rounded-2xl border-border/50 ${
                          purpose === option.value 
                            ? "bg-gradient-to-br from-purple-100 to-purple-200 shadow-soft-md" 
                            : "hover:bg-muted/50 hover:shadow-soft-sm"
                        }`}
                      >
                        <div>
                          <div className={`font-display font-semibold text-sm ${
                            purpose === option.value ? "!text-gray-900" : "text-gray-900"
                          }`}>{option.label}</div>
                          <div className={`text-xs mt-1 ${
                            purpose === option.value ? "!text-gray-800" : "text-gray-600"
                          }`}>
                            {option.description}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                  
                  {/* Centered Context Button */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Button
                      variant={purpose === "context" ? "default" : "outline"}
                      onClick={() => setPurpose("context")}
                      className={`h-18 w-18 rounded-full shadow-soft-lg border-2 ${
                        purpose === "context" 
                          ? "bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300" 
                          : "bg-white/90 hover:bg-white border-border/50 hover:shadow-soft-md"
                      }`}
                      title="Use connection context to determine purpose"
                    >
                      <div className="text-center">
                        <div className="text-xs font-display font-bold">Use</div>
                        <div className="text-xs font-display font-bold">Context</div>
                      </div>
                    </Button>
                  </div>
                </div>
                
                {/* Custom Option Below */}
                <div className="mt-4">
                  <Button
                    variant={purpose === "custom" ? "default" : "outline"}
                    size="lg"
                    onClick={() => setPurpose("custom")}
                    className={`w-full h-auto p-4 text-left justify-start rounded-2xl border-border/50 ${
                      purpose === "custom" 
                        ? "bg-gradient-to-br from-yellow-100 to-yellow-200 shadow-soft-md" 
                        : "hover:bg-muted/50 hover:shadow-soft-sm"
                    }`}
                  >
                    <div>
                      <div className={`font-display font-semibold text-sm ${
                        purpose === "custom" ? "!text-gray-900" : "text-gray-900"
                      }`}>Custom Purpose</div>
                      <div className={`text-xs mt-1 ${
                        purpose === "custom" ? "!text-gray-800" : "text-gray-600"
                      }`}>
                        Write your own purpose
                      </div>
                    </div>
                  </Button>
                  
                  {purpose === "custom" && (
                    <div className="mt-3">
                      <Input
                        placeholder="Enter your custom purpose..."
                        value={customPurpose}
                        onChange={(e) => setCustomPurpose(e.target.value)}
                        className="w-full h-12 rounded-2xl border-border/50 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="pill"
                size="lg"
                className="w-full bg-gradient-to-r from-primary via-primary/90 to-secondary !text-black shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 transition-all duration-300 h-14"
                disabled={selectedConnections.length === 0 || isGenerating}
                onClick={handleGenerate}
              >
                {getButtonText()}
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <div className="card-powder p-6 rounded-3xl shadow-soft-md">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0">
                <Mail className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-foreground mb-3 text-lg">Email Generation Tips</h4>
                <ul className="text-sm text-gray-600 space-y-2 font-medium">
                  <li>• Select one or more connections</li>
                  <li>• AI personalizes each email individually</li>
                  <li>• Generated drafts appear in each connection's draft bank</li>
                  <li>• Review and edit drafts before sending</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Generated Drafts Modal */}
      <GeneratedDraftsModal
        isOpen={showDraftsModal}
        onClose={() => setShowDraftsModal(false)}
        results={results}
        onSaveDraft={handleSaveDraft}
        onSendDraft={handleSendDraft}
        onDeleteDraft={handleDeleteDraft}
      />
    </main>
  );
}