const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";

export type Contact = {
  id: string;
  list_number: number | null;
  full_name: string | null;
  primary_email: string;
  company_name: string | null;
  company_domain: string | null;
  first_contacted_at: string | null;
  last_contacted_at: string | null;
  email_count: number;
  thread_count: number;
  fundraising_relevance_score: number;
  fundraising_relevance_tier: string | null;
  contact_type: string | null;
  status: string;
  review_status: string;
  notes: string | null;
  awaiting_reply: boolean;
  days_since_outreach: number | null;
  last_inbound_at: string | null;
  outreach_relevance_score?: number;
  outreach_relevance_tier?: string | null;
  outreach_score_explanation?: string | null;
  auto_context_short: string | null;
  detected_topics: string[] | null;
  detected_role: string | null;
  last_subject: string | null;
  last_preview: string | null;
  latest_outlook_weblink: string | null;
  latest_message_id: string | null;
  has_ai_summary: boolean;
  has_outreach_intelligence?: boolean;
  ai_outreach_intelligence?: OutreachIntelligence | null;
  ai_seniority?: SeniorityResult | null;
};

export type ContactDetail = Contact & {
  score_breakdown: Record<string, number> | null;
  auto_context_detailed: string | null;
  last_meaningful_email_preview: string | null;
  meaningful_previews: string[] | null;
  ai_summary: string | null;
  ai_follow_up_draft: string | null;
  ai_contact_classification: { contact_type: string; confidence: string; reason: string } | null;
  ai_summary_generated_at: string | null;
};

export type AIResult = {
  summary?: string;
  draft?: string;
  classification?: { contact_type: string; confidence: string; reason: string };
  cached: boolean;
  generated_at?: string | null;
};

export type Stats = {
  total_contacts: number;
  external_contacts: number;
  high_relevance_contacts: number;
  total_messages: number;
  synced_messages: number;
  graph_sent_total: number | null;
  sync_complete: boolean | null;
  review_pending: number;
  review_approved: number;
  review_denied: number;
  last_sync_at: string | null;
};

export type SyncRun = {
  id: string;
  sync_type: string;
  status: string;
  messages_fetched: number;
  messages_new: number;
  contacts_updated: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  account_id?: string | null;
};

export type MailboxAccount = {
  id: string;
  display_name: string;
  email: string;
  provider: string;
  blurb: string;
  status: string;
  last_sync_at: string | null;
  last_sync_plain: string | null;
  permissions: Record<string, boolean>;
  is_functional: boolean;
  default_included: boolean;
  enabled: boolean;
  is_stub: boolean;
  connected: boolean;
  plain_message: string | null;
  can_send: boolean;
  partial_permissions: boolean;
};

