import type { CampaignCandidateOut, CampaignOut } from "@/lib/api";
import type { CampaignCandidateView, PlanView } from "@/lib/compass/types";

const MAILBOX_BADGE: Record<string, string> = {
  northwyn: "NW",
  edge: "EI",
  galaxy: "GP",
  careers: "GC",
};

function strengthDots(label: string | null): number {
  switch (label) {
    case "solid":
    case "strong_relationship":
      return 4;
    case "needs_reconnection":
      return 2;
    case "weak_relationship":
    case "insufficient_evidence":
    case "functional":
      return 1;
    default:
      return 3;
  }
}

function confidenceFromRelevance(label: string | null): "High" | "Medium" | "Low" {
  if (label === "high_relevance") return "High";
  if (label === "low_relevance" || label === "unclear") return "Low";
  return "Medium";
}

function roleGroup(
  role: string | null,
): CampaignCandidateView["roleGroup"] {
  const r = (role || "").toLowerCase();
  if (r.includes("invest")) return "investor";
  if (r.includes("introduc")) return "introducer";
  if (r.includes("advisor")) return "advisor";
  if (r.includes("bank")) return "banker";
  return "healthcare";
}

export function planToFixture(campaign: CampaignOut): PlanView {
  const p = (campaign.plan?.plan || {}) as Record<string, unknown>;
  const mailboxes = Array.isArray(p.mailboxes)
    ? (p.mailboxes as { label?: string }[]).map((m) => m.label).filter(Boolean).join(" + ")
    : (campaign.account_ids || []).join(" + ");
  const roles = Array.isArray(p.relationship_types)
    ? (p.relationship_types as string[]).join(", ")
    : "";
  const exclusions = Array.isArray(p.exclusions)
    ? (p.exclusions as string[]).join("; ")
    : "None stated";
  const assumptions = Array.isArray(p.assumptions)
    ? (p.assumptions as string[])[0] || ""
    : "";
  return {
    objective: String(p.restatement || p.objective || campaign.objective_raw),
    search: String(mailboxes || "Selected mailboxes"),
    searchDetail: String(p.date_range_label || `Last ${p.lookback_years || 5} years`),
    lookFor: roles || "Relevant relationships",
    prioritize: String(p.prioritization || "Strong reciprocal relationships first"),
    exclude: exclusions,
    later: String(
      p.external_research_note ||
        "External research later for approved contacts only",
    ),
    assumption: assumptions || "Defaults applied where you didn't specify",
  };
}

export function candidateToFixture(c: CampaignCandidateOut): CampaignCandidateView {
  const badges = (c.source_accounts || [])
    .map((a) => MAILBOX_BADGE[a] || a)
    .join(" · ");
  const warnings: string[] = [];
  for (const f of c.flags || []) {
    if (f === "stale") warnings.push("Stale relationship — reconnection may land better");
    if (f === "insufficient_evidence") warnings.push("Thin evidence — review carefully");
    if (f === "functional") warnings.push("May be a functional / volume contact");
    if (f === "needs_reconnection" || c.strength_label === "needs_reconnection") {
      if (!warnings.some((w) => w.includes("Stale"))) {
        warnings.push("Needs a reconnection touch first");
      }
    }
  }
  if (!c.email) warnings.push("No verified email on file");

  const evidence = (c.evidence || []).map((e) => ({
    date: e.occurred_at
      ? new Date(e.occurred_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
        })
      : "—",
    mailbox: MAILBOX_BADGE[e.source_account || ""] || e.source_account || "—",
    direction: e.direction || "outbound",
    subject: e.subject || "(no subject)",
    summary: e.summary || "",
    outlookWeblink: e.outlook_weblink || null,
  }));

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentContact = (c.evidence || []).some(
    (e) => e.occurred_at && new Date(e.occurred_at).getTime() > thirtyDaysAgo,
  );
  const callBetter =
    (c.flags || []).includes("stale") ||
    c.strength_label === "needs_reconnection" ||
    (c.flags || []).includes("needs_reconnection");

  return {
    id: c.id,
    name: c.full_name || c.email || "Unknown",
    title: c.role_label || "contact",
    org: c.company || "—",
    email: c.email,
    mailboxes: badges || "—",
    likelyRole: c.role_label || "contact",
    roleGroup: roleGroup(c.role_label),
    confidence: confidenceFromRelevance(c.relevance_label),
    whyHer: c.why_text || "Limited evidence.",
    strength: strengthDots(c.strength_label),
    lastTouch: evidence[0]?.date || "—",
    freq: `${evidence.length} cited`,
    warnings,
    evidence,
    missingEmail: !c.email,
    hasResearch: false,
    recentContact,
    callBetter,
  };
}
