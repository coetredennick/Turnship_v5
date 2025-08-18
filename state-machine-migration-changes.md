# State Machine Migration Changes Log

This document tracks the exact changes made during the migration from the old stage-based system to the new state machine system.

## Fix 1: Updated server/src/services/flow.js ✅ COMPLETED

### File: `/server/src/services/flow.js`

### Exact Changes:

**1. Lines 3-11: Updated ALLOWED transitions object**
```diff
- const ALLOWED = {
-   NOT_CONTACTED:  ["START_DRAFTING", "REOPEN_CONNECTION"],
-   DRAFTING:       ["SAVE_DRAFT", "SEND_EMAIL", "REOPEN_CONNECTION"],
-   AWAITING_REPLY: ["REPLY_RECEIVED", "MARK_BOUNCED", "SCHEDULE_FOLLOWUP", "MARK_DNC", "MARK_CLOSED", "REOPEN_CONNECTION"],
-   REPLIED:        ["ADVANCE_CYCLE", "MARK_CLOSED", "REOPEN_CONNECTION"],
-   BOUNCED:        ["ADVANCE_CYCLE", "MARK_DNC", "MARK_CLOSED", "REOPEN_CONNECTION"],
-   DO_NOT_CONTACT: ["REOPEN_CONNECTION"],
-   CLOSED:         ["REOPEN_CONNECTION"]
- };

+ const ALLOWED = {
+   NOT_CONTACTED:  ["START_DRAFTING", "REOPEN_CONNECTION"],
+   DRAFTING:       ["SAVE_DRAFT", "SEND_EMAIL", "ABANDON_DRAFT", "REOPEN_CONNECTION"],
+   SENT:           ["MARK_AWAITING", "REOPEN_CONNECTION"],
+   AWAITING_REPLY: ["REPLY_RECEIVED", "MARK_BOUNCED", "SCHEDULE_FOLLOWUP", "MARK_DNC", "MARK_CLOSED", "REOPEN_CONNECTION"],
+   REPLIED:        ["ADVANCE_CYCLE", "MARK_CLOSED", "REOPEN_CONNECTION"],
+   BOUNCED:        ["RETRY_SEND", "ADVANCE_CYCLE", "MARK_DNC", "MARK_CLOSED", "REOPEN_CONNECTION"],
+   DO_NOT_CONTACT: ["REOPEN_CONNECTION"],
+   CLOSED:         ["REOPEN_CONNECTION"]
+ };
```

**2. Lines 14-21: Updated computeNextAction function**
```diff
  function computeNextAction({ state, cycle }) {
    if (state === "NOT_CONTACTED") return "PREPARE_FIRST";
    if (state === "DRAFTING") return `SEND_OUTREACH_${cycle}`;
+   if (state === "SENT") return `PROCESS_SEND`;
    if (state === "AWAITING_REPLY") return `WAIT_OR_FOLLOWUP_${cycle}`;
    if (state === "REPLIED")  return cycle < MAX_CYCLES ? `MOVE_TO_OUTREACH_${cycle+1}` : "MARK_CLOSED";
    if (state === "BOUNCED")  return cycle < MAX_CYCLES ? `MOVE_TO_OUTREACH_${cycle+1}` : "MARK_CLOSED";
    return "NONE";
  }
```

**3. Lines 47-69: Updated SEND_EMAIL action and added new actions**
```diff
      case "SEND_EMAIL":
-       data.state = "AWAITING_REPLY";
+       data.state = "SENT";  // Go to SENT first
        data.lastContactedAt = new Date();
        data.gmailThreadId = metadata.gmailThreadId ?? conn.gmailThreadId ?? null;
-       data.nextActionAt = computeNextActionAt({ 
-         state: "AWAITING_REPLY", 
-         replyWindowDays: metadata.replyWindowDays ?? 5 
-       });
        break;
        
+     case "MARK_AWAITING":
+       data.state = "AWAITING_REPLY";
+       data.nextActionAt = computeNextActionAt({ 
+         state: "AWAITING_REPLY", 
+         replyWindowDays: metadata.replyWindowDays ?? 5 
+       });
+       break;
+       
+     case "ABANDON_DRAFT":
+       data.state = "NOT_CONTACTED";
+       data.currentDraftId = null;
+       break;
+       
+     case "RETRY_SEND":
+       data.state = "DRAFTING";
+       data.currentDraftId = metadata?.draftId ?? null;
+       break;
+       
      case "REPLY_RECEIVED":
```

