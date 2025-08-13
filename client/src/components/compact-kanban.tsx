import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useConnections } from "@/hooks/useConnections";
import { groupConnectionsByStage, type DisplayConnection } from "@/utils/connectionMapper";

interface CompactKanbanProps {
  selectedConnections: string[];
  onSelectionChange: (connectionIds: string[]) => void;
}

function CompactConnectionCard({ 
  connection, 
  isSelected, 
  onToggle 
}: { 
  connection: DisplayConnection; 
  isSelected: boolean; 
  onToggle: (connectionId: string) => void; 
}) {
  const initials = connection.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";
  
  // Status indicator colors
  const getStatusColor = () => {
    switch (connection.stageStatus) {
      case 'ready': return 'bg-green-500';
      case 'draft_saved': return 'bg-yellow-500';
      case 'waiting': return 'bg-blue-500';
      case 'completed': return 'bg-gray-400';
      default: return 'bg-green-500';
    }
  };

  return (
    <div 
      className={`bg-white p-2 rounded-lg border transition-all cursor-pointer text-center min-w-0 relative ${
        isSelected 
          ? "border-teal-300 bg-teal-50 shadow-sm" 
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => onToggle(connection.id)}
    >
      {/* Status indicator dot */}
      <div className={`absolute top-1 right-1 w-1.5 h-1.5 ${getStatusColor()} rounded-full`} />
      
      <div className="flex flex-col items-center space-y-1">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={() => onToggle(connection.id)}
          className="mb-1"
        />
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700">{initials}</span>
        </div>
        <h4 className="font-medium text-xs text-gray-900 truncate w-full">{connection.name}</h4>
        {connection.stageStatus === 'draft_saved' && (
          <span className="text-[10px] text-yellow-600 font-medium">DRAFT</span>
        )}
      </div>
    </div>
  );
}

function CompactKanbanColumn({ 
  title, 
  count, 
  connections, 
  selectedConnections, 
  onSelectionChange 
}: { 
  title: string; 
  count: number; 
  connections: DisplayConnection[]; 
  selectedConnections: string[];
  onSelectionChange: (connectionIds: string[]) => void;
}) {
  const handleToggle = (connectionId: string) => {
    const newSelection = selectedConnections.includes(connectionId)
      ? selectedConnections.filter(id => id !== connectionId)
      : [...selectedConnections, connectionId];
    onSelectionChange(newSelection);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h4 className="font-medium text-sm text-gray-900 mb-3 flex items-center">
        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
        {title} ({count})
      </h4>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
        {connections.map((connection) => (
          <div key={connection.id} className="w-20">
            <CompactConnectionCard 
              connection={connection}
              isSelected={selectedConnections.includes(connection.id)}
              onToggle={handleToggle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompactKanban({ selectedConnections, onSelectionChange }: CompactKanbanProps) {
  const { connections, loading, error } = useConnections();
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Select Connections</h3>
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3 w-1/3"></div>
              <div className="space-y-2">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Select Connections</h3>
          <div className="text-sm text-red-500">Error loading connections</div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>Failed to load connections: {error}</p>
        </div>
      </div>
    );
  }

  const groupedConnections = groupConnectionsByStage(connections);
  
  // Simplified 4-stage system - only show columns that have connections
  const stageOrder = [
    "Not Contacted",
    "First Outreach",
    "Second Outreach",
    "Third Outreach"
  ];

  const columns = stageOrder
    .filter(stage => groupedConnections[stage] && groupedConnections[stage].length > 0)
    .map(stage => ({
      title: stage,
      count: groupedConnections[stage].length,
      connections: groupedConnections[stage]
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Select Connections</h3>
        <div className="text-sm text-gray-500">
          {selectedConnections.length} selected • {connections.length} total
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {columns.map((column) => (
          <CompactKanbanColumn 
            key={column.title}
            title={column.title}
            count={column.count}
            connections={column.connections}
            selectedConnections={selectedConnections}
            onSelectionChange={onSelectionChange}
          />
        ))}
      </div>
    </div>
  );
}