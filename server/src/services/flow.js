const MAX_CYCLES = 3;

const ALLOWED = {
  NOT_CONTACTED:  ["START_DRAFTING", "REOPEN_CONNECTION"],
  DRAFTING:       ["SAVE_DRAFT", "SEND_EMAIL", "ABANDON_DRAFT", "REOPEN_CONNECTION"],
  SENT:           ["MARK_AWAITING", "REOPEN_CONNECTION"], // Brief processing state - should move to AWAITING_REPLY quickly
  AWAITING_REPLY: ["REPLY_RECEIVED", "MARK_BOUNCED", "SCHEDULE_FOLLOWUP", "MARK_DNC", "MARK_CLOSED", "REOPEN_CONNECTION"],
  REPLIED:        ["ADVANCE_CYCLE", "MARK_CLOSED", "REOPEN_CONNECTION"],
  BOUNCED:        ["RETRY_SEND", "ADVANCE_CYCLE", "MARK_DNC", "MARK_CLOSED", "REOPEN_CONNECTION"],
  DO_NOT_CONTACT: ["REOPEN_CONNECTION"],
  CLOSED:         ["REOPEN_CONNECTION"]
};

function computeNextAction({ state, cycle }) {
  if (state === "NOT_CONTACTED") return "PREPARE_FIRST";
  if (state === "DRAFTING") return `SEND_OUTREACH_${cycle}`;
  if (state === "SENT") return "MARK_AWAITING"; // Immediately transition to AWAITING_REPLY
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
      data.state = "SENT";  // Brief processing state - email sent but not yet awaiting reply
      data.lastContactedAt = new Date();
      data.gmailThreadId = metadata.gmailThreadId ?? conn.gmailThreadId ?? null;
      // nextAction will be "MARK_AWAITING" to immediately move to AWAITING_REPLY
      break;
      
    case "MARK_AWAITING":
      data.state = "AWAITING_REPLY";  // Now officially waiting for reply
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

  return next;
}

module.exports = { ALLOWED, computeNextAction, computeNextActionAt, isValidTransition, applyTransition };