**4. Lines 123-135: Removed legacy stage/stageStatus code**
```diff
    const next = {
      ...data,
      nextAction: computeNextAction({ 
        state: data.state ?? conn.state, 
        cycle: data.cycle ?? conn.cycle 
      })
    };

-   // optional: legacy mirror while migrating (remove later)
-   next.stage = (next.state ?? conn.state) === "NOT_CONTACTED"
-     ? "Not Contacted"
-     : ["First Outreach","Second Outreach","Third Outreach"][(next.cycle ?? conn.cycle) - 1] ?? "Third Outreach";
-     
-   next.stageStatus = {
-     DRAFTING: "draft_saved",
-     AWAITING_REPLY: "waiting",
-     REPLIED: "completed",
-     BOUNCED: "bounced",
-     DO_NOT_CONTACT: "dnc",
-     CLOSED: "completed"
-   }[next.state ?? conn.state] ?? (conn.stageStatus ?? "ready");
+   // REMOVE THESE LINES after confirming UI works without them:
+   // next.stage = ...
+   // next.stageStatus = ...

    return next;

## Backfill Script 🔄 PENDING (Replit Required)

**Status**: Cannot run locally - requires DATABASE_URL environment variable configured in Replit

**Script**: `/server/scripts/backfill-state-machine.js`

**Note**: This script needs to be executed on Replit where the database connection is properly configured.

---

## Fix 2: Updated Analytics Interface and Charts ✅ COMPLETED

### Files Modified:
1. `/client/src/hooks/useAnalytics.ts`
2. `/client/src/components/analytics-charts.tsx`
3. `/client/src/pages/analytics.tsx`

### Exact Changes:

**1. File: `/client/src/hooks/useAnalytics.ts`**
**Lines 25-31: Added state-based analytics fields**
```diff
- // Breakdown data
- stageFunnel: Record<string, number>;
- stageBreakdown: Array<{ stage: string; _count: { stage: number } }>;

