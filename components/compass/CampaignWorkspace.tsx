"use client";

import type { ReactNode } from "react";
import { COPY } from "@/lib/compass/northwynScenario";
import type { CompassController } from "@/lib/compass/useCompassLive";
import { ConversationRail } from "./ConversationRail";
import { CampaignSummary } from "./CampaignSummary";
import { PlanCard } from "./PlanCard";
import { EvidenceCard } from "./EvidenceCard";
import { ResearchCard } from "./ResearchCard";
import { DraftCard } from "./DraftCard";
import { FinalReview } from "./FinalReview";
import { TrackingDashboard } from "./TrackingDashboard";
import { CampaignsList } from "./CampaignsList";
import { StageStrip } from "./StageStrip";

type Props = {
  compass: CompassController;
};

function provenanceChips(provenance: Record<string, unknown> | undefined) {
  const chips: { kind: "private" | "public"; label: string; href?: string }[] = [];
  if (!provenance) return chips;
  const raw = (provenance.chips as Array<{ kind?: string; label?: string; href?: string }>) || [];
  for (const c of raw) {
    chips.push({
      kind: c.kind === "public" ? "public" : "private",
      label: c.label || "Evidence",
      href: c.href,
    });
  }
  return chips;
}

export function CampaignWorkspace({ compass }: Props) {
  const {
    stage,
    objective,
    messages,
    decisions,
    setDecision,
    expandedEvidence,
    toggleEvidence,
    suppressThread,
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
    approvedIds,
    researchForApproved,
    draftsForApproved,
    sendableIds,
    usedFactCount,
    accountLabels,
    nextDecision,
    advanceFromClarify,
    approvePlan,
    reviseCandidateLimit,
    finishCards,
    batchApproveHighConfidence,
    confirmCampaign,
    finishResearch,
    applyTone,
    finishDrafts,
    confirmSendingAccount,
    saveDrafts,
    scheduleSend,
    openSendConfirm,
    authorizeSend,
    handleNl,
    reset,
    goBack,
    canGoBack,
    showToast,
    formatRoleSummary,
    planView,
    researchProgress,
    busy,
    candidatesForCards,
    personNameFor,
    sendPreviewNames,
    liveDrafts,
    regenerateDraft,
    setDraftVariant,
    changeDraftAsk,
    removePublicRefs,
    researchMode,
    setResearchMode,
    preflightAttention,
    strategyNotes,
    setStrategyNotes,
    sendingAccountOptions,
    recommendedSendingAccount,
    tracking,
    followUps,
    gate9ConfirmId,
    setGate9ConfirmId,
    refreshTracking,
    proposeFollowUps,
    approveFollowUp,
    rejectFollowUp,
    sendFollowUp,
    campaignList,
    openCampaignFromList,
  } = compass;

  const cardCandidates = candidatesForCards || [];
  const recommendedSend =
    recommendedSendingAccount?.email ||
    sendingAccountOptions?.[0]?.email ||
    sendingAccount ||
    "";
  const sendOptions = sendingAccountOptions || [];
  const draftedCount = draftsForApproved.filter(
    (d) => draftStatuses[d.personId] === "approved" || draftStatuses[d.personId] === "edited",
  ).length;

  let work: ReactNode = null;

  if (stage === "clarify") {
    work = (
      <div className="compass-work-block">
        <h2 className="compass-work-title">Confirm the search scope</h2>
        <p className="compass-muted">
          Reply in the conversation, or use a quick action below.
        </p>
        <div className="compass-work-actions">
          <button
            type="button"
            className="button primary"
            onClick={() => advanceFromClarify(COPY.useDefaults)}
            disabled={busy}
          >
            Use your defaults — start
          </button>
          <button
            type="button"
            className="button"
            onClick={() => advanceFromClarify(COPY.excludeBankers)}
            disabled={busy}
          >
            Exclude investment bankers
          </button>
        </div>
      </div>
    );
  } else if (stage === "plan") {
    work = (
      <PlanCard
        onApprove={approvePlan}
        onCandidateLimitChange={reviseCandidateLimit}
        plan={planView}
        busy={busy}
      />
    );
  } else if (stage === "progress") {
    work = (
      <div className="compass-work-block compass-progress">
        <h2 className="compass-work-title">
          {researchProgress?.toLowerCase().includes("external")
            ? "External research…"
            : "Reviewing relationships…"}
        </h2>
        <div className="compass-progress-bar-track">
          <div className="compass-progress-bar-fill" />
        </div>
        <p className="compass-muted">
          {researchProgress ||
            "Reviewing relationship history… narrowing to the strongest candidates."}
        </p>
      </div>
    );
  } else if (stage === "cards") {
    work = (
      <div className="compass-work-block">
        <h2 className="compass-work-title">Proposed contacts</h2>
        <p className="compass-muted">
          Strongest first. Decisions are for this campaign only. Natural-language filters restate
          before applying.
        </p>
        <div className="compass-card-stack">
          {cardCandidates.map((c) => (
            <EvidenceCard
              key={c.id}
              candidate={c}
              decision={decisions[c.id]}
              evidenceOpen={!!expandedEvidence[c.id]}
              onDecision={(d) => setDecision(c.id, d)}
              onToggleEvidence={() => toggleEvidence(c.id)}
              onIgnoreThread={(subject, evidenceId) => suppressThread(subject, evidenceId)}
            />
          ))}
        </div>
        {cardCandidates.length === 0 ? (
          <p className="compass-muted">
            No candidates with citable evidence yet. Sync a mailbox on Contacts, then revise and
            re-approve the plan.
          </p>
        ) : null}
        <div className="compass-work-actions sticky-actions">
          <button type="button" className="button secondary" onClick={batchApproveHighConfidence}>
            Include all high-confidence
          </button>
          <button type="button" className="button primary" onClick={finishCards}>
            Continue with {approvedIds.length} included
          </button>
        </div>
      </div>
    );
  } else if (stage === "confirm") {
    work = (
      <div className="compass-work-block">
        <h2 className="compass-work-title">Campaign confirmation</h2>
        <p>{formatRoleSummary()}</p>
        <p className="compass-muted">Message notes (optional — rough is fine):</p>
        <textarea
          id="compass-msg-notes"
          className="compass-objective-input"
          rows={4}
          defaultValue={strategyNotes || ""}
          onChange={(e) => setStrategyNotes(e.target.value)}
        />
        <div style={{ marginTop: "0.75rem" }}>
          <label className="compass-muted" htmlFor="compass-research-mode">
            Research mode
          </label>
          <select
            id="compass-research-mode"
            className="compass-objective-input"
            value={researchMode}
            onChange={(e) => setResearchMode(e.target.value)}
          >
            <option value="relationship_only">Relationship-only (no web)</option>
            <option value="light">Light (one public fact max)</option>
            <option value="standard">Standard (typical public scan)</option>
            <option value="enhanced">Enhanced (deeper dig)</option>
          </select>
        </div>
        <div className="compass-work-actions">
          <button
            type="button"
            className="button primary"
            disabled={busy}
            onClick={() => {
              const el = document.getElementById(
                "compass-msg-notes",
              ) as HTMLTextAreaElement | null;
              confirmCampaign(el?.value || COPY.confirmResearch);
            }}
          >
            Yes — research and draft
          </button>
        </div>
      </div>
    );
  } else if (stage === "research") {
    work = (
      <div className="compass-work-block">
        <h2 className="compass-work-title">External context for review</h2>
        <div className="compass-card-stack">
          {researchForApproved.map((r) => (
            <ResearchCard
              key={r.personId}
              research={r}
              decision={factDecisions[r.personId]}
              onDecision={(d) => setFact(r.personId, d)}
              personName={personNameFor(r.personId)}
              onDigDeeper={() =>
                showToast(
                  "Dig deeper uses the same ResearchProvider — switch mode and re-confirm if needed",
                )
              }
            />
          ))}
        </div>
        <div className="compass-work-actions sticky-actions">
          <button type="button" className="button primary" disabled={busy} onClick={finishResearch}>
            Continue to drafts
          </button>
        </div>
      </div>
    );
  } else if (stage === "drafts") {
    work = (
      <div className="compass-work-block">
        <h2 className="compass-work-title">Draft review</h2>
        <div className="compass-card-stack">
          {draftsForApproved.map((d) => {
            const cand = cardCandidates.find((c) => c.id === d.personId);
            const liveDraft = liveDrafts?.find((x) => x.candidate_id === d.personId);
            return (
              <DraftCard
                key={d.personId}
                personId={d.personId}
                body={draftBodies[d.personId]}
                status={draftStatuses[d.personId]}
                editing={editingDraft === d.personId}
                sendingAccount={sendingAccount || recommendedSend}
                personName={personNameFor(d.personId)}
                roleLabel={cand?.likelyRole}
                subject={d.subject}
                ask={d.ask}
                email={cand?.email || undefined}
                personalization={provenanceChips(liveDraft?.provenance)}
                warnings={liveDraft?.warnings}
                onApprove={() => setDraftStatus(d.personId, "approved")}
                onEditToggle={() =>
                  setEditingDraft(editingDraft === d.personId ? null : d.personId)
                }
                onBodyChange={(b) => updateDraftBody(d.personId, b)}
                onTone={(m) => applyTone(d.personId, m)}
                onApplyAll={(m) => applyTone("all", m)}
                onRegenerate={() => regenerateDraft(d.personId)}
                onChangeAsk={() => changeDraftAsk(d.personId)}
                onRemovePublicRefs={() => removePublicRefs(d.personId)}
                onCallScript={() => setDraftVariant(d.personId, "call_script")}
                onLinkedIn={() => setDraftVariant(d.personId, "linkedin")}
              />
            );
          })}
        </div>
        <div className="compass-work-actions sticky-actions">
          <button type="button" className="button primary" disabled={busy} onClick={finishDrafts}>
            Continue to sending account
          </button>
        </div>
      </div>
    );
  } else if (stage === "sendAcct") {
    work = (
      <div className="compass-work-block">
        <h2 className="compass-work-title">Confirm sending account</h2>
        {sendOptions.length === 0 ? (
          <p className="compass-warn">
            No connected sending mailboxes. Connect an account on the{" "}
            <a href="/">Contacts</a> page first.
          </p>
        ) : (
          <>
            <p>
              Confirm which mailbox should own these drafts (Gate 5).
              {recommendedSend ? (
                <>
                  {" "}
                  Recommended: <strong>&lt;{recommendedSend}&gt;</strong>
                </>
              ) : null}
            </p>
            <div className="compass-send-acct-options">
              {sendOptions.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`compass-account-card compact${
                    a.email === recommendedSend ? " is-included" : ""
                  }`}
                  onClick={() => confirmSendingAccount(a.email)}
                >
                  <strong>{a.display_name}</strong>
                  <div className="compass-muted">&lt;{a.email}&gt;</div>
                  {a.email === recommendedSend ? (
                    <span className="compass-ok">Recommended</span>
                  ) : null}
                  {!a.can_send ? (
                    <span className="compass-warn">Send permission missing</span>
                  ) : null}
                </button>
              ))}
            </div>
            {recommendedSend ? (
              <div className="compass-work-actions">
                <button
                  type="button"
                  className="button primary"
                  onClick={() => confirmSendingAccount(recommendedSend)}
                >
                  Confirm &lt;{recommendedSend}&gt;
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    );
  } else if (stage === "review") {
    work = (
      <FinalReview
        roleSummary={formatRoleSummary()}
        searched={accountLabels || "selected mailboxes"}
        sendingAccount={sendingAccount || recommendedSend}
        usedFacts={usedFactCount}
        researchMode={researchMode}
        approvedIds={approvedIds}
        sendableCount={sendableIds.length}
        sendConfirmOpen={sendConfirmOpen}
        candidates={cardCandidates}
        sendPreviewNames={sendPreviewNames}
        preflightAttention={preflightAttention}
        onSave={saveDrafts}
        onSchedule={scheduleSend}
        onSend={openSendConfirm}
        onAuthorizeSend={authorizeSend}
        onCancelSend={() => setSendConfirmOpen(false)}
        onCancelCampaign={reset}
        onDropMissingEmail={() => {
          const missing = cardCandidates.find((c) => c.missingEmail && approvedIds.includes(c.id));
          if (missing) {
            setDecision(missing.id, "pass");
            showToast(`${missing.name} dropped from this campaign`);
          }
        }}
      />
    );
  } else if (stage === "tracking") {
    work = (
      <TrackingDashboard
        title={tracking?.title || objective}
        counts={tracking?.counts || {}}
        contacts={tracking?.contacts || []}
        replies={tracking?.replies || []}
        commitments={tracking?.commitments || []}
        suggestions={tracking?.suggestions || []}
        followUps={followUps || []}
        personNameFor={personNameFor}
        sendingAccount={sendingAccount}
        onRefresh={() => refreshTracking()}
        onProposeFollowUps={() => proposeFollowUps()}
        onApproveFollowUp={(id) => approveFollowUp(id)}
        onRejectFollowUp={(id) => rejectFollowUp(id)}
        onSendFollowUp={(id, email) => sendFollowUp(id, email)}
        gate9ConfirmId={gate9ConfirmId || null}
        onOpenGate9={(id) => setGate9ConfirmId(id)}
        onCancelGate9={() => setGate9ConfirmId(null)}
        busy={busy}
      />
    );
  } else if (stage === "campaigns") {
    work = (
      <CampaignsList
        campaigns={campaignList || []}
        onOpen={(id) => openCampaignFromList(id)}
        onHome={reset}
        busy={busy}
      />
    );
  } else if (stage === "done") {
    work = (
      <div className="compass-work-block">
        <h2 className="compass-work-title">
          {doneAction === "sent"
            ? "Send authorized"
            : doneAction === "saved"
              ? "Drafts saved to mailbox"
              : "Campaign complete"}
        </h2>
        <p className="compass-muted">
          Reply tracking and follow-ups are available from the campaigns list. Start another objective
          anytime.
        </p>
        <div className="compass-work-actions">
          <button type="button" className="button primary" onClick={reset}>
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="compass-workspace-wrap">
      <StageStrip stage={stage} />
      <div className="compass-workspace">
        <ConversationRail messages={messages} onSubmit={handleNl} />
        <main className="compass-work">
          {canGoBack ? (
            <div className="compass-back-bar">
              <button
                type="button"
                className="compass-back-btn"
                onClick={() => goBack()}
                disabled={busy && stage !== "progress"}
              >
                ← Back
              </button>
              {stage === "progress" ? (
                <span className="compass-muted">Cancel and return to the previous step</span>
              ) : null}
            </div>
          ) : null}
          {work}
        </main>
        <CampaignSummary
          objective={objective}
          mailboxes={accountLabels}
          found={cardCandidates.length}
          approved={approvedIds.length}
          researched={researchForApproved.length}
          drafted={draftedCount}
          sendingAccount={sendingAccount}
          nextDecision={nextDecision}
          open={summaryOpen}
          onToggle={() => setSummaryOpen(!summaryOpen)}
        />
      </div>
    </div>
  );
}
