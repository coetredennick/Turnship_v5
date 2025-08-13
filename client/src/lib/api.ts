
// Stop importing DB types; define a minimal DTO matching API responses
export interface Connection {
  id: string;
  userId: string;
  email?: string | null;
  fullName?: string | null;
  full_name?: string | null; // legacy support for some UI reads
  company?: string | null;
  role?: string | null;
  location?: string | null;
  tags: string[];
  notes?: string | null;
  alumni: boolean;
  school?: string | null;
  gradYear?: number | null;
  grad_year?: number | null; // legacy support
  stage: string; // legacy for UI
  stageStatus?: string; // legacy status
  currentDraftId?: string; // legacy
  current_draft_id?: string; // legacy
  cycle: number;
  state: 'NOT_CONTACTED' | 'DRAFTING' | 'SENT' | 'AWAITING_REPLY' | 'REPLIED' | 'BOUNCED' | 'DO_NOT_CONTACT' | 'CLOSED';
  nextAction: string;
  nextActionAt?: string | null;
  followupCount?: number;
  closedReason?: string | null;
  gmailThreadId?: string | null;
  lastContactedAt?: string | null;
  last_contacted_at?: string | null; // legacy
  lastReplyAt?: string | null;
  last_reply_at?: string | null; // legacy
  replySentiment?: string | null;
  reply_sentiment?: string | null; // legacy
  createdAt: string;
  created_at?: string; // legacy
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export async function getConnections(): Promise<Connection[]> {
  return fetchApi<Connection[]>("/api/connections");
}

export async function createConnection(data: Omit<Connection, 'id' | 'userId' | 'createdAt'>): Promise<Connection> {
  return fetchApi<Connection>(`/api/connections`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateConnection(id: string, data: Partial<Connection>): Promise<Connection> {
  return fetchApi<Connection>(`/api/connections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function transitionConnection(id: string, action: string, metadata?: any): Promise<Connection> {
  return fetchApi<Connection>(`/api/connections/${id}/transition`, {
    method: 'POST',
    body: JSON.stringify({ action, metadata }),
  });
}

export async function deleteConnection(id: string): Promise<{ ok: boolean }> {
  return fetchApi<{ ok: boolean }>(`/api/connections/${id}`, {
    method: "DELETE",
  });
}

export async function getAnalytics() {
  return fetchApi("/api/analytics/overview");
}

export async function getTimeline() {
  return fetchApi("/api/timeline");
}

export interface EmailDraft {
  id: string;
  subject: string;
  body: string;
  connectionId: string;
  status: string;
}

export interface GenerateEmailRequest {
  connection_id: string;
  purpose: string;
  tone?: string;
  length?: string;
}

export async function generateEmail(params: GenerateEmailRequest): Promise<EmailDraft> {
  return fetchApi<EmailDraft>("/api/emails/generate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function sendEmail(draftId: string): Promise<{ ok: boolean; gmailMessageId: string }> {
  // Generate idempotency key to prevent duplicate sends
  const idempotencyKey = `send_${draftId}_${Date.now()}`;
  
  return fetchApi("/api/emails/send", {
    method: "POST",
    headers: {
      'x-idempotency-key': idempotencyKey
    },
    body: JSON.stringify({ draft_id: draftId }),
  });
}

// Batch email generation
export interface BatchGenerateRequest {
  connection_ids: string[];
  purpose: string;
  tone?: string;
  length?: string;
}

export interface BatchGenerateResponse {
  success: number;
  failed: number;
  results: Array<{
    connectionId: string;
    draftId: string;
    subject: string;
    body: string;
    connection: {
      name: string;
      company?: string;
    };
  }>;
  errors: Array<{
    connectionId: string;
    error: string;
  }>;
  summary: string;
}

export async function batchGenerateEmails(params: BatchGenerateRequest): Promise<BatchGenerateResponse> {
  return fetchApi<BatchGenerateResponse>("/api/emails/batch-generate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// Draft management
export interface Draft {
  id: string;
  connectionId: string;
  subject: string;
  body: string;
  status: 'draft' | 'sent' | 'scheduled';
  createdAt: string;
  meta?: {
    edited?: boolean;
    editedAt?: string;
    purpose?: string;
    tone?: string;
  };
  connection?: Connection;
}

export async function getDrafts(status?: string, connectionId?: string): Promise<Draft[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (connectionId) params.append('connectionId', connectionId);
  
  return fetchApi<Draft[]>(`/api/emails/drafts${params.toString() ? '?' + params.toString() : ''}`);
}

export async function updateDraft(draftId: string, subject: string, body: string): Promise<Draft> {
  return fetchApi<Draft>(`/api/emails/drafts/${draftId}`, {
    method: "PUT",
    body: JSON.stringify({ subject, body }),
  });
}

export async function deleteDraft(draftId: string): Promise<{ success: boolean }> {
  return fetchApi(`/api/emails/drafts/${draftId}`, {
    method: "DELETE",
  });
}

export async function deleteAllDraftsForConnection(connectionId: string): Promise<{ success: boolean; deletedCount: number }> {
  return fetchApi(`/api/emails/drafts/connection/${connectionId}`, {
    method: "DELETE",
  });
}

// Profile management
export interface Profile {
  userId: string;
  school?: string;
  gradYear?: number;
  major?: string;
  interests: string[];
  targets: string[];
  location?: string;
  tone: string;
}

export async function getProfile(): Promise<Profile> {
  return fetchApi<Profile>("/profile");
}

export async function updateProfile(profile: Partial<Profile>): Promise<Profile> {
  return fetchApi<Profile>("/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}
