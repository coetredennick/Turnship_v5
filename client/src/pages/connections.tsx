import React, { useState } from "react";
import { useConnections } from "@/hooks/useConnections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DraftBank from "@/components/draft-bank";
import AddConnection from "@/components/add-connection";
import EditConnection from "@/components/edit-connection";
import { Mail, MoreHorizontal, Eye, Plus, Filter, Download, Upload, Users, TableIcon, GraduationCap, FileText, Edit, RotateCcw, Clock, CheckCircle, X, Trash2, AlarmClock } from "lucide-react";
import { useRouter } from "@/lib/useRouter";
import { createConnection, updateConnection, deleteConnection, deleteAllDraftsForConnection, sendEmail, transitionConnection, type Connection } from "@/lib/api";
import { getConnectionStatus, getStateInfo, formatTimeSince, isActionDue, getTimeUntilDue } from "@/lib/stateMachine";

export default function Connections() {
  const [viewMode, setViewMode] = useState<"table" | "alumni">("table");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [expandedConnection, setExpandedConnection] = useState<string | null>(null);
  const [draftBankConnection, setDraftBankConnection] = useState<Connection | null>(null);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const router = useRouter();

  // Fetch connections from API
  const { connections, loading: isLoading, error, refetch: refetchConnections } = useConnections();

  // Simplified 3-stage system
  const STAGES = [
    "Not Started",
    "Contacted",
    "Responded"
  ];

  // Filter connections based on search and filters
  const filteredConnections = connections.filter((conn: Connection) => {
    const matchesSearch = searchQuery === "" || 
      conn.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.role?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = stageFilter === "all" || conn.stage === stageFilter;
    const matchesCompany = companyFilter === "all" || conn.company === companyFilter;
    
    return matchesSearch && matchesStage && matchesCompany;
  });

  // Get alumni connections
  const alumniConnections = connections.filter((conn: Connection) => conn.alumni);

  // Get unique companies for filter
  const companies = Array.from(new Set(connections.map((conn: Connection) => conn.company).filter(Boolean)));

  // State-based badge using new state machine
  const getStateBadge = (connection: Connection) => {
    const { stateInfo } = getConnectionStatus(connection);
    const colorMap = {
      gray: 'outline' as const,
      blue: 'default' as const,
      yellow: 'warning' as const,
      green: 'success' as const,
      red: 'destructive' as const,
      purple: 'secondary' as const
    };
    
    return <Badge variant={colorMap[stateInfo.color]}>{stateInfo.label}</Badge>;
  };

  // Enhanced status display with next action information
  const getEnhancedConnectionStatus = (connection: Connection) => {
    const { actionInfo } = getConnectionStatus(connection);
    const isDue = isActionDue(connection);
    const timeInfo = getTimeUntilDue(connection);
    
    let variant: "outline" | "default" | "success" | "warning" | "destructive" | "secondary" = "outline";
    
    if (isDue) {
      variant = "warning";
    } else if (connection.state === 'REPLIED') {
      variant = "success";
    } else if (connection.state === 'AWAITING_REPLY') {
      variant = "default";
    } else if (connection.state === 'BOUNCED' || connection.state === 'DO_NOT_CONTACT') {
      variant = "destructive";
    }
    
    return {
      label: timeInfo && isDue ? `${actionInfo.label} (${timeInfo})` : actionInfo.label,
      variant,
      description: actionInfo.description
    };
  };

  // Helper to handle transition actions
  const handleTransition = async (connectionId: string, action: string, metadata?: any) => {
    try {
      await transitionConnection(connectionId, action, metadata);
      await refetchConnections();
    } catch (error) {
      console.error(`Failed to transition connection with action ${action}:`, error);
      alert(`Failed to ${action.toLowerCase().replace('_', ' ')}. Please try again.`);
    }
  };

  const handleCreateConnection = async (connectionData: any) => {
    try {
      await createConnection(connectionData);
      await refetchConnections();
      setShowAddConnection(false);
    } catch (error) {
      console.error('Failed to create connection:', error);
      throw error;
    }
  };

  const handleUpdateConnection = async (connectionId: string, updates: any) => {
    try {
      await updateConnection(connectionId, updates);
      await refetchConnections();
      setEditingConnection(null);
    } catch (error) {
      console.error('Failed to update connection:', error);
      throw error;
    }
  };

  const handleResetConnection = async (connectionId: string) => {
    try {
      await deleteAllDraftsForConnection(connectionId);
      await handleTransition(connectionId, 'REOPEN_CONNECTION', { 
        reason: 'Connection reset by user' 
      });
    } catch (error) {
      console.error('Failed to reset connection:', error);
      alert('Failed to reset connection. Please try again.');
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this connection? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteAllDraftsForConnection(connectionId);
      await deleteConnection(connectionId);
      await refetchConnections();
      setSelectedContacts(prev => prev.filter(id => id !== connectionId));
    } catch (error) {
      console.error('Failed to delete connection:', error);
      alert('Failed to delete connection. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <main className="px-6 py-8 animate-fade-in">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-20 w-full"></div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-gradient mb-2">
              Connections
            </h1>
            <p className="text-lg text-gray-600">
              Manage your professional network and track outreach progress
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" className="hover-lift">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" className="hover-lift">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setShowAddConnection(true)}
              className="hover-lift"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </div>
        </div>
      </div>

      {/* View Mode and Filters */}
      <div className="card-base card-hover mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <TabsList>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <TableIcon className="h-4 w-4" />
                Table
              </TabsTrigger>
              
              <TabsTrigger value="alumni" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Alumni
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Badge variant="outline" className="px-3 py-1">
            {filteredConnections.length} of {connections.length} connections
          </Badge>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <Input 
              id="search-connections"
              name="search-connections"
              type="text" 
              placeholder="Search connections..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map(company => (
                <SelectItem key={company} value={company || ""}>{company}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="card-base overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Role & Company</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConnections.map((connection: Connection) => {
                const status = getEnhancedConnectionStatus(connection);
                const { cycle, followupCount } = getConnectionStatus(connection);
                return (
                  <TableRow key={connection.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center !text-white font-medium">
                          {connection.fullName.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <div className="font-medium">{connection.fullName}</div>
                          <div className="text-sm text-gray-600">{connection.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{connection.role || "—"}</div>
                        <div className="text-sm text-gray-600">{connection.company || "—"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStateBadge(connection)}
                        {cycle > 1 && (
                          <div className="text-xs text-gray-500">Cycle {cycle}</div>
                        )}
                        {followupCount > 0 && (
                          <div className="text-xs text-gray-500">{followupCount} follow-ups</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{status.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatTimeSince(connection.lastContactedAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDraftBankConnection(connection)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            router.navigate('/compose', { state: { selectedConnection: connection.id } });
                          }}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingConnection(connection)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleResetConnection(connection.id)}
                              className="text-orange-600"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reset
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteConnection(connection.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Alumni View */}
      {viewMode === "alumni" && (
        <div className="grid gap-4">
          {alumniConnections.map((connection: Connection) => {
            const status = getEnhancedConnectionStatus(connection);
            const { cycle } = getConnectionStatus(connection);
            return (
              <div key={connection.id} className="card-base card-hover flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center !text-white font-medium">
                    {connection.fullName.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="font-medium">{connection.fullName}</div>
                    <div className="text-sm text-gray-600">
                      {connection.role} at {connection.company}
                    </div>
                    <div className="text-xs text-gray-600">
                      {connection.school} • Class of {connection.gradYear}
                      {cycle > 1 && ` • Cycle ${cycle}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStateBadge(connection)}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{status.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setDraftBankConnection(connection)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      router.navigate('/compose', { state: { selectedConnection: connection.id } });
                    }}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Draft Bank Modal */}
      <Dialog open={!!draftBankConnection} onOpenChange={() => setDraftBankConnection(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Drafts for {draftBankConnection?.fullName}
            </DialogTitle>
            <DialogDescription>
              View and manage email drafts for this connection
            </DialogDescription>
          </DialogHeader>
          {draftBankConnection && (
            <DraftBank 
              selectedConnectionId={draftBankConnection.id}
              onSendDraft={async (draftId) => {
                await sendEmail(draftId);
                await refetchConnections();
              }}
              onDraftSent={() => {
                refetchConnections();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Connection Modal */}
      <AddConnection
        open={showAddConnection}
        onClose={() => setShowAddConnection(false)}
        onSave={handleCreateConnection}
      />

      {/* Edit Connection Modal */}
      {editingConnection && (
        <EditConnection
          open={!!editingConnection}
          onClose={() => setEditingConnection(null)}
          onSave={handleUpdateConnection}
          connection={editingConnection}
        />
      )}
    </main>
  );
}