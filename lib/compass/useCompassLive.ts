"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  type CampaignDraftOut,
  type CampaignFactOut,
  type CampaignOut,
  type CampaignTrackingOut,
  type FollowUpOut,
  type MailboxAccount,
} from "@/lib/api";
import {
  COPY,
} from "./northwynScenario";
import type {
  AccountId,
  CampaignCandidateView,
  ChatMessage,
  ContactDecision,
  DraftStatus,
  FactDecision,
  PlanView,
  ResearchItemView,
} from "./types";
import {
  accountLabelForIds,
  mailboxToFixture,
  pickRecommendedSendingAccount,
  sendingOptionsForCampaign,
} from "./accountUtils";
import { candidateToFixture, planToFixture } from "./liveMappers";
import { CompassStage, NEXT_DECISION, stageFromCampaignStatus } from "./stages";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function agent(text: string): ChatMessage {
  return { id: uid("a"), role: "agent", text };
}

function user(text: string): ChatMessage {
  return { id: uid("u"), role: "user", text };
}

function factsToResearch(
  facts: CampaignFactOut[],
  candidates: CampaignCandidateView[],
): ResearchItemView[] {
  const byCand = new Map<string, CampaignFactOut[]>();
  for (const f of facts) {
    const list = byCand.get(f.candidate_id) || [];
    list.push(f);
    byCand.set(f.candidate_id, list);
  }
  const out: ResearchItemView[] = [];
  for (const [candId, list] of byCand) {
    const usable = list.filter((f) => f.status === "proposed" || f.status === "approved" || f.status === "background");
    const anyConfirmed = list.some((f) => f.identity_confirmed);
    const rejectedId = list.find((f) => !f.identity_confirmed);
    out.push({
      personId: candId,
      identityConfirmed: anyConfirmed || !rejectedId,
      identityNote: rejectedId?.quarantined_reason || (anyConfirmed ? "Identity matched" : "No public hits"),
      facts: usable
        .filter((f) => f.identity_confirmed)
        .map((f) => ({
          claim: f.claim,
          source: String((f.sources?.[0] as { url?: string })?.url || "source"),
          confidence: (f.confidence as "High" | "Medium" | "Low") || "Medium",
        })),
      recommendedUse: usable[0]?.recommended_use || "Relationship history only",
      special: !anyConfirmed && rejectedId ? "identity_uncertain" : undefined,
      specialMessage: rejectedId?.quarantined_reason || undefined,
    });
  }
  // Ensure every included candidate has a card
  for (const c of candidates) {
    if (!byCand.has(c.id)) {
      out.push({
        personId: c.id,
        identityConfirmed: true,
        identityNote: "No public scan results",
        facts: [],
        recommendedUse: "Personalize from relationship history only",
      });
    }
  }
  return out;
}

