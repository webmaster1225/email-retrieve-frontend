export type CompassStage =
  | "home"
  | "clarify"
  | "plan"
  | "progress"
  | "cards"
  | "confirm"
  | "research"
  | "drafts"
  | "sendAcct"
  | "review"
  | "tracking"
  | "done"
  | "campaigns";

export const WORKSPACE_STAGES: CompassStage[] = [
  "clarify",
  "plan",
  "progress",
  "cards",
  "confirm",
  "research",
  "drafts",
  "sendAcct",
  "review",
  "tracking",
  "done",
  "campaigns",
];

/** Linear back targets for the main campaign funnel. */
export const STAGE_BACK: Partial<Record<CompassStage, CompassStage>> = {
  clarify: "home",
  plan: "home",
  progress: "plan",
  cards: "plan",
  confirm: "cards",
  research: "confirm",
  drafts: "research",
  sendAcct: "drafts",
  review: "sendAcct",
  tracking: "review",
  done: "tracking",
  campaigns: "home",
};

export function previousStage(
  stage: CompassStage,
  opts?: {
    hadClarifying?: boolean;
    /** True when the progress spinner is for Gate-3 external research. */
    externalProgress?: boolean;
  },
): CompassStage | null {
  if (stage === "plan" && opts?.hadClarifying) return "clarify";
  if (stage === "progress" && opts?.externalProgress) return "confirm";
  return STAGE_BACK[stage] ?? null;
}

export function stageFromCampaignStatus(status: string | null | undefined): CompassStage {
  switch (status) {
    case "draft":
    case "clarifying":
      return "clarify";
    case "planning":
    case "plan_ready":
    case "plan_pending":
      return "plan";
    case "researching":
      return "progress";
    case "reviewing_contacts":
      return "cards";
    case "confirming":
    case "awaiting_confirm":
      return "confirm";
    case "external_research":
    case "reviewing_facts":
      return "research";
    case "drafting":
    case "reviewing_drafts":
      return "drafts";
    case "awaiting_sending_account":
    case "awaiting_send_account":
      return "sendAcct";
    case "ready_to_save":
    case "scheduled":
      return "review";
    case "tracking":
    case "completed":
      return "tracking";
    default:
      return "plan";
  }
}

export function isWorkspaceStage(stage: CompassStage): boolean {
  return stage !== "home";
}

export const STAGE_LABELS: Record<CompassStage, string> = {
  home: "Home",
  clarify: "Clarify",
  plan: "Search plan",
  progress: "Searching",
  cards: "Contacts",
  confirm: "Confirm campaign",
  research: "External research",
  drafts: "Drafts",
  sendAcct: "Sending account",
  review: "Final review",
  tracking: "Tracking",
  done: "Done",
  campaigns: "Campaigns",
};

export const NEXT_DECISION: Record<CompassStage, string> = {
  home: "State an objective and choose mailboxes",
  clarify: "Confirm search scope and exclusions",
  plan: "Approve the search plan (Gate 1)",
  progress: "Wait while relationships are reviewed",
  cards: "Include or pass on each candidate (Gate 2)",
  confirm: "Confirm research & drafting",
  research: "Approve external facts (Gate 3)",
  drafts: "Approve drafts (Gate 4)",
  sendAcct: "Confirm sending account (Gate 5)",
  review: "Save drafts or authorize send (Gates 6–8)",
  tracking: "Review replies and Gate 9 follow-ups",
  done: "Campaign complete",
  campaigns: "Open a campaign or start a new objective",
};
