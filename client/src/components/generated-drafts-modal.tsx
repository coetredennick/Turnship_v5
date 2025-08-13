import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import type { BatchGenerateResponse } from "@/lib/api";

interface GeneratedDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: BatchGenerateResponse | null;
  onSaveDraft?: (draftId: string, subject: string, body: string) => Promise<void>;
  onSendDraft?: (draftId: string) => Promise<void>;
  onDeleteDraft?: (draftId: string) => Promise<void>;
}

interface DraftState {
  id: string;
  subject: string;
  body: string;
  recipient: {
    name: string;
    company?: string;
  };
  isExpanded: boolean;
  isEditing: boolean;
  isSaving: boolean;
  isSending: boolean;
  isDeleting: boolean;
}

export default function GeneratedDraftsModal({
  isOpen,
  onClose,
  results,
  onSaveDraft,
  onSendDraft,
  onDeleteDraft
}: GeneratedDraftsModalProps) {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<DraftState[]>([]);
  const [bulkAction, setBulkAction] = useState<"save" | "send" | "delete" | null>(null);
  
  // Initialize drafts when results change
  React.useEffect(() => {
    if (results?.results) {
      setDrafts(results.results.map(result => ({
        id: result.draftId,
        subject: result.subject,
        body: result.body,
        recipient: result.connection,
        isExpanded: false,
        isEditing: false,
        isSaving: false,
        isSending: false,
        isDeleting: false
      })));
    }
  }, [results]);

  const toggleDraftExpansion = (draftId: string) => {
    setDrafts(prev => prev.map(draft => 
      draft.id === draftId 
        ? { ...draft, isExpanded: !draft.isExpanded }
        : draft
    ));
  };

  const toggleDraftEdit = (draftId: string) => {
    setDrafts(prev => prev.map(draft => 
      draft.id === draftId 
        ? { ...draft, isEditing: !draft.isEditing }
        : draft
    ));
  };

  const updateDraftContent = (draftId: string, field: "subject" | "body", value: string) => {
    setDrafts(prev => prev.map(draft => 
      draft.id === draftId 
        ? { ...draft, [field]: value }
        : draft
    ));
  };

  const handleSaveDraft = async (draftId: string) => {
    const draft = drafts.find(d => d.id === draftId);
    console.log('handleSaveDraft called:', { draftId, draft: !!draft, onSaveDraft: !!onSaveDraft });
    
    if (!draft || !onSaveDraft) {
      console.error('Missing draft or onSaveDraft handler:', { draft: !!draft, onSaveDraft: !!onSaveDraft });
      return;
    }

    console.log('Saving draft:', { id: draftId, subject: draft.subject, bodyLength: draft.body?.length });

    setDrafts(prev => prev.map(d => 
      d.id === draftId ? { ...d, isSaving: true } : d
    ));

    try {
      await onSaveDraft(draftId, draft.subject, draft.body);
      console.log('Draft save successful');
      toast({
        title: "Draft saved",
        description: `Draft for ${draft.recipient.name} has been saved.`
      });
      setDrafts(prev => prev.map(d => 
        d.id === draftId ? { ...d, isSaving: false, isEditing: false } : d
      ));
    } catch (error) {
      console.error('Draft save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive"
      });
      setDrafts(prev => prev.map(d => 
        d.id === draftId ? { ...d, isSaving: false } : d
      ));
    }
  };

  const handleSendDraft = async (draftId: string) => {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft || !onSendDraft) return;

    setDrafts(prev => prev.map(d => 
      d.id === draftId ? { ...d, isSending: true } : d
    ));

    try {
      await onSendDraft(draftId);
      toast({
        title: "Email sent",
        description: `Email sent to ${draft.recipient.name}.`
      });
      // Remove sent draft from list
      setDrafts(prev => prev.filter(d => d.id !== draftId));
    } catch (error) {
      toast({
        title: "Send failed",
        description: "Failed to send email. Please try again.",
        variant: "destructive"
      });
      setDrafts(prev => prev.map(d => 
        d.id === draftId ? { ...d, isSending: false } : d
      ));
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft || !onDeleteDraft) return;

    setDrafts(prev => prev.map(d => 
      d.id === draftId ? { ...d, isDeleting: true } : d
    ));

    try {
      await onDeleteDraft(draftId);
      toast({
        title: "Draft deleted",
        description: `Draft for ${draft.recipient.name} has been deleted.`
      });
      // Remove deleted draft from list
      setDrafts(prev => prev.filter(d => d.id !== draftId));
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete draft. Please try again.",
        variant: "destructive"
      });
      setDrafts(prev => prev.map(d => 
        d.id === draftId ? { ...d, isDeleting: false } : d
      ));
    }
  };

  const handleBulkAction = async (action: "save" | "send" | "delete") => {
    setBulkAction(action);
    
    try {
      const promises = drafts.map(draft => {
        switch (action) {
          case "save":
            return onSaveDraft?.(draft.id, draft.subject, draft.body);
          case "send":
            return onSendDraft?.(draft.id);
          case "delete":
            return onDeleteDraft?.(draft.id);
        }
      });

      await Promise.all(promises);

      toast({
        title: `Bulk ${action} complete`,
        description: `Successfully ${action === "send" ? "sent" : action + "d"} all drafts.`
      });

      if (action === "send" || action === "delete") {
        onClose();
      }
    } catch (error) {
      toast({
        title: `Bulk ${action} failed`,
        description: `Some drafts failed to ${action}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setBulkAction(null);
    }
  };

  if (!results) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-white border border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-teal-600" />
              Generated Drafts ({drafts.length})
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("save")}
                disabled={bulkAction !== null || drafts.length === 0}
              >
                {bulkAction === "save" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save All
              </Button>
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => handleBulkAction("send")}
                disabled={bulkAction !== null || drafts.length === 0}
              >
                {bulkAction === "send" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send All
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkAction("delete")}
                disabled={bulkAction !== null || drafts.length === 0}
              >
                {bulkAction === "delete" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete All
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Review and manage your generated email drafts
          </DialogDescription>
        </DialogHeader>

        {/* Summary Alert */}
        {results && (
          <Alert className={results.failed > 0 ? "border-amber-200" : "border-green-200"}>
            <div className="flex items-center gap-2">
              {results.failed === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className="font-medium">{results.summary}</span>
            </div>
          </Alert>
        )}

        {/* Drafts List */}
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Collapsed View */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => !draft.isEditing && toggleDraftExpansion(draft.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {draft.recipient.name}
                      {draft.recipient.company && (
                        <span className="text-gray-500 font-normal ml-2">
                          at {draft.recipient.company}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {draft.isEditing ? (
                        <Input
                          value={draft.subject}
                          onChange={(e) => updateDraftContent(draft.id, "subject", e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                      ) : (
                        draft.subject
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDraftExpansion(draft.id);
                    }}
                  >
                    {draft.isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded View */}
              {draft.isExpanded && (
                <div className="mt-4 space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    {draft.isEditing ? (
                      <Textarea
                        value={draft.body}
                        onChange={(e) => updateDraftContent(draft.id, "body", e.target.value)}
                        className="min-h-[200px] bg-white"
                        placeholder="Email body..."
                      />
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {draft.body || "Loading email content..."}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2">
                    {draft.isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleDraftEdit(draft.id)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveDraft(draft.id)}
                          disabled={draft.isSaving}
                        >
                          {draft.isSaving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleDraftEdit(draft.id)}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveDraft(draft.id)}
                          disabled={draft.isSaving}
                        >
                          {draft.isSaving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() => handleSendDraft(draft.id)}
                          disabled={draft.isSending}
                        >
                          {draft.isSending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Send
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteDraft(draft.id)}
                          disabled={draft.isDeleting}
                        >
                          {draft.isDeleting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}