/**
 * Frontend State Machine Utilities
 * 
 * Provides helper functions for working with the outreach state machine
 * in the frontend components.
 */

import type { Connection } from './api';

export type OutreachState = 
  | 'NOT_CONTACTED'
  | 'DRAFTING'
  | 'SENT'
  | 'AWAITING_REPLY'
  | 'REPLIED'
  | 'BOUNCED'
  | 'DO_NOT_CONTACT'
  | 'CLOSED';

export type StateTransition = 
  | 'START_DRAFTING'
  | 'SAVE_DRAFT'
  | 'SEND_EMAIL'
  | 'MARK_AWAITING'
  | 'REPLY_RECEIVED'
  | 'EMAIL_BOUNCED'
  | 'SCHEDULE_FOLLOWUP'
  | 'MARK_DO_NOT_CONTACT'
  | 'MARK_CLOSED'
  | 'ADVANCE_CYCLE'
  | 'ABANDON_DRAFT'
  | 'RETRY_SEND'
  | 'REOPEN_CONNECTION';

// Valid transitions from each state
export const ALLOWED_TRANSITIONS: Record<OutreachState, StateTransition[]> = {
  NOT_CONTACTED: ['START_DRAFTING', 'MARK_DO_NOT_CONTACT'],
  DRAFTING: ['SAVE_DRAFT', 'SEND_EMAIL', 'ABANDON_DRAFT', 'MARK_DO_NOT_CONTACT'],
  SENT: ['MARK_AWAITING'],
  AWAITING_REPLY: ['REPLY_RECEIVED', 'EMAIL_BOUNCED', 'SCHEDULE_FOLLOWUP', 'MARK_DO_NOT_CONTACT', 'MARK_CLOSED'],
  REPLIED: ['ADVANCE_CYCLE', 'MARK_CLOSED'],
  BOUNCED: ['RETRY_SEND', 'MARK_CLOSED', 'MARK_DO_NOT_CONTACT'],
  DO_NOT_CONTACT: [],
  CLOSED: ['REOPEN_CONNECTION']
};

// State display information
export const STATE_INFO: Record<OutreachState, {
  label: string;
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'red' | 'purple';
  description: string;
}> = {
  NOT_CONTACTED: {
    label: 'Not Contacted',
    color: 'gray',
    description: 'Ready to start outreach'
  },
  DRAFTING: {
    label: 'Drafting',
    color: 'blue',
    description: 'Email draft in progress'
  },
  SENT: {
    label: 'Sent',
    color: 'yellow',
    description: 'Email sent, processing...'
  },
  AWAITING_REPLY: {
    label: 'Awaiting Reply',
    color: 'yellow',
    description: 'Email sent, waiting for response'
  },
  REPLIED: {
    label: 'Replied',
    color: 'green',
    description: 'Response received'
  },
  BOUNCED: {
    label: 'Bounced',
    color: 'red',
    description: 'Email delivery failed'
  },
  DO_NOT_CONTACT: {
    label: 'Do Not Contact',
    color: 'red',
    description: 'Unsubscribed or requested no contact'
  },
  CLOSED: {
    label: 'Closed',
    color: 'purple',
    description: 'Connection closed'
  }
};