export function useCompassLive() {
  const [objective, setObjective] = useState("");
  const [campaign, setCampaign] = useState<CampaignOut | null>(null);
  const [liveCandidates, setLiveCandidates] = useState<CampaignCandidateView[]>([]);
  const [planView, setPlanView] = useState<PlanView | null>(null);
  const [researchProgress, setResearchProgress] = useState("");
  const [busy, setBusy] = useState(false);
  const [stageOverride, setStageOverride] = useState<CompassStage | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [decisions, setDecisions] = useState<Record<string, ContactDecision>>({});
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [factDecisions, setFactDecisions] = useState<Record<string, FactDecision>>({});
  const [liveResearch, setLiveResearch] = useState<ResearchItemView[]>([]);
  const [rawFacts, setRawFacts] = useState<CampaignFactOut[]>([]);
  const [liveDrafts, setLiveDrafts] = useState<CampaignDraftOut[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, DraftStatus>>({});
  const [draftBodies, setDraftBodies] = useState<Record<string, string>>({});
  const [editingDraft, setEditingDraft] = useState<string | null>(null);
  const [sendingAccount, setSendingAccount] = useState<string | null>(null);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [sendPreviewEmails, setSendPreviewEmails] = useState<string[]>([]);
  const [sendPreviewNames, setSendPreviewNames] = useState<string[]>([]);
  const [researchMode, setResearchMode] = useState("relationship_only");
  const [preflightAttention, setPreflightAttention] = useState<{
    missing_email: Array<{ id: string; name: string }>;
    recently_messaged: Array<{ id: string; name: string }>;
    call_better: Array<{ id: string; name: string }>;
    needs_review: Array<{ id: string; name: string }>;
    duplicates: Array<{ id: string; name: string }>;
  } | null>(null);
  const [strategyNotes, setStrategyNotes] = useState("");
  const [tracking, setTracking] = useState<CampaignTrackingOut | null>(null);
  const [followUps, setFollowUps] = useState<FollowUpOut[]>([]);
  const [gate9ConfirmId, setGate9ConfirmId] = useState<string | null>(null);
  const [campaignList, setCampaignList] = useState<
    Array<{
      id: string;
      title: string | null;
      status: string;
      objective_raw?: string;
      sent?: number;
      replied?: number;
    }>
  >([]);
  const [pendingNl, setPendingNl] = useState<{ instruction: string; restatement: string } | null>(
    null,
  );
  const [doneAction, setDoneAction] = useState<"saved" | "sent" | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [mailboxAccounts, setMailboxAccounts] = useState<MailboxAccount[]>([]);
  const [includedAccounts, setIncludedAccounts] = useState<Record<AccountId, boolean>>(
    {} as Record<AccountId, boolean>,
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyLiveAccountDefaults = useCallback(
    (rows: { id: string; default_included: boolean; connected?: boolean }[]) => {
      setIncludedAccounts((prev) => {
        const next = { ...prev };
        for (const row of rows) {
          const id = row.id as AccountId;
          next[id] = row.connected !== false ? row.default_included : false;
        }
        return next;
      });
    },
    [],
  );

  const toggleAccount = useCallback((id: AccountId) => {
    setIncludedAccounts((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .listAccounts()
      .then((rows) => {
        if (cancelled) return;
        setMailboxAccounts(rows);
        applyLiveAccountDefaults(rows);
      })
      .catch(() => {
        if (!cancelled) setMailboxAccounts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [applyLiveAccountDefaults]);

  const showToast = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const push = useCallback((...msgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...msgs]);
  }, []);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPoll(), [stopPoll]);

  const syncFromCampaign = useCallback((c: CampaignOut) => {
    setCampaign(c);
    setPlanView(planToFixture(c));
    if (c.sending_account_id) {
      const acct = mailboxAccounts.find((a) => a.id === c.sending_account_id);
      setSendingAccount(acct?.email || c.sending_account_id);
    }
  }, [mailboxAccounts]);

  const loadCandidates = useCallback(async (campaignId: string) => {
    const rows = await api.listCampaignCandidates(campaignId);
    const fixtures = rows.map(candidateToFixture);
    setLiveCandidates(fixtures);
    const next: Record<string, ContactDecision> = {};
    for (const r of rows) {
      next[r.id] =
        r.decision === "include" || r.decision === "pass" || r.decision === "unsure"
          ? r.decision
          : "include";
    }
    setDecisions(next);
    return fixtures;
  }, []);

  const loadFacts = useCallback(async (campaignId: string, cands: CampaignCandidateView[]) => {
    const facts = await api.listCampaignFacts(campaignId);
    setRawFacts(facts);
    const research = factsToResearch(facts, cands);
    setLiveResearch(research);
    const fd: Record<string, FactDecision> = {};
    for (const r of research) {
      fd[r.personId] = r.facts.length && r.identityConfirmed ? "use" : "dont_use";
    }
    setFactDecisions(fd);
    return research;
  }, []);

  const loadDrafts = useCallback(async (campaignId: string) => {
    const drafts = await api.listCampaignDrafts(campaignId);
    setLiveDrafts(drafts);
    const bodies: Record<string, string> = {};
    const statuses: Record<string, DraftStatus> = {};
    for (const d of drafts) {
      bodies[d.candidate_id] = d.body;
      statuses[d.candidate_id] =
        d.status === "approved" ? "approved" : d.status === "edited" ? "edited" : "pending";
    }
    setDraftBodies(bodies);
    setDraftStatuses(statuses);
    return drafts;
  }, []);

  const startCampaign = useCallback(
    async (obj: string) => {
      const trimmed = obj.trim();
      if (!trimmed) {
        showToast("Enter an objective to get started");
        return;
      }
      setObjective(trimmed);
      setBusy(true);
      setPendingNl(null);
      setDoneAction(null);
      try {
        const accountIds = (Object.keys(includedAccounts) as AccountId[]).filter((id) => {
          if (!includedAccounts[id]) return false;
          const acct = mailboxAccounts.find((a) => a.id === id);
          return !acct || acct.connected;
        });
        if (!accountIds.length) {
          showToast("Select at least one connected mailbox on Contacts");
          setBusy(false);
          return;
        }
        const c = await api.createCampaign(trimmed, accountIds);
        syncFromCampaign(c);
        const parsed = c.objective_parsed || {};
        const questions = (parsed.clarifying_questions as string[]) || [];
        const restatement =
          (parsed.restatement as string) || "Here's how I understood your objective.";
        const msgs: ChatMessage[] = [user(trimmed), agent(restatement)];
        if (c.status === "clarifying" && questions.length > 0) {
          msgs.push(
            agent(
              "A few quick checks:\n" +
                questions.map((q, i) => `${i + 1}. ${q}`).join("\n") +
                "\n\nReply in the conversation, or use defaults.",
            ),
          );
          setStageOverride("clarify");
        } else {
          msgs.push(agent("Here's the search plan — approve to start, or tell me what to change."));
          setStageOverride("plan");
        }
        setMessages(msgs);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Failed to create campaign");
      } finally {
        setBusy(false);
      }
    },
    [includedAccounts, mailboxAccounts, showToast, syncFromCampaign],
  );

  const advanceFromClarify = useCallback(
    async (reply: string) => {
      if (!campaign) return;
      setBusy(true);
      try {
        const lower = reply.toLowerCase();
        const useDefaults = lower.includes("default") || reply === COPY.useDefaults;
        let updated: CampaignOut;
        if (reply === COPY.excludeBankers || (lower.includes("banker") && lower.includes("exclude"))) {
          updated = await api.clarifyCampaign(campaign.id, {
            answer: "Exclude investment bankers",
            use_defaults: false,
          });
          updated = await api.revisePlan(campaign.id, "exclude bankers");
        } else if (useDefaults) {
          updated = await api.clarifyCampaign(campaign.id, { use_defaults: true });
        } else {
          updated = await api.clarifyCampaign(campaign.id, { answer: reply });
        }
        syncFromCampaign(updated);
        push(user(reply), agent("Here's the search plan — approve to start, or tell me what to change."));
        setStageOverride("plan");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Clarify failed");
      } finally {
        setBusy(false);
      }
    },
    [campaign, push, showToast, syncFromCampaign],
  );

  const approvePlan = useCallback(async () => {
    if (!campaign) return;
    setBusy(true);
    try {
      await api.approvePlan(campaign.id);
      push(user("Approve & start searching"), agent("Reviewing your relationship history…"));
      setStageOverride("progress");
      setResearchProgress("Starting…");
      await api.startCampaignResearch(campaign.id);
      stopPoll();
      pollRef.current = setInterval(async () => {
        try {
          const st = await api.campaignResearchStatus(campaign.id);
          setResearchProgress(st.progress || st.status);
          if (st.campaign) syncFromCampaign(st.campaign);
          if (st.status === "completed") {
            stopPoll();
            await loadCandidates(campaign.id);
            push(
              agent(
                "Here are the strongest candidates. Include, pass, or tell me how to filter — I'll restate before applying.",
              ),
            );
            setStageOverride("cards");
            setBusy(false);
          } else if (st.status === "failed") {
            stopPoll();
            push(agent(st.error || "Research failed."));
            setStageOverride("plan");
            setBusy(false);
          }
        } catch (err) {
          stopPoll();
          showToast(err instanceof Error ? err.message : "Research status failed");
          setBusy(false);
        }
      }, 1200);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Approve failed");
      setBusy(false);
    }
  }, [campaign, loadCandidates, push, showToast, stopPoll, syncFromCampaign]);

  const setDecision = useCallback(
    async (id: string, d: ContactDecision) => {
      setDecisions((prev) => ({ ...prev, [id]: d }));
      if (!campaign || !d) return;
      try {
        await api.setCampaignDecisions(campaign.id, [{ candidate_id: id, decision: d }]);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Decision failed");
      }
    },
    [campaign, showToast],
  );

  const toggleEvidence = useCallback((id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const finishCards = useCallback(() => {
    const approved = liveCandidates.filter((c) => decisions[c.id] === "include").length;
    push(
      agent(
        `You approved ${approved}. Next: message notes and research mode, then I'll scan public context (Gate 3).`,
      ),
    );
    setStageOverride("confirm");
  }, [decisions, liveCandidates, push]);

  const batchApproveHighConfidence = useCallback(async () => {
    if (!campaign) return;
    const high = liveCandidates.filter((c) => c.confidence === "High");
    if (!high.length) {
      showToast("No high-confidence candidates to batch-approve");
      return;
    }
    const items = high.map((c) => ({ candidate_id: c.id, decision: "include" as const }));
    setDecisions((prev) => {
      const next = { ...prev };
      for (const c of high) next[c.id] = "include";
      return next;
    });
    try {
      await api.setCampaignDecisions(campaign.id, items);
      push(agent(`Included ${high.length} high-confidence contacts.`));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Batch approve failed");
    }
  }, [campaign, liveCandidates, push, showToast]);

  const confirmCampaign = useCallback(
    async (notes: string) => {
      if (!campaign) return;
      setBusy(true);
      try {
        const c = await api.confirmCampaign(campaign.id, {
          notes: notes || strategyNotes,
          ask: "Would you have 15 minutes soon?",
          research_mode: researchMode,
        });
        syncFromCampaign(c);
        push(user(notes || "Confirm strategy"), agent("Running external research…"));
        setStageOverride("progress");
        setResearchProgress("External research…");
        await api.startExternalResearch(campaign.id);
        stopPoll();
        pollRef.current = setInterval(async () => {
          try {
            const st = await api.externalResearchStatus(campaign.id);
            setResearchProgress(st.progress || st.status);
            if (st.campaign) syncFromCampaign(st.campaign);
            if (st.status === "completed") {
              stopPoll();
              const cands = liveCandidates.length
                ? liveCandidates
                : await loadCandidates(campaign.id);
              await loadFacts(campaign.id, cands);
              push(agent("External context ready for review (Gate 3). Approve, background, or reject each fact."));
              setStageOverride("research");
              setBusy(false);
            } else if (st.status === "failed") {
              stopPoll();
              push(agent(st.progress || "External research failed — continuing with relationship history."));
              const cands = liveCandidates.length
                ? liveCandidates
                : await loadCandidates(campaign.id);
              await loadFacts(campaign.id, cands);
              setStageOverride("research");
              setBusy(false);
            }
          } catch (err) {
            stopPoll();
            showToast(err instanceof Error ? err.message : "External research failed");
            setBusy(false);
          }
        }, 1000);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Confirm failed");
        setBusy(false);
      }
    },
    [
      campaign,
      liveCandidates,
      loadCandidates,
      loadFacts,
      push,
      researchMode,
      showToast,
      stopPoll,
      strategyNotes,
      syncFromCampaign,
    ],
  );

  const setFact = useCallback(
    async (personId: string, d: FactDecision) => {
      setFactDecisions((prev) => ({ ...prev, [personId]: d }));
      if (!campaign) return;
      const map: Record<string, string> = {
        use: "approved",
        background: "background",
        dont_use: "rejected",
      };
      const decision = d ? map[d] : null;
      if (!decision) return;
      const items = rawFacts
        .filter((f) => f.candidate_id === personId && f.identity_confirmed)
        .map((f) => ({ fact_id: f.id, decision }));
      if (!items.length) return;
      try {
        await api.setFactDecisions(campaign.id, items);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Fact decision failed");
      }
    },
    [campaign, rawFacts, showToast],
  );

  const finishResearch = useCallback(async () => {
    if (!campaign) return;
    setBusy(true);
    try {
      push(agent("Drafting personalized messages…"));
      await api.generateCampaignDrafts(campaign.id);
      await loadDrafts(campaign.id);
      push(agent("Drafts ready (Gate 4). Approve or edit, then confirm the sending account."));
      setStageOverride("drafts");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Draft generation failed");
    } finally {
      setBusy(false);
    }
  }, [campaign, loadDrafts, push, showToast]);

  const setDraftStatus = useCallback(
    async (candidateId: string, s: DraftStatus) => {
      setDraftStatuses((prev) => ({ ...prev, [candidateId]: s }));
      if (!campaign || s !== "approved") return;
      const draft = liveDrafts.find((d) => d.candidate_id === candidateId);
      if (!draft) return;
      try {
        await api.approveCampaignDraft(campaign.id, draft.id);
        await loadDrafts(campaign.id);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Approve draft failed");
      }
    },
    [campaign, liveDrafts, loadDrafts, showToast],
  );

  const updateDraftBody = useCallback(
    async (candidateId: string, body: string) => {
      setDraftBodies((prev) => ({ ...prev, [candidateId]: body }));
      setDraftStatuses((prev) => ({ ...prev, [candidateId]: "edited" }));
      if (!campaign) return;
      const draft = liveDrafts.find((d) => d.candidate_id === candidateId);
      if (!draft) return;
      try {
        await api.patchCampaignDraft(campaign.id, draft.id, { body });
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Save draft failed");
      }
    },
    [campaign, liveDrafts, showToast],
  );

  const applyTone = useCallback(
    async (id: string | "all", mode: "shorter" | "warmer" | "direct" | "formal") => {
      if (!campaign) return;
      try {
        const draft = id === "all" ? null : liveDrafts.find((d) => d.candidate_id === id);
        await api.applyCampaignTone(campaign.id, {
          mode,
          scope: id === "all" ? "all" : "one",
          draft_id: draft?.id,
        });
        await loadDrafts(campaign.id);
        showToast(`Applied ${mode}`);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Tone failed");
      }
    },
    [campaign, liveDrafts, loadDrafts, showToast],
  );

  const regenerateDraft = useCallback(
    async (candidateId: string) => {
      if (!campaign) return;
      const draft = liveDrafts.find((d) => d.candidate_id === candidateId);
      if (!draft) return;
      try {
        await api.regenerateCampaignDraft(campaign.id, draft.id);
        await loadDrafts(campaign.id);
        showToast("Regenerated");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Regenerate failed");
      }
    },
    [campaign, liveDrafts, loadDrafts, showToast],
  );

  const setDraftVariant = useCallback(
    async (candidateId: string, variant: "call_script" | "linkedin" | "email") => {
      if (!campaign) return;
      const draft = liveDrafts.find((d) => d.candidate_id === candidateId);
      if (!draft) return;
      try {
        await api.setCampaignDraftVariant(campaign.id, draft.id, variant);
        await loadDrafts(campaign.id);
        showToast(`Switched to ${variant}`);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Variant failed");
      }
    },
    [campaign, liveDrafts, loadDrafts, showToast],
  );

  const changeDraftAsk = useCallback(
    async (candidateId: string) => {
      if (!campaign) return;
      const draft = liveDrafts.find((d) => d.candidate_id === candidateId);
      if (!draft) return;
      const ask = window.prompt("New ask", draft.ask || "Would you have 15 minutes soon?");
      if (!ask) return;
      try {
        await api.changeCampaignDraftAsk(campaign.id, draft.id, ask);
        await loadDrafts(campaign.id);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Change ask failed");
      }
    },
    [campaign, liveDrafts, loadDrafts, showToast],
  );

  const removePublicRefs = useCallback(
    async (candidateId: string) => {
      if (!campaign) return;
      const draft = liveDrafts.find((d) => d.candidate_id === candidateId);
      if (!draft) return;
      try {
        await api.removeCampaignDraftPublicRefs(campaign.id, draft.id);
        await loadDrafts(campaign.id);
        showToast("Public refs removed");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Remove public refs failed");
      }
    },
    [campaign, liveDrafts, loadDrafts, showToast],
  );

  const loadTracking = useCallback(async (campaignId: string) => {
    try {
      const dash = await api.getCampaignTracking(campaignId);
      setTracking(dash);
    } catch {
      setTracking(null);
    }
    try {
      const fus = await api.listFollowUps(campaignId);
      setFollowUps(fus);
    } catch {
      setFollowUps([]);
    }
  }, []);

  const enterTracking = useCallback(
    async (campaignId: string) => {
      setStageOverride("tracking");
      try {
        await api.refreshCampaignTracking(campaignId);
      } catch {
        /* tracking flag may be off */
      }
      await loadTracking(campaignId);
    },
    [loadTracking],
  );

  const finishDrafts = useCallback(async () => {
    if (!campaign) return;
    // Auto-approve pending
    for (const d of liveDrafts) {
      if (draftStatuses[d.candidate_id] === "pending") {
        try {
          await api.approveCampaignDraft(campaign.id, d.id);
        } catch {
          /* continue */
        }
      }
    }
    await loadDrafts(campaign.id);
    push(agent("Confirm the sending account (Gate 5)."));
    setStageOverride("sendAcct");
  }, [campaign, draftStatuses, liveDrafts, loadDrafts, push]);

  const confirmSendingAccount = useCallback(
    async (email: string) => {
      if (!campaign) return;
      const acct = mailboxAccounts.find(
        (a) => a.email.toLowerCase() === email.toLowerCase(),
      );
      const accountId = acct?.id || campaign.account_ids?.[0];
      if (!accountId) {
        showToast("No connected sending account — connect a mailbox on Contacts");
        return;
      }
      try {
        const c = await api.setSendingAccount(campaign.id, {
          account_id: accountId,
          careers_justification: accountId === "careers" ? "Explicit campaign choice" : undefined,
        });
        syncFromCampaign(c);
        setSendingAccount(acct?.email || email);
        push(user(`Confirm <${email}>`), agent("Ready for final review — save drafts or authorize send."));
        setStageOverride("review");
        try {
          const pf = await api.campaignPreflight(campaign.id);
          setPreflightAttention(pf.attention);
        } catch {
          setPreflightAttention(null);
        }
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Sending account failed");
      }
    },
    [campaign, mailboxAccounts, push, showToast, syncFromCampaign],
  );

  const saveDrafts = useCallback(async () => {
    if (!campaign) return;
    try {
      const res = await api.saveDraftsToMailbox(campaign.id);
      push(agent(`Saved ${res.results?.length || 0} draft(s) to the mailbox.`));
      setDoneAction("saved");
      await enterTracking(campaign.id);
      showToast("Drafts saved — tracking");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed — confirm sending account first");
    }
  }, [campaign, enterTracking, push, showToast]);

  const scheduleSend = useCallback(async () => {
    if (!campaign) return;
    try {
      const when = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await api.scheduleCampaign(campaign.id, when);
      push(agent(`Scheduled approved drafts for ${new Date(when).toLocaleString()}.`));
      showToast("Scheduled for tomorrow");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Schedule failed");
    }
  }, [campaign, push, showToast]);

  const openSendConfirm = useCallback(async () => {
    if (!campaign) return;
    try {
      const preview = await api.sendPreview(campaign.id);
      setSendPreviewEmails(preview.recipient_emails);
      setSendPreviewNames(preview.recipients.map((r) => r.name || r.email));
      setSendConfirmOpen(true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Send preview failed");
    }
  }, [campaign, showToast]);

  const authorizeSend = useCallback(async () => {
    if (!campaign) return;
    try {
      const res = await api.authorizeCampaignSend(campaign.id, sendPreviewEmails);
      const failed = (res.results || []).filter((r) => r.status === "failed");
      push(
        agent(
          failed.length
            ? `Send finished with ${failed.length} failure(s).`
            : "Send authorized — messages dispatched.",
        ),
      );
      setSendConfirmOpen(false);
      setDoneAction("sent");
      await enterTracking(campaign.id);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Send blocked — check FEATURE_COMPASS_SEND");
    }
  }, [campaign, enterTracking, push, sendPreviewEmails, showToast]);

  const refreshTracking = useCallback(async () => {
    if (!campaign) return;
    try {
      const dash = await api.refreshCampaignTracking(campaign.id);
      setTracking(dash);
      showToast("Tracking refreshed");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Tracking refresh failed");
    }
  }, [campaign, showToast]);

  const proposeFollowUps = useCallback(async () => {
    if (!campaign) return;
    try {
      const res = await api.proposeFollowUps(campaign.id);
      setFollowUps(await api.listFollowUps(campaign.id));
      push(agent(`Proposed ${res.items?.length || 0} follow-up(s) — nothing sent (Gate 9).`));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Follow-ups disabled or failed");
    }
  }, [campaign, push, showToast]);

  const approveFollowUp = useCallback(
    async (id: string) => {
      if (!campaign) return;
      try {
        await api.approveFollowUp(campaign.id, id);
        setFollowUps(await api.listFollowUps(campaign.id));
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Approve failed");
      }
    },
    [campaign, showToast],
  );

  const rejectFollowUp = useCallback(
    async (id: string) => {
      if (!campaign) return;
      try {
        await api.rejectFollowUp(campaign.id, id);
        setFollowUps(await api.listFollowUps(campaign.id));
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Reject failed");
      }
    },
    [campaign, showToast],
  );

  const sendFollowUp = useCallback(
    async (id: string, email: string) => {
      if (!campaign) return;
      try {
        await api.sendFollowUp(campaign.id, id, email);
        setGate9ConfirmId(null);
        setFollowUps(await api.listFollowUps(campaign.id));
        push(agent(`Gate 9: follow-up sent to ${email}.`));
        showToast("Follow-up sent");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Gate 9 send blocked");
      }
    },
    [campaign, push, showToast],
  );

  const openCampaignsList = useCallback(async () => {
    setBusy(true);
    try {
      const rows = await api.listCampaignsSummary();
      setCampaignList(rows);
      setStageOverride("campaigns");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not load campaigns");
    } finally {
      setBusy(false);
    }
  }, [showToast]);

  const openCampaignFromList = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        const c = await api.getCampaign(id);
        syncFromCampaign(c);
        setObjective(c.objective_raw || "");
        const stage = stageFromCampaignStatus(c.status);
        setStageOverride(stage);
        let cands = liveCandidates;
        if (["cards", "confirm", "research", "drafts", "sendAcct", "review", "tracking"].includes(stage)) {
          cands = await loadCandidates(id);
        }
        if (["research", "drafts", "sendAcct", "review", "tracking"].includes(stage)) {
          await loadFacts(id, cands);
        }
        if (["drafts", "sendAcct", "review", "tracking"].includes(stage)) {
          await loadDrafts(id);
        }
        if (stage === "tracking") {
          await enterTracking(id);
        }
        push(agent(`Resumed at ${stage}: ${c.title || c.objective_raw.slice(0, 60)}`));
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Open campaign failed");
      } finally {
        setBusy(false);
      }
    },
    [enterTracking, liveCandidates, loadCandidates, loadDrafts, loadFacts, push, showToast, syncFromCampaign],
  );
  const handleNl = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || !campaign) return;
      const stage = stageOverride || "home";
      const lower = t.toLowerCase();

      if (pendingNl && (lower === "yes" || lower === "confirm" || lower === "apply")) {
        try {
          const result = await api.applyNlOp(campaign.id, pendingNl.instruction);
          push(user(t), agent(result.restatement || "Applied."));
          setPendingNl(null);
          await loadCandidates(campaign.id);
        } catch (e) {
          showToast(e instanceof Error ? e.message : "Apply failed");
        }
        return;
      }
      if (pendingNl && (lower === "no" || lower === "cancel")) {
        push(user(t), agent("Cancelled — no changes made."));
        setPendingNl(null);
        return;
      }

      if (stage === "clarify") {
        await advanceFromClarify(t);
        return;
      }
      if (stage === "plan") {
        try {
          const c = await api.revisePlan(campaign.id, t);
          syncFromCampaign(c);
          push(user(t), agent("Updated the plan. Approve when ready."));
        } catch (e) {
          showToast(e instanceof Error ? e.message : "Revise failed");
        }
        return;
      }
      if (stage === "cards") {
        try {
          const preview = await api.previewNlOp(campaign.id, t);
          push(
            user(t),
            agent(`${preview.restatement}\n\nReply **yes** to apply, or **no** to cancel.`),
          );
          setPendingNl({ instruction: t, restatement: preview.restatement });
        } catch (e) {
          showToast(e instanceof Error ? e.message : "NL preview failed");
        }
        return;
      }
      if (stage === "confirm") {
        await confirmCampaign(t);
        return;
      }
      push(user(t), agent("Noted."));
    },
    [
      advanceFromClarify,
      campaign,
      confirmCampaign,
      loadCandidates,
      pendingNl,
      push,
      showToast,
      stageOverride,
      syncFromCampaign,
    ],
  );

  const reset = useCallback(() => {
    stopPoll();
    setCampaign(null);
    setLiveCandidates([]);
    setPlanView(null);
    setResearchProgress("");
    setPendingNl(null);
    setStageOverride(null);
    setMessages([]);
    setDecisions({});
    setExpandedEvidence({});
    setFactDecisions({});
    setLiveResearch([]);
    setRawFacts([]);
    setLiveDrafts([]);
    setDraftStatuses({});
    setDraftBodies({});
    setSendingAccount(null);
    setSendConfirmOpen(false);
    setDoneAction(null);
    setTracking(null);
    setFollowUps([]);
    setGate9ConfirmId(null);
    setCampaignList([]);
    if (mailboxAccounts.length) {
      applyLiveAccountDefaults(mailboxAccounts);
    } else {
      setIncludedAccounts({} as Record<AccountId, boolean>);
    }
    setObjective("");
    setSummaryOpen(true);
    setResearchMode("relationship_only");
    setStrategyNotes("");
  }, [applyLiveAccountDefaults, mailboxAccounts, stopPoll]);

  const stage: CompassStage = stageOverride || "home";
  const approvedIds = useMemo(
    () => liveCandidates.filter((c) => decisions[c.id] === "include").map((c) => c.id),
    [liveCandidates, decisions],
  );
  const passedCount = useMemo(
    () => liveCandidates.filter((c) => decisions[c.id] === "pass").length,
    [liveCandidates, decisions],
  );
  const accountLabels = useMemo(() => {
    const ids = campaign?.account_ids?.length
      ? campaign.account_ids
      : (Object.keys(includedAccounts) as AccountId[]).filter((id) => includedAccounts[id]);
    if (mailboxAccounts.length) {
      return accountLabelForIds(mailboxAccounts, ids);
    }
    return ids.join(" + ");
  }, [campaign, mailboxAccounts, includedAccounts]);

  const sendingAccountOptions = useMemo(
    () => sendingOptionsForCampaign(mailboxAccounts, campaign?.account_ids),
    [mailboxAccounts, campaign?.account_ids],
  );

  const recommendedSendingAccount = useMemo(
    () => pickRecommendedSendingAccount(mailboxAccounts, campaign?.account_ids),
    [mailboxAccounts, campaign?.account_ids],
  );

  const usedFactCount = useMemo(
    () => Object.values(factDecisions).filter((d) => d === "use").length,
    [factDecisions],
  );

  const draftsForApproved = useMemo(
    () =>
      liveDrafts
        .filter((d) => approvedIds.includes(d.candidate_id))
        .map((d) => ({
          personId: d.candidate_id,
          subject: d.subject || "",
          body: d.body,
          personalization: [],
          ask: d.ask || "",
        })),
    [liveDrafts, approvedIds],
  );

  const sendableIds = useMemo(() => {
    return approvedIds.filter((id) => {
      const c = liveCandidates.find((x) => x.id === id);
      if (!c?.email) return false;
      const st = draftStatuses[id];
      return st === "approved" || st === "edited";
    });
  }, [approvedIds, draftStatuses, liveCandidates]);

  const personNameFor = useCallback(
    (id: string) => liveCandidates.find((c) => c.id === id)?.name || id,
    [liveCandidates],
  );

  return {
    isLive: true as const,
    stage,
    objective: campaign?.objective_raw || objective,
    setObjective,
    includedAccounts,
    toggleAccount,
    applyLiveAccountDefaults,
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
    includedIds: approvedIds,
    approvedIds,
    passedCount,
    researchForApproved: liveResearch.filter((r) => approvedIds.includes(r.personId)),
    draftsForApproved,
    sendableIds,
    usedFactCount,
    accountLabels,
    nextDecision: NEXT_DECISION[stage],
    startCampaign,
    advanceFromClarify,
    approvePlan,
    finishCards,
    batchApproveHighConfidence,
    confirmCampaign,
    finishResearch,
    applyTone,
    regenerateDraft,
    setDraftVariant,
    changeDraftAsk,
    removePublicRefs,
    finishDrafts,
    confirmSendingAccount,
    saveDrafts,
    scheduleSend,
    openSendConfirm,
    authorizeSend,
    refreshTracking,
    proposeFollowUps,
    approveFollowUp,
    rejectFollowUp,
    sendFollowUp,
    openCampaignsList,
    openCampaignFromList,
    tracking,
    followUps,
    gate9ConfirmId,
    setGate9ConfirmId,
    campaignList,
    handleNl,
    reset,
    formatRoleSummary: () => {
      const roles: Record<string, number> = {};
      for (const c of liveCandidates) {
        if (decisions[c.id] !== "include") continue;
        roles[c.likelyRole] = (roles[c.likelyRole] || 0) + 1;
      }
      const parts = Object.entries(roles).map(([k, n]) => `${n} ${k}`);
      return parts.length
        ? `${approvedIds.length} approved: ${parts.join(", ")}`
        : `${approvedIds.length} approved`;
    },
    planView,
    researchProgress,
    busy,
    candidatesForCards: liveCandidates,
    campaignId: campaign?.id ?? null,
    liveResearch,
    liveDrafts,
    researchMode,
    setResearchMode,
    preflightAttention,
    strategyNotes,
    setStrategyNotes,
    personNameFor,
    sendPreviewNames,
    mailboxAccounts,
    mailboxFixtures: mailboxAccounts.map(mailboxToFixture),
    sendingAccountOptions,
    recommendedSendingAccount,
  };
}

export type CompassController = ReturnType<typeof useCompassLive>;
