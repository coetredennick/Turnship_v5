// ============================================
// FIX 1: server/src/services/flow.js
// ============================================

const MAX_CYCLES = 3;

const ALLOWED = {
  NOT_CONTACTED:  ["START_DRAFTING", "REOPEN_CONNECTION"],
  DRAFTING:       ["SAVE_DRAFT", "SEND_EMAIL", "ABANDON_DRAFT", "REOPEN_CONNECTION"],
  SENT:           ["MARK_AWAITING", "REOPEN_CONNECTION"],
  AWAITING_REPLY: ["REPLY_RECEIVED", "MARK_BOUNCED", "SCHEDULE_FOLLOWUP", "MARK_DNC", "MARK_CLOSED", "REOPEN_CONNECTION"],
  REPLIED:        ["ADVANCE_CYCLE", "MARK_CLOSED", "REOPEN_CONNECTION"],
  BOUNCED:        ["RETRY_SEND", "ADVANCE_CYCLE", "MARK_DNC", "MARK_CLOSED", "REOPEN_CONNECTION"],
  DO_NOT_CONTACT: ["REOPEN_CONNECTION"],
  CLOSED:         ["REOPEN_CONNECTION"]
};

function computeNextAction({ state, cycle }) {
  if (state === "NOT_CONTACTED") return "PREPARE_FIRST";
  if (state === "DRAFTING") return `SEND_OUTREACH_${cycle}`;
  if (state === "SENT") return `PROCESS_SEND`;
  if (state === "AWAITING_REPLY") return `WAIT_OR_FOLLOWUP_${cycle}`;
  if (state === "REPLIED")  return cycle < MAX_CYCLES ? `MOVE_TO_OUTREACH_${cycle+1}` : "MARK_CLOSED";
  if (state === "BOUNCED")  return cycle < MAX_CYCLES ? `MOVE_TO_OUTREACH_${cycle+1}` : "MARK_CLOSED";
  return "NONE";
}

function computeNextActionAt({ state, base = new Date(), replyWindowDays = 5, dueAt }) {
  if (state === "AWAITING_REPLY") return new Date(base.getTime() + replyWindowDays*24*3600*1000);
  if (dueAt) return new Date(dueAt);
  return null;
}

function isValidTransition(state, action) {
  return ALLOWED[state]?.includes(action);
}

async function applyTransition(prisma, conn, action, metadata = {}) {
  const data = {};
  
  switch (action) {
    case "START_DRAFTING":
      data.state = "DRAFTING";
      data.currentDraftId = metadata.draftId ?? conn.currentDraftId ?? null;
      break;
      
    case "SAVE_DRAFT":
      data.currentDraftId = metadata.draftId ?? conn.currentDraftId ?? null;
      break;
      
    case "SEND_EMAIL":
      data.state = "SENT";  // Go to SENT first
      data.lastContactedAt = new Date();
      data.gmailThreadId = metadata.gmailThreadId ?? conn.gmailThreadId ?? null;
      break;
      
    case "MARK_AWAITING":
      data.state = "AWAITING_REPLY";
      data.nextActionAt = computeNextActionAt({ 
        state: "AWAITING_REPLY", 
        replyWindowDays: metadata.replyWindowDays ?? 5 
      });
      break;
      
    case "ABANDON_DRAFT":
      data.state = "NOT_CONTACTED";
      data.currentDraftId = null;
      break;
      
    case "RETRY_SEND":
      data.state = "DRAFTING";
      data.currentDraftId = metadata?.draftId ?? null;
      break;
      
    case "REPLY_RECEIVED":
      data.state = "REPLIED";
      data.lastReplyAt = new Date();
      data.replySentiment = metadata.sentiment ?? null;
      data.nextActionAt = null;
      break;
      
    case "MARK_BOUNCED":
      data.state = "BOUNCED";
      data.nextActionAt = null;
      break;
      
    case "SCHEDULE_FOLLOWUP":
      data.nextActionAt = computeNextActionAt({ 
        state: "AWAITING_REPLY", 
        dueAt: metadata.dueAt 
      });
      data.followupCount = (conn.followupCount ?? 0) + 1;
      break;
      
    case "ADVANCE_CYCLE":
      data.cycle = Math.min((conn.cycle ?? 1) + 1, MAX_CYCLES);
      data.state = "DRAFTING";
      data.currentDraftId = null;
      data.nextActionAt = null;
      break;
      
    case "MARK_DNC":
      data.state = "DO_NOT_CONTACT";
      data.closedReason = metadata.reason ?? "DNC";
      data.nextActionAt = null;
      break;
      
    case "MARK_CLOSED":
      data.state = "CLOSED";
      data.closedReason = metadata.reason ?? null;
      data.nextActionAt = null;
      break;
      
    case "REOPEN_CONNECTION":
      data.state = "NOT_CONTACTED";
      data.cycle = 1;
      data.closedReason = null;
      data.nextActionAt = null;
      data.followupCount = 0;
      data.currentDraftId = null;
      data.lastContactedAt = null;
      data.lastReplyAt = null;
      data.replySentiment = null;
      break;
  }

  const next = {
    ...data,
    nextAction: computeNextAction({ 
      state: data.state ?? conn.state, 
      cycle: data.cycle ?? conn.cycle 
    })
  };

  // REMOVE THESE LINES after confirming UI works without them:
  // next.stage = ...
  // next.stageStatus = ...

  return next;
}

