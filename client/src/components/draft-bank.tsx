import { useState, useEffect } from "react";
import { getDrafts, updateDraft, deleteDraft, sendEmail, type Draft } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Mail, 
  Edit3, 
  Trash2, 
  Send, 
  Copy, 
  CheckCircle, 
  Clock,
  FileText,
  Search,
  Filter,
  RefreshCw
} from "lucide-react";


interface DraftBankProps {
  selectedConnectionId?: string;
  onSendDraft?: (draftId: string) => void;
  onDraftSent?: () => void;
}

export default function DraftBank({ selectedConnectionId, onSendDraft, onDraftSent }: DraftBankProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'scheduled'>('draft');
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch drafts
  const fetchDrafts = async () => {
    setLoading(true);
    try {
      // Fetch drafts based on current filter
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const data = await getDrafts(status, selectedConnectionId);
      setDrafts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [selectedConnectionId, statusFilter]);

  // Filter drafts based on search
  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = searchQuery === "" ||
      draft.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.connection?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.connection?.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Group drafts by status
  const groupedDrafts = {
    draft: filteredDrafts.filter(d => d.status === 'draft'),
    sent: filteredDrafts.filter(d => d.status === 'sent'),
    scheduled: filteredDrafts.filter(d => d.status === 'scheduled')
  };

  // Handle draft editing
  const handleSaveDraft = async () => {
    if (!editingDraft) return;
    
    try {
      await updateDraft(editingDraft.id, editingDraft.subject, editingDraft.body);
      await fetchDrafts();
      setEditingDraft(null);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  // Handle draft deletion
  const handleDeleteDraft = async (draftId: string) => {
    try {
      await deleteDraft(draftId);
      await fetchDrafts();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  };

  // Handle sending draft
  const handleSendDraft = async (draftId: string) => {
    if (onSendDraft) {
      await onSendDraft(draftId);
      await fetchDrafts(); // Refresh drafts after sending
      if (onDraftSent) onDraftSent(); // Notify parent component
    } else {
      try {
        await sendEmail(draftId);
        await fetchDrafts();
      } catch (error) {
        console.error('Failed to send draft:', error);
      }
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const DraftCard = ({ draft }: { draft: Draft }) => (
    <Card className="hover:shadow-md transition-shadow bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {draft.connection && (
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 truncate">
                  {draft.connection.fullName}
                </span>
                <span className="text-sm text-gray-500 truncate">
                  {draft.connection.company}
                </span>
              </div>
            )}
            <h3 className="font-medium text-gray-800 text-sm line-clamp-1">
              {draft.subject}
            </h3>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Badge 
              variant="secondary" 
              className={`text-xs px-2 py-0.5 ${
                draft.status === 'sent' 
                  ? 'bg-green-100 text-green-800'
                  : draft.status === 'scheduled'
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {draft.status === 'sent' ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : draft.status === 'scheduled' ? (
                <Clock className="w-3 h-3 mr-1" />
              ) : (
                <FileText className="w-3 h-3 mr-1" />
              )}
              {draft.status === 'sent' ? 'Sent' : draft.status === 'scheduled' ? 'Scheduled' : 'Draft'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {draft.body}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {formatDate(draft.createdAt)}
          </span>
          <div className="flex items-center gap-1">
            {draft.status === 'draft' && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setEditingDraft(draft)}
                  title="Edit draft"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => handleSendDraft(draft.id)}
                  title="Send draft"
                >
                  <Send className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                  onClick={() => setDeleteConfirmId(draft.id)}
                  title="Delete draft"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
            {draft.status === 'sent' && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Delivered
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Draft Bank</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and organize your saved email drafts
          </p>
        </div>
        <Button onClick={fetchDrafts} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search drafts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All ({drafts.length})</TabsTrigger>
            <TabsTrigger value="draft">Drafts ({groupedDrafts.draft.length})</TabsTrigger>
            <TabsTrigger value="sent">Sent ({groupedDrafts.sent.length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Drafts Grid */}
      {filteredDrafts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No saved drafts found
            </h3>
            <p className="text-sm text-gray-500">
              {selectedConnectionId 
                ? "No saved drafts for this connection yet"
                : "Generate and save some email drafts to see them here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDrafts.map(draft => (
            <DraftCard key={draft.id} draft={draft} />
          ))}
        </div>
      )}

      {/* Edit Draft Dialog */}
      {editingDraft && (
        <AlertDialog open={!!editingDraft} onOpenChange={() => setEditingDraft(null)}>
          <AlertDialogContent className="max-w-2xl bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Draft</AlertDialogTitle>
              <AlertDialogDescription>
                Make changes to your email draft. You can edit both the subject and body content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <Input
                  value={editingDraft.subject}
                  onChange={(e) => setEditingDraft({ ...editingDraft, subject: e.target.value })}
                  className="mt-1 bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Body</label>
                <Textarea
                  value={editingDraft.body}
                  onChange={(e) => setEditingDraft({ ...editingDraft, body: e.target.value })}
                  className="mt-1 min-h-[200px] bg-white"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveDraft}>Save Changes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirmId && handleDeleteDraft(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}