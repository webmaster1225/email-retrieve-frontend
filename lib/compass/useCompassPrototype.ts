"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ACCOUNTS,
  AccountId,
  CANDIDATES,
  COPY,
  ContactDecision,
  DRAFTS,
  DraftStatus,
  FactDecision,
  ChatMessage,
  NORTHWYN_OBJECTIVE,
  RESEARCH,
  formatRoleSummary,
  roleBreakdown,
} from "./northwynScenario";
import { CompassStage, NEXT_DECISION } from "./stages";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function agent(text: string): ChatMessage {
  return { id: uid("a"), role: "agent", text };
}

function user(text: string): ChatMessage {
  return { id: uid("u"), role: "user", text };
}

function defaultDecisions(): Record<string, ContactDecision> {
  const out: Record<string, ContactDecision> = {};
  for (const c of CANDIDATES) {
    // Pre-seed includes so a first-time user can advance; they can still change
    out[c.id] = "include";
  }
  return out;
}

function defaultFacts(): Record<string, FactDecision> {
  const out: Record<string, FactDecision> = {};
  for (const r of RESEARCH) {
    if (r.special === "identity_uncertain") out[r.personId] = "dont_use";
    else if (r.special === "conflict") out[r.personId] = "background";
    else out[r.personId] = "use";
  }
  return out;
}

function defaultDrafts(): Record<string, DraftStatus> {
  const out: Record<string, DraftStatus> = {};
  for (const d of DRAFTS) out[d.personId] = "pending";
  return out;
}

function defaultBodies(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of DRAFTS) out[d.personId] = d.body;
  return out;
}