export type EmailDraft = {
  id: string;
  contact_id: string;
  contact_name: string | null;
  contact_email: string | null;
  list_number: number | null;
  subject: string | null;
  body: string | null;
  status: string;
  custom_instructions: string | null;
  system_prompt: string | null;
  user_prompt: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OutreachPrompt = {
  system_prompt: string;
  user_prompt_template: string;
  updated_at: string;
};

export type SeniorityResult = {
  title: string | null;
  seniority_level: string;
  is_senior: boolean;
  confidence: string;
  reason: string;
};

export type ExchangeStats = {
  outbound_count: number;
  inbound_count: number;
  total_count: number;
  thread_count: number;
  two_way_threads: number;
  has_two_way: boolean;
  first_exchange_at: string | null;
  last_exchange_at: string | null;
  data_source: string;
};

export type RelationshipAnalysis = {
  conversation_pattern: string;
  conversation_depth: string;
  depth_score: number;
  business_usefulness: Record<string, string>;
  primary_value: string;
  summary: string;
  confidence: string;
  reason: string;
};

export type RelationshipResult = {
  stats: ExchangeStats;
  analysis: RelationshipAnalysis;
  cached: boolean;
  generated_at?: string | null;
};

export type OutreachIntelligence = {
  contact_id?: string;
  stats: ExchangeStats;
  analysis: {
    conversation_pattern: string;
    relationship_depth: string;
    relationship_strength: string;
    seniority: {
      title: string | null;
      level: string;
      is_senior: boolean;
    };
    use_case_relevance: Record<string, string>;
    primary_use_case: string;
    last_discussed_topic: string | null;
    key_conversation_points: string[];
    personalization_hook: string | null;
    summary: string;
    confidence: string;
    evidence: string;
  };
  score: number;
  tier: string | null;
  score_breakdown: Record<string, number>;
  score_explanation: string;
  generated_at?: string | null;
  cached?: boolean;
  draft_id?: string | null;
};

export type OutreachJob = {
  id: string;
  status: string;
  job_type: string;
  contact_ids: string[];
  total: number;
  completed: number;
  failed: number;
  generate_drafts: boolean;
  custom_instructions: string | null;
  target_use_case: string | null;
  force: boolean;
  results: Array<{
    contact_id: string;
    status: string;
    error?: string;
    draft_id?: string;
    intelligence?: OutreachIntelligence;
  }>;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
  progress_pct: number;
};

export type ExchangeEmail = {
  subject: string | null;
  body_preview: string | null;
  sent_datetime: string | null;
  direction: string;
  outlook_weblink: string | null;
  has_attachments: boolean;
};

export type OutlookContact = {
  id: string;
  local_contact_id: string | null;
  list_number: number | null;
  full_name: string | null;
  primary_email: string;
  company_name: string | null;
  company_domain: string | null;
  last_contacted_at: string | null;
  last_subject: string | null;
  last_preview: string | null;
  latest_message_id: string | null;
  latest_outlook_weblink: string | null;
  email_count: number;
  thread_count: number;
  fundraising_relevance_score: number;
  fundraising_relevance_tier: string | null;
  review_status: string;
  detected_topics: string[] | null;
  detected_role?: string | null;
  ai_seniority?: SeniorityResult | null;
  ai_relationship_analysis?: {
    generated_at?: string | null;
    stats?: ExchangeStats;
    analysis?: RelationshipAnalysis;
  } | null;
};

export type AuthStatus = {
  connected: boolean;
  user_email: string | null;
  can_send_mail?: boolean;
  token_scopes?: string[];
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // Free ngrok returns an interstitial HTML page (no CORS headers) unless skipped.
      "ngrok-skip-browser-warning": "true",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.detail || text || res.statusText);
    } catch {
      throw new Error(text || res.statusText);
    }
  }
  return res.json();
}