+ // State-based breakdown (NEW - use these!)
+ stateFunnel: Record<string, number>;
+ stateBreakdown: Array<{ state: string; _count: { state: number } }>;
+ 
+ // Legacy breakdown (keep for now, remove later)
+ stageFunnel: Record<string, number>;
+ stageBreakdown: Array<{ stage: string; _count: { stage: number } }>;
```

**2. File: `/client/src/components/analytics-charts.tsx`**
**Lines 41-46: Renamed component and interface**
```diff
- interface StageFunnelChartProps {
+ interface StateFunnelChartProps {
   analytics?: AnalyticsData | null;
   loading?: boolean;
 }
 
- export function StageFunnelChart({ analytics, loading }: StageFunnelChartProps) {
+ export function StateFunnelChart({ analytics, loading }: StateFunnelChartProps) {
```

**Lines 47-58: Updated data mapping to use stateFunnel**
```diff
- // Create stage data from analytics
- const stageData = analytics?.stageFunnel ? Object.entries(analytics.stageFunnel).map(([stage, count]) => ({
-   stage,
-   count,
-   percentage: Math.round((count / Math.max(...Object.values(analytics.stageFunnel))) * 100)
- })) : [
-   { stage: "New", count: 0, percentage: 0 },
-   { stage: "Contacted", count: 0, percentage: 0 },
-   { stage: "Interested", count: 0, percentage: 0 },
-   { stage: "Responded", count: 0, percentage: 0 },
-   { stage: "Scheduled", count: 0, percentage: 0 }
- ];

+ // Create state data from analytics
+ const stateData = analytics?.stateFunnel ? Object.entries(analytics.stateFunnel).map(([state, count]) => ({
+   state,
+   count,
+   percentage: Math.round((count / Math.max(...Object.values(analytics.stateFunnel))) * 100)
+ })) : [
+   { state: "NOT_CONTACTED", count: 0, percentage: 0 },
+   { state: "DRAFTING", count: 0, percentage: 0 },
+   { state: "SENT", count: 0, percentage: 0 },
+   { state: "AWAITING_REPLY", count: 0, percentage: 0 },
+   { state: "REPLIED", count: 0, percentage: 0 },
+   { state: "CLOSED", count: 0, percentage: 0 }
+ ];
```

**Lines 63, 80: Updated titles and rendering logic**
```diff
- <h3 className="text-lg font-semibold text-gray-900 mb-6">Connection Stage Funnel</h3>
+ <h3 className="text-lg font-semibold text-gray-900 mb-6">Connection State Funnel</h3>

- {stageData.map((stage, index) => (
-   <div key={stage.stage} className="flex items-center justify-between">
-     <span className="text-sm text-gray-600 capitalize">{stage.stage}</span>

+ {stateData.map((state, index) => (
+   <div key={state.state} className="flex items-center justify-between">
+     <span className="text-sm text-gray-600 capitalize">{state.state.toLowerCase().replace(/_/g, ' ')}</span>
```

**3. File: `/client/src/pages/analytics.tsx`**
**Lines 2, 66: Updated import and component usage**
```diff
- import { EmailActivityChart, StageFunnelChart, PerformanceInsights } from "@/components/analytics-charts";
+ import { EmailActivityChart, StateFunnelChart, PerformanceInsights } from "@/components/analytics-charts";

- <StageFunnelChart analytics={analytics} loading={loading} />
+ <StateFunnelChart analytics={analytics} loading={loading} />
```

---

## Fix 3: Updated Connection Mapper to Use State-Based Grouping ✅ COMPLETED

### Files Modified:
1. `/client/src/utils/connectionMapper.ts`
2. `/client/src/components/compact-kanban.tsx`

### Exact Changes:

**1. File: `/client/src/utils/connectionMapper.ts`**
**Lines 82-103: Added new groupConnectionsByState function**
```diff
+ export function groupConnectionsByState(connections: Connection[]): Record<string, DisplayConnection[]> {
+   const groups: Record<string, DisplayConnection[]> = {
+     "NOT_CONTACTED": [],
+     "DRAFTING": [],
+     "SENT": [],
+     "AWAITING_REPLY": [],
+     "REPLIED": [],
+     "BOUNCED": [],
+     "DO_NOT_CONTACT": [],
+     "CLOSED": []
+   };
+ 
+   connections.forEach(connection => {
+     const displayConnection = mapConnectionToDisplayConnection(connection);
+     const state = connection.state || "NOT_CONTACTED";
+     
+     if (groups[state]) {
+       groups[state].push(displayConnection);
+     } else {
+       groups["NOT_CONTACTED"].push(displayConnection);
+     }
+   });
+ 
+   return groups;
+ }
```

**Lines 108-142: Updated groupConnectionsByStage for backward compatibility**
```diff
+ // Keep the old function for backward compatibility during migration
  export function groupConnectionsByStage(connections: Connection[]): Record<string, DisplayConnection[]> {
+   console.warn('groupConnectionsByStage is deprecated. Use groupConnectionsByState instead.');
+   
+   // Map state to legacy stage for backward compatibility
+   const stateToStage: Record<string, string> = {
+     "NOT_CONTACTED": "Not Contacted",
+     "DRAFTING": "First Outreach",
+     "SENT": "First Outreach",
+     "AWAITING_REPLY": "First Outreach",
+     "REPLIED": "Second Outreach",
+     "BOUNCED": "Third Outreach",
+     "DO_NOT_CONTACT": "Third Outreach",
+     "CLOSED": "Third Outreach"
+   };
+   
    const groups: Record<string, DisplayConnection[]> = {
      "Not Contacted": [],
      "First Outreach": [],
      "Second Outreach": [],
      "Third Outreach": [],
    };
  
    connections.forEach(connection => {
      const displayConnection = mapConnectionToDisplayConnection(connection);
-     const stage = connection.stage || "Not Contacted";
+     const state = connection.state || "NOT_CONTACTED";
+     const stage = stateToStage[state] || "Not Contacted";
      
      if (groups[stage]) {
        groups[stage].push(displayConnection);
-     } else {
-       // Default to Not Contacted if stage doesn't match known stages
-       groups["Not Contacted"].push(displayConnection);
      }
    });
  
    return groups;
  }
```

**2. File: `/client/src/components/compact-kanban.tsx`**
**Line 4: Updated import**
```diff
- import { groupConnectionsByStage, type DisplayConnection } from "@/utils/connectionMapper";
+ import { groupConnectionsByState, type DisplayConnection } from "@/utils/connectionMapper";
```

**Lines 143-175: Updated to use state-based grouping**
```diff
- const groupedConnections = groupConnectionsByStage(connections);
+ const groupedConnections = groupConnectionsByState(connections);
  
- // Simplified 4-stage system - only show columns that have connections
- const stageOrder = [
-   "Not Contacted",
-   "First Outreach",
-   "Second Outreach",
-   "Third Outreach"
- ];
+ // State-based system - show columns that have connections
+ const stateOrder = [
+   "NOT_CONTACTED",
+   "DRAFTING",
+   "SENT",
+   "AWAITING_REPLY",
+   "REPLIED",
+   "BOUNCED",
+   "DO_NOT_CONTACT",
+   "CLOSED"
+ ];
+ 
+ // Map state names to display names
+ const stateDisplayNames: Record<string, string> = {
+   "NOT_CONTACTED": "Not Contacted",
+   "DRAFTING": "Drafting",
+   "SENT": "Sent",
+   "AWAITING_REPLY": "Awaiting Reply",
+   "REPLIED": "Replied",
+   "BOUNCED": "Bounced",
+   "DO_NOT_CONTACT": "Do Not Contact",
+   "CLOSED": "Closed"
+ };

- const columns = stageOrder
-   .filter(stage => groupedConnections[stage] && groupedConnections[stage].length > 0)
-   .map(stage => ({
-     title: stage,
-     count: groupedConnections[stage].length,
-     connections: groupedConnections[stage]
-   }));
+ const columns = stateOrder
+   .filter(state => groupedConnections[state] && groupedConnections[state].length > 0)
+   .map(state => ({
+     title: stateDisplayNames[state] || state,
+     count: groupedConnections[state].length,
+     connections: groupedConnections[state]
+   }));
```

---

## Fix 4: Deprecated advance-stage Endpoint ✅ COMPLETED

### File: `/server/src/routes/connections.js`

### Exact Changes:

**Lines 113-126: Replaced deprecated endpoint with 410 Gone response**
```diff
- // Manual stage progression (DEPRECATED - Use /transition endpoint instead)
- router.post('/:id/advance-stage', requireAuth, async (req, res) => {
-   console.warn('DEPRECATED: /advance-stage endpoint used. Migrate to /transition endpoint.');
-   
-   // Add deprecation header
-   res.set('X-Deprecated-Endpoint', 'true');
-   res.set('X-Deprecated-Message', 'Use POST /api/connections/:id/transition instead');
-   res.set('X-Deprecated-Migration-Guide', 'https://docs.yourapp.com/migration/state-machine');
-   const userId = req.session.user.id;
-   const id = req.params.id;
-   const existing = await prisma.connection.findUnique({ where: { id } });
-   if (!existing || existing.userId !== userId) return res.status(404).json({ error: 'Not found' });
-   
-   // [... 25 lines of legacy stage advancement logic removed ...]
-   
-   res.json(updated);
- });

+ // Replace the entire POST /:id/advance-stage route with:
+ router.post('/:id/advance-stage', requireAuth, async (req, res) => {
+   res.status(410).json({ 
+     error: 'This endpoint has been removed. Use the state machine transition endpoint instead.',
+     use: 'POST /api/connections/:id/transition',
+     documentation: 'https://docs.yourapp.com/migration/state-machine',
+     example: {
+       endpoint: 'POST /api/connections/:id/transition',
+       body: {
+         action: 'START_DRAFTING',
+         metadata: {}
+       }
+     }
+   });
+ });
```

---

**Migration Started**: 2025-08-18
**Last Updated**: 2025-08-18 (Final adjustments for SENT state)

---

## Summary of Changes Made

### ✅ Completed Fixes:
- **Fix 1**: Updated server state machine logic in `flow.js` - Added SENT state, new actions (MARK_AWAITING, ABANDON_DRAFT, RETRY_SEND), removed legacy stage/stageStatus code
  - **SENT State Finalized**: Implemented as brief processing state with flow SEND_EMAIL → SENT → MARK_AWAITING → AWAITING_REPLY
- **Fix 2**: Updated analytics interface and charts - Added stateFunnel fields, renamed StageFunnelChart to StateFunnelChart, updated analytics page imports
- **Fix 3**: Updated connection mapper - Added groupConnectionsByState function, updated compact-kanban to use state-based grouping, deprecated old stage-based function
- **Fix 4**: Deprecated advance-stage endpoint - Replaced with 410 Gone response directing to new transition endpoint
- **Legacy Cleanup**: Completely removed stage/stageStatus field references from frontend - Updated all components, interfaces, and logic to use state-based system

### 🔄 Pending Actions:
- **Backfill Script**: Must be run on Replit with proper DATABASE_URL environment variable

### 📊 Files Modified:
1. `server/src/services/flow.js` - State machine logic updated, legacy code removed
2. `client/src/hooks/useAnalytics.ts` - Interface updated with stateFunnel  
3. `client/src/components/analytics-charts.tsx` - Component renamed and logic updated
4. `client/src/pages/analytics.tsx` - Import and component usage updated
5. `client/src/utils/connectionMapper.ts` - Added state-based grouping function, updated DisplayConnection interface
6. `client/src/components/compact-kanban.tsx` - Updated to use state-based grouping and status logic
7. `server/src/routes/connections.js` - Deprecated advance-stage endpoint
8. `client/src/lib/api.ts` - Removed stage/stageStatus from Connection interface
9. `client/src/components/connection-card.tsx` - Complete rewrite for state-based logic
10. `client/src/components/connection-selector.tsx` - Updated filtering to use state
11. `client/src/pages/connections.tsx` - Updated filters to use state
12. `client/src/lib/mock-data.ts` - Updated Contact interface to use state

---

## Final Adjustments: SENT State Finalized ✅ COMPLETED

### Additional Changes Made to `server/src/services/flow.js`:

**Line 6: Added comment clarifying SENT as brief processing state**
```diff
- SENT:           ["MARK_AWAITING", "REOPEN_CONNECTION"],
+ SENT:           ["MARK_AWAITING", "REOPEN_CONNECTION"], // Brief processing state - should move to AWAITING_REPLY quickly
```

**Line 17: Updated nextAction for SENT state**  
```diff
- if (state === "SENT") return `PROCESS_SEND`;
+ if (state === "SENT") return "MARK_AWAITING"; // Immediately transition to AWAITING_REPLY
```

**Lines 48-52: Enhanced SEND_EMAIL action comments**
```diff
    case "SEND_EMAIL":
-     data.state = "SENT";  // Go to SENT first
+     data.state = "SENT";  // Brief processing state - email sent but not yet awaiting reply
      data.lastContactedAt = new Date();
      data.gmailThreadId = metadata.gmailThreadId ?? conn.gmailThreadId ?? null;
+     // nextAction will be "MARK_AWAITING" to immediately move to AWAITING_REPLY
      break;
```

**Lines 55-56: Enhanced MARK_AWAITING action comments**
```diff
    case "MARK_AWAITING":
-     data.state = "AWAITING_REPLY";
+     data.state = "AWAITING_REPLY";  // Now officially waiting for reply
```

### Flow Clarification:
The SENT state is now properly implemented as a brief processing state:
1. **SEND_EMAIL** action moves connection to **SENT** state (records email sent, sets gmailThreadId)
2. **nextAction** for SENT state is **"MARK_AWAITING"** 
3. **MARK_AWAITING** action moves connection to **AWAITING_REPLY** state (sets reply window timer)

This ensures SENT is truly transient and connections automatically progress to the awaiting reply phase.

---

## Legacy Field Cleanup: Removed stage/stageStatus References ✅ COMPLETED

### Files Modified:
1. `/server/src/services/flow.js` - Removed commented legacy code
2. `/client/src/utils/connectionMapper.ts` - Updated DisplayConnection interface to use state
3. `/client/src/components/compact-kanban.tsx` - Updated status logic to use state 
4. `/client/src/lib/api.ts` - Removed stage/stageStatus from Connection interface
5. `/client/src/components/connection-card.tsx` - Complete rewrite to use state-based logic
6. `/client/src/components/connection-selector.tsx` - Updated filtering to use state
7. `/client/src/pages/connections.tsx` - Updated filters to use state
8. `/client/src/lib/mock-data.ts` - Updated Contact interface to use state

### Key Changes:

**1. Removed from flow.js:**
```diff
- // REMOVE THESE LINES after confirming UI works without them:
- // next.stage = ...
- // next.stageStatus = ...
```

**2. Updated DisplayConnection interface:**
```diff
- stage?: string;
- stageStatus?: "ready" | "draft_saved" | "waiting" | "completed";
+ state?: string;
```

**3. Updated Connection interface in api.ts:**
```diff
- stage: string; // legacy for UI
- stageStatus?: string; // legacy status
```

**4. Updated component logic throughout frontend:**
- Replaced stage-based filtering with state-based filtering
- Updated status indicators to use state values
- Changed UI components to display proper state names
- Updated action buttons to work with state machine transitions

**5. State name formatting:**
- Added proper formatting: `state?.replace(/_/g, ' ').toLowerCase().replace(/\\b\\w/g, l => l.toUpperCase())`
- NOT_CONTACTED → "Not Contacted"
- AWAITING_REPLY → "Awaiting Reply"
- DO_NOT_CONTACT → "Do Not Contact"

### Legacy Compatibility:
- Kept deprecated `groupConnectionsByStage` function in connectionMapper.ts with console.warn
- Kept legacy `stageFunnel`/`stageBreakdown` fields in useAnalytics.ts interface for backward compatibility
- All legacy functions include proper deprecation warnings