export function useCompassPrototype() {
  const [stage, setStage] = useState<CompassStage>("home");
  const [objective, setObjective] = useState("");
  const [includedAccounts, setIncludedAccounts] = useState<Record<AccountId, boolean>>(
    () =>
      Object.fromEntries(ACCOUNTS.map((a) => [a.id, a.defaultIncluded])) as Record<
        AccountId,
        boolean
      >,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [decisions, setDecisions] = useState<Record<string, ContactDecision>>(defaultDecisions);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [factDecisions, setFactDecisions] = useState<Record<string, FactDecision>>(defaultFacts);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, DraftStatus>>(defaultDrafts);
  const [draftBodies, setDraftBodies] = useState<Record<string, string>>(defaultBodies);
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const [sendingAccount, setSendingAccount] = useState<string | null>(null);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [doneAction, setDoneAction] = useState<"saved" | "sent" | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback((...msgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...msgs]);
  }, []);

  const showToast = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearTimeout(progressTimer.current);
    };
  }, []);

  const includedIds = useMemo(
    () =>
      CANDIDATES.filter((c) => decisions[c.id] === "include" || decisions[c.id] === "unsure").map(
        (c) => c.id,
      ),
    [decisions],
  );

  const approvedIds = useMemo(
    () => CANDIDATES.filter((c) => decisions[c.id] === "include").map((c) => c.id),
    [decisions],
  );

  const passedCount = useMemo(
    () => CANDIDATES.filter((c) => decisions[c.id] === "pass").length,
    [decisions],
  );

  const researchForApproved = useMemo(
    () => RESEARCH.filter((r) => approvedIds.includes(r.personId)),
    [approvedIds],
  );

  const draftsForApproved = useMemo(
    () => DRAFTS.filter((d) => approvedIds.includes(d.personId) && !CANDIDATES.find((c) => c.id === d.personId)?.missingEmail),
    [approvedIds],
  );

  const sendableIds = useMemo(() => {
    return approvedIds.filter((id) => {
      const c = CANDIDATES.find((x) => x.id === id);
      if (!c || c.missingEmail || !c.email) return false;
      return draftStatuses[id] === "approved" || draftStatuses[id] === "edited";
    });
  }, [approvedIds, draftStatuses]);

  const usedFactCount = useMemo(
    () =>
      Object.entries(factDecisions).filter(
        ([id, d]) => approvedIds.includes(id) && d === "use",
      ).length,
    [factDecisions, approvedIds],
  );

  const accountLabels = useMemo(() => {
    return ACCOUNTS.filter((a) => includedAccounts[a.id])
      .map((a) => a.name)
      .join(" + ");
  }, [includedAccounts]);

  const nextDecision = NEXT_DECISION[stage];

  const startCampaign = useCallback(
    (obj: string) => {
      const trimmed = obj.trim() || NORTHWYN_OBJECTIVE;
      setObjective(trimmed);
      setStage("clarify");
      setMessages([
        user(trimmed),
        agent(COPY.mailboxSelection),
        agent(COPY.clarification),
      ]);
    },
    [],
  );

  const toggleAccount = useCallback((id: AccountId) => {
    setIncludedAccounts((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const advanceFromClarify = useCallback(
    (reply: string) => {
      push(user(reply), agent(COPY.planIntro));
      setStage("plan");
    },
    [push],
  );

  const approvePlan = useCallback(() => {
    push(user("Approve & start searching"), agent(COPY.progress));
    setStage("progress");
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => {
      push(agent(COPY.contactRec));
      setStage("cards");
    }, 2200);
  }, [push]);

  const setDecision = useCallback((id: string, d: ContactDecision) => {
    setDecisions((prev) => ({ ...prev, [id]: d }));
  }, []);

  const toggleEvidence = useCallback((id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
    if (id === "sarah") {
      push(agent(COPY.whySarah));
    }
  }, [push]);

  const finishCards = useCallback(() => {
    const approved = CANDIDATES.filter((c) => decisions[c.id] === "include").length;
    const passed = CANDIDATES.filter((c) => decisions[c.id] === "pass").length;
    const batch = COPY.contactBatch
      .replace("{approved}", String(approved))
      .replace("{passed}", String(passed));
    const confirm = COPY.campaignConfirm
      .replace("{count}", String(approved))
      .replace("{breakdown}", roleBreakdown(
        CANDIDATES.filter((c) => decisions[c.id] === "include").map((c) => c.id),
      ));
    push(agent(batch), agent(confirm), agent(COPY.messageInstructions));
    setStage("confirm");
  }, [decisions, push]);

  const confirmCampaign = useCallback(
    (notes: string) => {
      const researchCount = RESEARCH.filter((r) =>
        approvedIds.includes(r.personId) && r.facts.length > 0,
      ).length;
      const msg = COPY.researchReturn
        .replace("{count}", String(approvedIds.length))
        .replace("{researchCount}", String(researchCount));
      push(user(notes || COPY.messageNotes), agent(msg), agent(COPY.sourceReview));
      // Surface special cases
      const conflict = RESEARCH.find(
        (r) => r.special === "conflict" && approvedIds.includes(r.personId),
      );
      const uncertain = RESEARCH.find(
        (r) => r.special === "identity_uncertain" && approvedIds.includes(r.personId),
      );
      if (conflict?.specialMessage) push(agent(conflict.specialMessage));
      if (uncertain?.specialMessage) push(agent(uncertain.specialMessage));
      setStage("research");
    },
    [approvedIds, push],
  );

  const setFact = useCallback((id: string, d: FactDecision) => {
    setFactDecisions((prev) => ({ ...prev, [id]: d }));
  }, []);

  const finishResearch = useCallback(() => {
    push(agent(COPY.draftReview));
    setStage("drafts");
  }, [push]);

  const setDraftStatus = useCallback((id: string, s: DraftStatus) => {
    setDraftStatuses((prev) => ({ ...prev, [id]: s }));
  }, []);

  const updateDraftBody = useCallback((id: string, body: string) => {
    setDraftBodies((prev) => ({ ...prev, [id]: body }));
    setDraftStatuses((prev) => ({ ...prev, [id]: "edited" }));
  }, []);

  const applyTone = useCallback(
    (id: string | "all", mode: "shorter" | "warmer" | "direct") => {
      const targets = id === "all" ? draftsForApproved.map((d) => d.personId) : [id];
      setDraftBodies((prev) => {
        const next = { ...prev };
        for (const pid of targets) {
          let body = next[pid] || "";
          if (mode === "shorter") {
            body = body
              .split("\n\n")
              .filter((_, i) => i !== 1)
              .join("\n\n");
            if (!body.includes("15 minutes")) {
              body = body.replace(
                /Best,/,
                "Would you have 15 minutes soon?\n\nBest,",
              );
            }
          } else if (mode === "warmer") {
            body = body.replace(
              "I'd value your read",
              "I'd genuinely value your read",
            );
          } else {
            body = body.replace(
              /Would you have 15 minutes.*/,
              "Can we lock 15 minutes this week?",
            );
          }
          next[pid] = body;
        }
        return next;
      });
      setDraftStatuses((prev) => {
        const next = { ...prev };
        for (const pid of targets) next[pid] = "edited";
        return next;
      });
      showToast(
        mode === "shorter"
          ? "Made shorter"
          : mode === "warmer"
            ? "Made warmer"
            : "Made more direct",
      );
    },
    [draftsForApproved, showToast],
  );

  const finishDrafts = useCallback(() => {
    // Auto-approve remaining pending so user isn't stuck
    setDraftStatuses((prev) => {
      const next = { ...prev };
      for (const d of draftsForApproved) {
        if (next[d.personId] === "pending") next[d.personId] = "approved";
      }
      return next;
    });
    push(agent(COPY.sendAcct));
    setStage("sendAcct");
  }, [draftsForApproved, push]);

  const confirmSendingAccount = useCallback(
    (email: string) => {
      setSendingAccount(email);
      push(user(`Confirm <${email}>`), agent(COPY.finalAuth));
      setStage("review");
    },
    [push],
  );

  const saveDrafts = useCallback(() => {
    push(agent(COPY.saved));
    setDoneAction("saved");
    setStage("done");
  }, [push]);

  const openSendConfirm = useCallback(() => {
    setSendConfirmOpen(true);
  }, []);

  const authorizeSend = useCallback(() => {
    const names = sendableIds
      .map((id) => CANDIDATES.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    const msg = COPY.sendRestate
      .replace("{count}", String(sendableIds.length))
      .replace("{names}", names);
    push(agent(msg), agent(COPY.sent));
    setSendConfirmOpen(false);
    setDoneAction("sent");
    setStage("done");
  }, [push, sendableIds]);

  const handleNl = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      push(user(t));

      const lower = t.toLowerCase();
      if (stage === "clarify") {
        if (lower.includes("exclude") || lower.includes("banker")) {
          push(agent("Understood — investment bankers stay out. Here's the plan."));
        } else {
          push(agent("Got it — using those defaults. Here's the plan."));
        }
        setStage("plan");
        return;
      }
      if (stage === "cards") {
        if (lower.includes("2023") || lower.includes("drop")) {
          setDecisions((prev) => {
            const next = { ...prev };
            for (const c of CANDIDATES) {
              if (c.lastTouch.includes("2024") && !c.lastTouch.includes("2025") && !c.lastTouch.includes("2026")) {
                // rough heuristic for "since 2023"
              }
              if (c.id === "tom") next[c.id] = "pass";
            }
            return next;
          });
          push(agent("Done — I passed on Tom Bradley (last touch Aug 2024). Others stay as you've marked them."));
        } else {
          push(agent("Noted. Keep using Include / Pass on the cards, or say when you're ready to continue."));
        }
        return;
      }
      if (stage === "confirm") {
        confirmCampaign(t);
        return;
      }
      if (stage === "drafts") {
        if (lower.includes("shorter") && lower.includes("warm")) {
          applyTone("all", "shorter");
          applyTone("all", "warmer");
          push(agent("Applied shorter and warmer across all drafts."));
        } else if (lower.includes("shorter")) {
          applyTone("all", "shorter");
          push(agent("Made all drafts shorter."));
        } else if (lower.includes("warm")) {
          applyTone("all", "warmer");
          push(agent("Made all drafts warmer."));
        } else {
          push(agent("I can make drafts shorter, warmer, or more direct — or use the buttons on each card."));
        }
        return;
      }
      push(agent("Noted. Use the primary action in the work area when you're ready to continue."));
    },
    [stage, push, confirmCampaign, applyTone],
  );

  const reset = useCallback(() => {
    if (progressTimer.current) clearTimeout(progressTimer.current);
    setStage("home");
    setObjective("");
    setMessages([]);
    setDecisions(defaultDecisions());
    setExpandedEvidence({});
    setFactDecisions(defaultFacts());
    setDraftStatuses(defaultDrafts());
    setDraftBodies(defaultBodies());
    setEditingDraft(null);
    setSendingAccount(null);
    setSendConfirmOpen(false);
    setDoneAction(null);
    setIncludedAccounts(
      Object.fromEntries(ACCOUNTS.map((a) => [a.id, a.defaultIncluded])) as Record<
        AccountId,
        boolean
      >,
    );
  }, []);

  return {
    stage,
    objective,
    setObjective,
    includedAccounts,
    toggleAccount,
    messages,
    decisions,
    setDecision,
    expandedEvidence,
    toggleEvidence,
    factDecisions,
    setFact,
    draftStatuses,
    setDraftStatus,
    draftBodies,
    updateDraftBody,
    editingDraft,
    setEditingDraft,
    sendingAccount,
    sendConfirmOpen,
    setSendConfirmOpen,
    doneAction,
    summaryOpen,
    setSummaryOpen,
    toast,
    showToast,
    includedIds,
    approvedIds,
    passedCount,
    researchForApproved,
    draftsForApproved,
    sendableIds,
    usedFactCount,
    accountLabels,
    nextDecision,
    startCampaign,
    advanceFromClarify,
    approvePlan,
    finishCards,
    confirmCampaign,
    finishResearch,
    applyTone,
    finishDrafts,
    confirmSendingAccount,
    saveDrafts,
    openSendConfirm,
    authorizeSend,
    handleNl,
    reset,
    formatRoleSummary: () => formatRoleSummary(approvedIds),
  };
}

export type CompassPrototype = ReturnType<typeof useCompassPrototype>;