export const api = {
  authStatus: () => apiFetch<AuthStatus>("/auth/status"),
  disconnect: () => apiFetch<{ connected: boolean }>("/auth/disconnect", { method: "POST" }),
  stats: (includeGraphTotal = false, accountId?: string | null) => {
    const qs = new URLSearchParams();
    if (includeGraphTotal) qs.set("include_graph_total", "true");
    if (accountId) qs.set("account_id", accountId);
    const q = qs.toString();
    return apiFetch<Stats>(`/contacts/stats${q ? `?${q}` : ""}`);
  },
  outlookContacts: (params: {
    page_size?: number;
    next_link?: string;
    q?: string;
    exclude_emails?: string;
    include_total?: boolean;
    prefer_local?: boolean;
  }) => {
    const qs = new URLSearchParams();
    if (params.page_size) qs.set("page_size", String(params.page_size));
    if (params.next_link) qs.set("next_link", params.next_link);
    if (params.q) qs.set("q", params.q);
    if (params.exclude_emails) qs.set("exclude_emails", params.exclude_emails);
    if (params.include_total) qs.set("include_total", "true");
    if (params.prefer_local === false) qs.set("prefer_local", "false");
    return apiFetch<{
      items: OutlookContact[];
      next_link: string | null;
      total: number | null;
      source?: "local" | "graph";
    }>(`/contacts/outlook?${qs.toString()}`);
  },
  outlookContact: (id: string) => apiFetch<OutlookContact>(`/contacts/outlook/${encodeURIComponent(id)}`),
  contactMessagesByEmail: (email: string, limit = 5) =>
    apiFetch<{ items: ExchangeEmail[] }>(
      `/contacts/by-email/${encodeURIComponent(email)}/messages?limit=${limit}`
    ),
  updateContactByEmail: (email: string, data: { review_status?: string; notes?: string }) =>
    apiFetch<{ id: string; review_status: string; local_contact_id?: string | null }>(
      `/contacts/by-email/${encodeURIComponent(email)}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),
  contacts: (params: Record<string, string | number | boolean>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== "" && v !== undefined && v !== null) qs.set(k, String(v));
    });
    return apiFetch<{ items: Contact[]; total: number | null; page: number; page_size: number }>(
      `/contacts?${qs.toString()}`
    );
  },
  contact: (id: string) => apiFetch<ContactDetail>(`/contacts/${id}`),
  updateContact: (id: string, data: { review_status?: string; notes?: string }) =>
    apiFetch<ContactDetail>(`/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  contactMessages: (id: string) =>
    apiFetch<
      Array<{
        id: string;
        subject: string;
        sent_datetime: string;
        body_preview: string;
        outlook_weblink: string;
        has_attachments: boolean;
      }>
    >(`/contacts/${id}/messages`),
  startSync: () => apiFetch<SyncRun>("/sync/start", { method: "POST" }),
  startInboxSync: () => apiFetch<SyncRun>("/sync/start-inbox", { method: "POST" }),
  failRunningSyncs: () => apiFetch<SyncRun[]>("/sync/fail-running", { method: "POST" }),
  syncStatus: () => apiFetch<SyncRun | null>("/sync/status"),
  loginUrl: () => `${API_BASE}/auth/login`,
  listAccounts: () => apiFetch<MailboxAccount[]>("/accounts"),
  getAccount: (id: string) => apiFetch<MailboxAccount>(`/accounts/${id}`),
  accountLogin: (id: string) =>
    apiFetch<{ stub?: boolean; login_url?: string; connect_url?: string; error?: string }>(
      `/accounts/${id}/login`,
    ),
  stubConnectAccount: (id: string) =>
    apiFetch<MailboxAccount>(`/accounts/${id}/stub-connect`, { method: "POST" }),
  disconnectAccount: (id: string) =>
    apiFetch<{ connected: boolean; account_id: string; consequences: string }>(
      `/accounts/${id}/disconnect`,
      { method: "POST" },
    ),
  syncAccount: (id: string, syncType = "full") =>
    apiFetch<SyncRun>(`/accounts/${id}/sync?sync_type=${syncType}`, { method: "POST" }),
  stopAccountSync: (id: string) =>
    apiFetch<SyncRun | null>(`/accounts/${id}/sync/stop`, { method: "POST" }),
  accountSyncStatus: (id: string) => apiFetch<SyncRun | null>(`/accounts/${id}/sync/status`),
  accountStatus: (id: string) => apiFetch<MailboxAccount>(`/accounts/${id}/status`),
  getOutreachPrompt: () => apiFetch<OutreachPrompt>("/outreach/prompt"),
  saveOutreachPrompt: (data: { system_prompt?: string; user_prompt_template?: string }) =>
    apiFetch<OutreachPrompt>("/outreach/prompt", { method: "PATCH", body: JSON.stringify(data) }),
  listDrafts: (status?: string) =>
    apiFetch<{ items: EmailDraft[] }>(`/outreach/drafts${status ? `?status=${status}` : ""}`),
  generateDrafts: (contactIds: string[], customInstructions?: string, personalized = true) =>
    apiFetch<{
      items: EmailDraft[];
      results?: Array<{ contact_id: string; status: string; error?: string }>;
      intelligence?: OutreachIntelligence[];
    }>("/outreach/drafts/generate", {
      method: "POST",
      body: JSON.stringify({
        contact_ids: contactIds,
        custom_instructions: customInstructions || null,
        personalized,
      }),
    }),
  generateDraftForContact: (contactId: string, customInstructions?: string) =>
    apiFetch<EmailDraft & { intelligence?: OutreachIntelligence }>(`/outreach/contacts/${contactId}/generate`, {
      method: "POST",
      body: JSON.stringify({ custom_instructions: customInstructions || null, personalized: true }),
    }),
  analyzeOutreach: (params: {
    contactIds: string[];
    force?: boolean;
    generateDrafts?: boolean;
    customInstructions?: string;
    targetUseCase?: string;
    asyncBatch?: boolean;
  }) =>
    apiFetch<{ job?: OutreachJob; items?: OutreachIntelligence[] }>("/outreach/analyze", {
      method: "POST",
      body: JSON.stringify({
        contact_ids: params.contactIds,
        force: params.force ?? false,
        generate_drafts: params.generateDrafts ?? false,
        custom_instructions: params.customInstructions || null,
        target_use_case: params.targetUseCase || null,
        async_batch: params.asyncBatch ?? true,
      }),
    }),
  analyzeContactOutreach: (contactId: string, force = false, targetUseCase?: string) =>
    apiFetch<OutreachIntelligence>(`/outreach/contacts/${contactId}/analyze`, {
      method: "POST",
      body: JSON.stringify({ force, target_use_case: targetUseCase || null }),
    }),
  getContactIntelligence: (contactId: string) =>
    apiFetch<OutreachIntelligence>(`/outreach/contacts/${contactId}/intelligence`),
  getOutreachJob: (jobId: string) => apiFetch<OutreachJob>(`/outreach/jobs/${jobId}`),
  updateDraft: (id: string, data: { subject?: string; body?: string; status?: string }) =>
    apiFetch<EmailDraft>(`/outreach/drafts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  approveDraft: (id: string) => apiFetch<EmailDraft>(`/outreach/drafts/${id}/approve`, { method: "POST" }),
  sendDraft: (id: string) => apiFetch<EmailDraft>(`/outreach/drafts/${id}/send`, { method: "POST" }),
  sendApprovedDrafts: () =>
    apiFetch<{ results: Array<{ draft_id: string; status: string; error?: string }> }>(
      "/outreach/drafts/send-approved",
      { method: "POST" }
    ),
  exportXlsxUrl: () => `${API_BASE}/export/contacts.xlsx`,
  exportCsvUrl: () => `${API_BASE}/export/contacts.csv`,
  openOutlookUrl: (messageId: string) => `${API_BASE}/messages/${messageId}/open-outlook`,
  aiStatus: (id: string) =>
    apiFetch<{
      has_summary: boolean;
      has_follow_up: boolean;
      has_classification: boolean;
      summary_generated_at: string | null;
      needs_refresh: boolean;
    }>(`/contacts/${id}/ai/status`),
  aiSummary: (id: string, force = false) =>
    apiFetch<AIResult>(`/contacts/${id}/ai/summary?force=${force}`, { method: "POST" }),
  aiFollowUp: (id: string, force = false) =>
    apiFetch<AIResult>(`/contacts/${id}/ai/follow-up?force=${force}`, { method: "POST" }),
  aiClassify: (id: string, force = false) =>
    apiFetch<AIResult>(`/contacts/${id}/ai/classify?force=${force}`, { method: "POST" }),
  aiSeniorityByEmail: (
    email: string,
    context?: {
      full_name?: string | null;
      company_name?: string | null;
      last_subject?: string | null;
      last_preview?: string | null;
    },
    force = false
  ) =>
    apiFetch<{ seniority: SeniorityResult; cached: boolean; generated_at?: string | null }>(
      `/contacts/by-email/${encodeURIComponent(email)}/ai/seniority?force=${force}`,
      { method: "POST", body: JSON.stringify(context || {}) }
    ),
  aiRelationshipByEmail: (
    email: string,
    context?: {
      full_name?: string | null;
      company_name?: string | null;
      last_subject?: string | null;
      last_preview?: string | null;
    },
    force = false
  ) =>
    apiFetch<RelationshipResult>(
      `/contacts/by-email/${encodeURIComponent(email)}/ai/relationship?force=${force}`,
      { method: "POST", body: JSON.stringify(context || {}) }
    ),
  aiSummarizeThreads: (id: string, force = false) =>
    apiFetch<AIResult>(`/contacts/${id}/ai/summarize-threads?force=${force}`, { method: "POST" }),

  // Compass P3–P5 campaigns
  listCampaigns: () => apiFetch<CampaignOut[]>("/campaigns"),
  createCampaign: (objective: string, accountIds: string[]) =>
    apiFetch<CampaignOut>("/campaigns", {
      method: "POST",
      body: JSON.stringify({ objective, account_ids: accountIds }),
    }),
  getCampaign: (id: string) => apiFetch<CampaignOut>(`/campaigns/${id}`),
  clarifyCampaign: (id: string, data: { answer?: string; use_defaults?: boolean }) =>
    apiFetch<CampaignOut>(`/campaigns/${id}/clarify`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  revisePlan: (id: string, instruction: string) =>
    apiFetch<CampaignOut>(`/campaigns/${id}/plan/revise`, {
      method: "POST",
      body: JSON.stringify({ instruction }),
    }),
  approvePlan: (id: string) =>
    apiFetch<CampaignOut>(`/campaigns/${id}/plan/approve`, { method: "POST" }),
  startCampaignResearch: (id: string) =>
    apiFetch<{ status: string; progress?: string; campaign: CampaignOut }>(
      `/campaigns/${id}/research/start`,
      { method: "POST" },
    ),
  campaignResearchStatus: (id: string) =>
    apiFetch<{ status: string; progress?: string; error?: string; campaign: CampaignOut }>(
      `/campaigns/${id}/research/status`,
    ),
  listCampaignCandidates: (id: string) =>
    apiFetch<CampaignCandidateOut[]>(`/campaigns/${id}/candidates`),
  setCampaignDecisions: (
    id: string,
    items: { candidate_id: string; decision: string }[],
    instructionText?: string,
  ) =>
    apiFetch<{ updated: number; campaign: CampaignOut }>(`/campaigns/${id}/decisions`, {
      method: "POST",
      body: JSON.stringify({ items, instruction_text: instructionText || null }),
    }),
  previewNlOp: (id: string, instruction: string) =>
    apiFetch<{
      instruction: string;
      restatement: string;
      candidate_ids: string[];
      action: string;
      matched_count: number;
    }>(`/campaigns/${id}/nl-ops/preview`, {
      method: "POST",
      body: JSON.stringify({ instruction }),
    }),
  applyNlOp: (id: string, instruction: string) =>
    apiFetch<{ updated: number; restatement: string; campaign: CampaignOut }>(
      `/campaigns/${id}/nl-ops/apply`,
      { method: "POST", body: JSON.stringify({ instruction }) },
    ),
  campaignAudit: (id: string) =>
    apiFetch<
      Array<{
        id: string;
        event_type: string;
        narrative: string | null;
        payload: Record<string, unknown> | null;
        created_at: string | null;
      }>
    >(`/campaigns/${id}/audit`),

  confirmCampaign: (
    id: string,
    data: { notes?: string; ask?: string; research_mode?: string },
  ) =>
    apiFetch<CampaignOut>(`/campaigns/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  startExternalResearch: (id: string) =>
    apiFetch<{ status: string; progress?: string; campaign: CampaignOut }>(
      `/campaigns/${id}/external-research/start`,
      { method: "POST" },
    ),
  externalResearchStatus: (id: string) =>
    apiFetch<{ status: string; progress?: string; campaign: CampaignOut }>(
      `/campaigns/${id}/external-research/status`,
    ),
  listCampaignFacts: (id: string) => apiFetch<CampaignFactOut[]>(`/campaigns/${id}/facts`),
  setFactDecisions: (
    id: string,
    items: { fact_id: string; decision: string }[],
  ) =>
    apiFetch<{ updated: number; campaign: CampaignOut }>(`/campaigns/${id}/facts/decisions`, {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
  generateCampaignDrafts: (id: string) =>
    apiFetch<{ items: CampaignDraftOut[] }>(`/campaigns/${id}/drafts/generate`, {
      method: "POST",
    }),
  listCampaignDrafts: (id: string) =>
    apiFetch<CampaignDraftOut[]>(`/campaigns/${id}/drafts`),
  patchCampaignDraft: (id: string, draftId: string, data: { subject?: string; body?: string }) =>
    apiFetch<CampaignDraftOut>(`/campaigns/${id}/drafts/${draftId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  approveCampaignDraft: (id: string, draftId: string) =>
    apiFetch<CampaignDraftOut>(`/campaigns/${id}/drafts/${draftId}/approve`, {
      method: "POST",
    }),
  applyCampaignTone: (
    id: string,
    data: { mode: string; scope?: string; draft_id?: string },
  ) =>
    apiFetch<{ items: CampaignDraftOut[] }>(`/campaigns/${id}/drafts/apply-tone`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  setSendingAccount: (
    id: string,
    data: { account_id: string; careers_justification?: string },
  ) =>
    apiFetch<CampaignOut>(`/campaigns/${id}/sending-account`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  campaignPreflight: (id: string) =>
    apiFetch<{
      recipient_count: number;
      by_role: Record<string, number>;
      searched_accounts: string[];
      sending_account: string | null;
      research_mode: string | null;
      external_facts_approved: number;
      attention: {
        missing_email: Array<{ id: string; name: string }>;
        recently_messaged: Array<{ id: string; name: string; email?: string }>;
        call_better: Array<{ id: string; name: string }>;
        needs_review: Array<{ id: string; name: string; draft_status?: string }>;
        duplicates: Array<{ id: string; name: string; duplicate_of?: string }>;
      };
      ready_to_save: boolean;
    }>(`/campaigns/${id}/preflight`),
  saveDraftsToMailbox: (id: string) =>
    apiFetch<{ results: Array<Record<string, unknown>> }>(
      `/campaigns/${id}/drafts/save-to-mailbox`,
      { method: "POST" },
    ),
  scheduleCampaign: (id: string, scheduledFor: string) =>
    apiFetch<{ items: Array<Record<string, unknown>> }>(`/campaigns/${id}/schedule`, {
      method: "POST",
      body: JSON.stringify({ scheduled_for: scheduledFor }),
    }),
  sendPreview: (id: string) =>
    apiFetch<{
      account_id: string;
      recipients: Array<{ draft_id: string; email: string; name?: string; subject?: string }>;
      recipient_emails: string[];
      count: number;
    }>(`/campaigns/${id}/send/preview`, { method: "POST" }),
  authorizeCampaignSend: (id: string, recipientEmails: string[]) =>
    apiFetch<{ results: Array<Record<string, unknown>> }>(`/campaigns/${id}/send`, {
      method: "POST",
      body: JSON.stringify({ confirm: true, recipient_emails: recipientEmails }),
    }),
  campaignSendLog: (id: string) =>
    apiFetch<Array<Record<string, unknown>>>(`/campaigns/${id}/send-log`),

  regenerateCampaignDraft: (id: string, draftId: string, variant?: string) =>
    apiFetch<CampaignDraftOut>(`/campaigns/${id}/drafts/${draftId}/regenerate`, {
      method: "POST",
      body: JSON.stringify(variant ? { variant } : {}),
    }),
  setCampaignDraftVariant: (id: string, draftId: string, variant: string) =>
    apiFetch<CampaignDraftOut>(`/campaigns/${id}/drafts/${draftId}/variant`, {
      method: "POST",
      body: JSON.stringify({ variant }),
    }),
  changeCampaignDraftAsk: (id: string, draftId: string, ask: string) =>
    apiFetch<CampaignDraftOut>(`/campaigns/${id}/drafts/${draftId}/change-ask`, {
      method: "POST",
      body: JSON.stringify({ ask }),
    }),
  removeCampaignDraftPublicRefs: (id: string, draftId: string) =>
    apiFetch<CampaignDraftOut>(`/campaigns/${id}/drafts/${draftId}/remove-public-refs`, {
      method: "POST",
    }),

  listCampaignsSummary: () =>
    apiFetch<
      Array<{
        id: string;
        title: string | null;
        status: string;
        objective_raw?: string;
        sent?: number;
        replied?: number;
        updated_at?: string | null;
      }>
    >(`/campaigns?summary=true`),
  getCampaignTracking: (id: string) =>
    apiFetch<CampaignTrackingOut>(`/campaigns/${id}/tracking`),
  refreshCampaignTracking: (id: string) =>
    apiFetch<CampaignTrackingOut>(`/campaigns/${id}/tracking/refresh`, { method: "POST" }),

  proposeFollowUps: (id: string) =>
    apiFetch<{ items: FollowUpOut[] }>(`/campaigns/${id}/follow-ups/propose`, {
      method: "POST",
    }),
  listFollowUps: (id: string) => apiFetch<FollowUpOut[]>(`/campaigns/${id}/follow-ups`),
  approveFollowUp: (id: string, followupId: string) =>
    apiFetch<FollowUpOut>(`/campaigns/${id}/follow-ups/${followupId}/approve`, {
      method: "POST",
    }),
  rejectFollowUp: (id: string, followupId: string) =>
    apiFetch<FollowUpOut>(`/campaigns/${id}/follow-ups/${followupId}/reject`, {
      method: "POST",
    }),
  sendFollowUp: (id: string, followupId: string, recipientEmail: string) =>
    apiFetch<{ status: string; followup_id: string; email: string }>(
      `/campaigns/${id}/follow-ups/${followupId}/send`,
      {
        method: "POST",
        body: JSON.stringify({ confirm: true, recipient_email: recipientEmail }),
      },
    ),
};

export type CampaignTrackingOut = {
  campaign_id: string;
  title: string | null;
  status: string;
  sending_account_id: string | null;
  counts: Record<string, number>;
  contacts: Array<{
    candidate_id: string;
    name: string | null;
    email: string | null;
    tracking_status: string;
    company?: string | null;
  }>;
  replies: Array<{
    id: string;
    candidate_id: string;
    excerpt: string | null;
    matched_by: string | null;
    matched_at: string | null;
  }>;
  commitments: Array<{
    id: string;
    candidate_id: string;
    owner: string;
    text: string;
    due_hint: string | null;
    status: string;
  }>;
  suggestions: string[];
};

export type FollowUpOut = {
  id: string;
  campaign_id: string;
  candidate_id: string;
  kind: string;
  subject: string | null;
  body: string;
  status: string;
  based_on_status: string | null;
};

export type CampaignOut = {
  id: string;
  title: string | null;
  objective_raw: string;
  objective_parsed: Record<string, unknown> | null;
  status: string;
  account_ids: string[];
  clarification_round: number;
  research_status: string | null;
  research_progress: string | null;
  research_error: string | null;
  research_mode?: string | null;
  message_strategy?: Record<string, unknown>;
  external_research_status?: string | null;
  external_research_progress?: string | null;
  sending_account_id?: string | null;
  sending_account_confirmed_at?: string | null;
  plan: {
    id: string;
    version: number;
    plan: Record<string, unknown>;
    assumptions: string[] | null;
    revision_note: string | null;
    approved_at: string | null;
    approved_by: string | null;
  } | null;
  plan_approved: boolean;
  candidates_count: number;
  included_count: number;
  created_at: string | null;
  updated_at: string | null;
};

export type CampaignCandidateOut = {
  id: string;
  contact_id: string | null;
  rank: number;
  full_name: string | null;
  email: string | null;
  company: string | null;
  role_label: string | null;
  strength_label: string | null;
  relevance_label: string | null;
  why_text: string | null;
  source_accounts: string[];
  decision: string;
  flags: string[];
  evidence: Array<{
    id: string;
    kind: string;
    occurred_at: string | null;
    source_account: string | null;
    direction: string | null;
    subject: string | null;
    summary: string | null;
    message_id: string | null;
    outlook_weblink: string | null;
    citation_ok: boolean;
  }>;
};

export type CampaignFactOut = {
  id: string;
  candidate_id: string;
  claim: string;
  sources: Array<Record<string, unknown>>;
  publication_date: string | null;
  event_date: string | null;
  retrieved_at: string | null;
  confidence: string | null;
  status: string;
  identity_confirmed: boolean;
  quarantined_reason: string | null;
  recommended_use: string | null;
};

export type CampaignDraftOut = {
  id: string;
  campaign_id: string;
  candidate_id: string;
  subject: string | null;
  body: string;
  status: string;
  lifecycle: string;
  provenance: Record<string, unknown>;
  ask: string | null;
  warnings: string[];
  variant: string;
  mailbox_draft_id: string | null;
  mailbox_draft_web_link: string | null;
};

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function tierClass(tier: string | null) {
  if (tier === "high") return "tier high";
  if (tier === "medium") return "tier medium";
  return "tier low";
}

export function reviewClass(status: string | null) {
  if (status === "approved") return "review approved";
  if (status === "denied") return "review denied";
  return "review pending";
}
