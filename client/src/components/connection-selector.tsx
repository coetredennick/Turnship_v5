import React from "react";
import { useConnections } from "@/hooks/useConnections";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Connection } from "@/lib/api";

interface ConnectionSelectorProps {
  selectedConnections: string[];
  onSelectionChange: (connectionIds: string[]) => void;
}

export default function ConnectionSelector({ selectedConnections, onSelectionChange }: ConnectionSelectorProps) {
  const { connections, loading } = useConnections();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [stateFilter, setStateFilter] = React.useState("all");

  const STATES = [
    "NOT_CONTACTED",
    "DRAFTING",
    "SENT",
    "AWAITING_REPLY",
    "REPLIED",
    "BOUNCED",
    "DO_NOT_CONTACT",
    "CLOSED"
  ];

  const getStateColor = (state: string) => {
    switch (state) {
      case "NOT_CONTACTED": return "bg-gray-500 text-white";
      case "DRAFTING": return "bg-yellow-500 text-white";
      case "SENT": return "bg-blue-500 text-white";
      case "AWAITING_REPLY": return "bg-blue-600 text-white";
      case "REPLIED": return "bg-green-500 text-white";
      case "BOUNCED": return "bg-red-500 text-white";
      case "DO_NOT_CONTACT": return "bg-red-400 text-white";
      case "CLOSED": return "bg-gray-400 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const filteredConnections = connections.filter((conn: Connection) => {
    const matchesSearch = searchQuery === "" || 
      conn.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.role?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesState = stateFilter === "all" || conn.state === stateFilter;
    
    return matchesSearch && matchesState;
  });

  const handleConnectionToggle = (connectionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedConnections, connectionId]);
    } else {
      onSelectionChange(selectedConnections.filter(id => id !== connectionId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(filteredConnections.map(conn => conn.id));
    } else {
      onSelectionChange([]);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Select Connections</h3>
          <div className="text-sm text-gray-500">
            {selectedConnections.length} selected • {filteredConnections.length} total
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3">
          <Input
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {STATES.map(state => (
                <SelectItem key={state} value={state}>{state.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Select All */}
        {filteredConnections.length > 0 && (
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={selectedConnections.length === filteredConnections.length}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select All ({filteredConnections.length})
            </label>
          </div>
        )}

        {/* Connection List */}
        <div className="space-y-2">
          {filteredConnections.map((connection: Connection) => (
            <div
              key={connection.id}
              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
              onClick={() => handleConnectionToggle(
                connection.id, 
                !selectedConnections.includes(connection.id)
              )}
            >
              <Checkbox
                checked={selectedConnections.includes(connection.id)}
                onCheckedChange={(checked) => handleConnectionToggle(connection.id, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
              />
              
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">
                  {connection.fullName.split(" ").map((n: string) => n[0]).join("")}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{connection.fullName}</div>
                <div className="text-sm text-gray-600 truncate">
                  {connection.role} at {connection.company}
                </div>
              </div>
              
              <Badge className={getStateColor(connection.state || "NOT_CONTACTED")}>
                {connection.state?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Not Contacted'}
              </Badge>
            </div>
          ))}
        </div>

        {filteredConnections.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No connections found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}