// Next action display information
export const ACTION_INFO: Record<string, {
  label: string;
  description: string;
  buttonText: string;
  buttonVariant: 'default' | 'secondary' | 'destructive' | 'ghost';
}> = {
  PREPARE_FIRST: {
    label: 'Prepare First Outreach',
    description: 'Ready to draft your first email',
    buttonText: 'Start Draft',
    buttonVariant: 'default'
  },
  PREPARE_OUTREACH_2: {
    label: 'Prepare Second Outreach',
    description: 'Ready to draft follow-up email',
    buttonText: 'Start Draft',
    buttonVariant: 'default'
  },
  PREPARE_OUTREACH_3: {
    label: 'Prepare Third Outreach',
    description: 'Ready to draft final follow-up',
    buttonText: 'Start Draft',
    buttonVariant: 'default'
  },
  SEND_FIRST_EMAIL: {
    label: 'Send First Email',
    description: 'Draft ready to send',
    buttonText: 'Send Email',
    buttonVariant: 'default'
  },
  SEND_OUTREACH_2: {
    label: 'Send Follow-up',
    description: 'Follow-up draft ready to send',
    buttonText: 'Send Email',
    buttonVariant: 'default'
  },
  SEND_OUTREACH_3: {
    label: 'Send Final Follow-up',
    description: 'Final follow-up ready to send',
    buttonText: 'Send Email',
    buttonVariant: 'default'
  },
  WAITING_FIRST_REPLY: {
    label: 'Waiting for Reply',
    description: 'First email sent, awaiting response',
    buttonText: 'Send Follow-up',
    buttonVariant: 'secondary'
  },
  WAITING_REPLY_2: {
    label: 'Waiting for Reply',
    description: 'Follow-up sent, awaiting response',
    buttonText: 'Send Follow-up',
    buttonVariant: 'secondary'
  },
  WAITING_REPLY_3: {
    label: 'Waiting for Reply',
    description: 'Final follow-up sent, awaiting response',
    buttonText: 'Mark Closed',
    buttonVariant: 'secondary'
  },
  WAITING_FOLLOWUP_1: {
    label: 'Follow-up Due',
    description: 'Time for first follow-up',
    buttonText: 'Send Follow-up',
    buttonVariant: 'default'
  },
  WAITING_FOLLOWUP_2: {
    label: 'Follow-up Due',
    description: 'Time for second follow-up',
    buttonText: 'Send Follow-up',
    buttonVariant: 'default'
  },
  PLAN_OUTREACH_2: {
    label: 'Plan Next Outreach',
    description: 'Got reply, plan follow-up cycle',
    buttonText: 'Start Cycle 2',
    buttonVariant: 'default'
  },
  PLAN_OUTREACH_3: {
    label: 'Plan Final Outreach',
    description: 'Got reply, plan final cycle',
    buttonText: 'Start Cycle 3',
    buttonVariant: 'default'
  },
  DECIDE_NEXT_STEPS: {
    label: 'Decide Next Steps',
    description: 'All cycles complete, decide outcome',
    buttonText: 'Mark Closed',
    buttonVariant: 'secondary'
  },
  FIX_EMAIL_OR_CLOSE: {
    label: 'Fix Email or Close',
    description: 'Email bounced, needs attention',
    buttonText: 'Fix Email',
    buttonVariant: 'destructive'
  },
  NONE: {
    label: 'Complete',
    description: 'No further action needed',
    buttonText: 'View Details',
    buttonVariant: 'ghost'
  }
};

// Helper functions
export function getStateInfo(state: OutreachState) {
  return STATE_INFO[state] || STATE_INFO.NOT_CONTACTED;
}

export function getActionInfo(action: string) {
  return ACTION_INFO[action] || {
    label: action.replace(/_/g, ' '),
    description: 'Action available',
    buttonText: 'Take Action',
    buttonVariant: 'default' as const
  };
}

export function getAllowedTransitions(state: OutreachState): StateTransition[] {
  return ALLOWED_TRANSITIONS[state] || [];
}

export function isTransitionAllowed(state: OutreachState, transition: StateTransition): boolean {
  return getAllowedTransitions(state).includes(transition);
}

export function getConnectionStatus(connection: Connection): {
  state: OutreachState;
  stateInfo: typeof STATE_INFO[OutreachState];
  nextAction: string;
  actionInfo: typeof ACTION_INFO[string];
  cycle: number;
  followupCount: number;
} {
  const state = connection.state as OutreachState;
  const stateInfo = getStateInfo(state);
  const actionInfo = getActionInfo(connection.nextAction);
  
  return {
    state,
    stateInfo,
    nextAction: connection.nextAction,
    actionInfo,
    cycle: connection.cycle || 1,
    followupCount: connection.followupCount || 0
  };
}

export function formatTimeSince(date: string | Date | null): string {
  if (!date) return 'Never';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function isActionDue(connection: Connection): boolean {
  if (!connection.nextActionAt) return false;
  return new Date(connection.nextActionAt) <= new Date();
}

export function getTimeUntilDue(connection: Connection): string | null {
  if (!connection.nextActionAt) return null;
  
  const dueDate = new Date(connection.nextActionAt);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMs <= 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} days`;
}