module.exports = { ALLOWED, computeNextAction, computeNextActionAt, isValidTransition, applyTransition };


// ============================================
// FIX 2: client/src/hooks/useAnalytics.ts
// ============================================

export interface AnalyticsData {
  // Email metrics
  sendsLast7: number;
  sendsLast28: number;
  
  // Connection metrics
  totalConnections: number;
  activeConnections: number;
  
  // Reply metrics
  totalReplies: number;
  replyRate: number;
  positiveReplies: number;
  negativeReplies: number;
  positiveReplyRate: number;
  
  // Follow-up metrics
  followupsScheduled: number;
  followupsOverdue: number;
  followupsOnTime: number;
  
  // State-based breakdown (NEW - use these!)
  stateFunnel: Record<string, number>;
  stateBreakdown: Array<{ state: string; _count: { state: number } }>;
  
  // Legacy breakdown (keep for now, remove later)
  stageFunnel: Record<string, number>;
  stageBreakdown: Array<{ stage: string; _count: { stage: number } }>;
  
  // Activity trends
  dailyActivity: Array<{ date: string; emails: number }>;
  
  // Performance insights
  insights: {
    bestReplyDay: string;
    averageResponseTime: string;
    topPerformingStage: string;
  };
}


// ============================================
// FIX 3: client/src/utils/connectionMapper.ts
// ============================================

export function groupConnectionsByState(connections: Connection[]): Record<string, DisplayConnection[]> {
  const groups: Record<string, DisplayConnection[]> = {
    "NOT_CONTACTED": [],
    "DRAFTING": [],
    "SENT": [],
    "AWAITING_REPLY": [],
    "REPLIED": [],
    "BOUNCED": [],
    "DO_NOT_CONTACT": [],
    "CLOSED": []
  };

  connections.forEach(connection => {
    const displayConnection = mapConnectionToDisplayConnection(connection);
    const state = connection.state || "NOT_CONTACTED";
    
    if (groups[state]) {
      groups[state].push(displayConnection);
    } else {
      groups["NOT_CONTACTED"].push(displayConnection);
    }
  });

  return groups;
}

// Keep the old function for backward compatibility during migration
export function groupConnectionsByStage(connections: Connection[]): Record<string, DisplayConnection[]> {
  console.warn('groupConnectionsByStage is deprecated. Use groupConnectionsByState instead.');
  
  // Map state to legacy stage for backward compatibility
  const stateToStage: Record<string, string> = {
    "NOT_CONTACTED": "Not Contacted",
    "DRAFTING": "First Outreach",
    "SENT": "First Outreach",
    "AWAITING_REPLY": "First Outreach",
    "REPLIED": "Second Outreach",
    "BOUNCED": "Third Outreach",
    "DO_NOT_CONTACT": "Third Outreach",
    "CLOSED": "Third Outreach"
  };
  
  const groups: Record<string, DisplayConnection[]> = {
    "Not Contacted": [],
    "First Outreach": [],
    "Second Outreach": [],
    "Third Outreach": [],
  };

  connections.forEach(connection => {
    const displayConnection = mapConnectionToDisplayConnection(connection);
    const state = connection.state || "NOT_CONTACTED";
    const stage = stateToStage[state] || "Not Contacted";
    
    if (groups[stage]) {
      groups[stage].push(displayConnection);
    }
  });

  return groups;
}


// ============================================
// FIX 4: server/src/routes/connections.js
// Replace the deprecated endpoint
// ============================================

// Replace the entire POST /:id/advance-stage route with:
router.post('/:id/advance-stage', requireAuth, async (req, res) => {
  res.status(410).json({ 
    error: 'This endpoint has been removed. Use the state machine transition endpoint instead.',
    use: 'POST /api/connections/:id/transition',
    documentation: 'https://docs.yourapp.com/migration/state-machine',
    example: {
      endpoint: 'POST /api/connections/:id/transition',
      body: {
        action: 'START_DRAFTING',
        metadata: {}
      }
    }
  });
});