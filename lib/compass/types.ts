"use client";

export type AccountId = "edge" | "northwyn" | "galaxy" | "careers";

export type ContactDecision = "include" | "pass" | "unsure" | null;
export type FactDecision = "use" | "background" | "dont_use" | null;
export type DraftStatus = "pending" | "approved" | "edited";

export interface AccountView {
  id: AccountId;
  name: string;
  email: string;
  blurb: string;
  synced: string;
  defaultIncluded: boolean;
  recruiting?: boolean;
  badge: string;
}

export interface EvidenceItem {
  date: string;
  mailbox: string;
  direction: string;
  subject: string;
  summary: string;
  outlookWeblink?: string | null;
}

export interface CampaignCandidateView {
  id: string;
  name: string;
  title: string;
  org: string;
  email: string | null;
  mailboxes: string;
  likelyRole: string;
  roleGroup: "investor" | "introducer" | "advisor" | "banker" | "healthcare";
  confidence: "High" | "Medium" | "Low";
  whyHer: string;
  strength: number;
  lastTouch: string;
  freq: string;
  warnings: string[];
  evidence: EvidenceItem[];
  whyHerDetail?: string;
  callBetter?: boolean;
  missingEmail?: boolean;
  recentContact?: boolean;
  hasResearch: boolean;
}

export interface ResearchFact {
  claim: string;
  source: string;
  confidence: "High" | "Medium" | "Low";
}

export interface ResearchItemView {
  personId: string;
  identityConfirmed: boolean;
  identityNote: string;
  facts: ResearchFact[];
  recommendedUse: string;
  special?: "identity_uncertain" | "conflict";
  specialMessage?: string;
}

export interface DraftView {
  personId: string;
  subject: string;
  body: string;
  personalization: { kind: "private" | "public"; label: string; href?: string }[];
  ask: string;
}

export interface PlanView {
  objective: string;
  search: string;
  searchDetail: string;
  lookFor: string;
  prioritize: string;
  exclude: string;
  later: string;
  assumption: string;
}

export interface ChatMessage {
  id: string;
  role: "agent" | "user";
  text: string;
}
