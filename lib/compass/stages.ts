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
  | "done";

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
  "done",
];

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
  done: "Done",
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
  done: "Campaign complete for this prototype",
};
