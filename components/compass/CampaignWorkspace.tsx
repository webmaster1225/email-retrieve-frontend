"use client";

import type { ReactNode } from "react";
import { ACCOUNTS, CANDIDATES, COPY } from "@/lib/compass/northwynScenario";
import type { CompassPrototype } from "@/lib/compass/useCompassPrototype";
import { ConversationRail } from "./ConversationRail";
import { CampaignSummary } from "./CampaignSummary";
import { PlanCard } from "./PlanCard";
import { EvidenceCard } from "./EvidenceCard";
import { ResearchCard } from "./ResearchCard";
import { DraftCard } from "./DraftCard";
import { FinalReview } from "./FinalReview";

type Props = {
  proto: CompassPrototype;
};

export function CampaignWorkspace({ proto }: Props) {
  const {
    stage,
    objective,
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
    approvedIds,
    researchForApproved,
    draftsForApproved,
    sendableIds,
    usedFactCount,
    accountLabels,
    nextDecision,
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
    showToast,
    formatRoleSummary,
  } = proto;

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
          >
            Use your defaults — start
          </button>
          <button
            type="button"
            className="button"
            onClick={() => advanceFromClarify(COPY.excludeBankers)}
          >
            Exclude investment bankers
          </button>
        </div>
      </div>
    );
  } else if (stage === "plan") {
    work = <PlanCard onApprove={approvePlan} />;
  } else if (stage === "progress") {
    work = (
      <div className="compass-work-block compass-progress">
        <h2 className="compass-work-title">Reviewing relationships…</h2>
        <div className="compass-progress-bar-track">
          <div className="compass-progress-bar-fill" />
        </div>
        <p className="compass-muted">
          Reviewing your Northwyn relationship history… found 62 potentially relevant people,
          narrowing to the strongest candidates.
        </p>
      </div>
    );
  } else if (stage === "cards") {
    work = (
      <div className="compass-work-block">
        <h2 className="compass-work-title">Proposed contacts</h2>
        <p className="compass-muted">
          Strongest first. Decisions are for this campaign only.
        </p>
        <div className="compass-card-stack">
          {CANDIDATES.map((c) => (
            <EvidenceCard
              key={c.id}
              candidate={c}
              decision={decisions[c.id]}
              evidenceOpen={!!expandedEvidence[c.id]}
              onDecision={(d) => setDecision(c.id, d)}
              onToggleEvidence={() => toggleEvidence(c.id)}
            />
          ))}
        </div>
        <div className="compass-work-actions sticky-actions">
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
          defaultValue={COPY.messageNotes}
        />
        <div className="compass-work-actions">
          <button
            type="button"
            className="button primary"
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
              onDigDeeper={() => showToast("Dig deeper — coming in a later phase")}
            />
          ))}
        </div>
        <div className="compass-work-actions sticky-actions">
          <button type="button" className="button primary" onClick={finishResearch}>
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
          {draftsForApproved.map((d) => (
            <DraftCard
              key={d.personId}
              personId={d.personId}
              body={draftBodies[d.personId]}
              status={draftStatuses[d.personId]}
              editing={editingDraft === d.personId}
              sendingAccount="dbains@northwyn.com"
              onApprove={() => setDraftStatus(d.personId, "approved")}
              onEditToggle={() =>
                setEditingDraft(editingDraft === d.personId ? null : d.personId)
              }
              onBodyChange={(b) => updateDraftBody(d.personId, b)}
              onTone={(m) => applyTone(d.personId, m)}
              onApplyAll={(m) => applyTone("all", m)}
              onStub={(label) => showToast(`${label} — prototype stub`)}
            />
          ))}
        </div>
        <div className="compass-work-actions sticky-actions">
          <button type="button" className="button primary" onClick={finishDrafts}>
            Continue to sending account
          </button>
        </div>
      </div>
    );
  } else if (stage === "sendAcct") {
    work = (
      <div className="compass-work-block">
        <h2 className="compass-work-title">Confirm sending account</h2>
        <p>
          These messages concern Northwyn fundraising. Draft them from{" "}
          <strong>&lt;dbains@northwyn.com&gt;</strong>?
        </p>
        <div className="compass-send-acct-options">
          {ACCOUNTS.filter((a) => a.id !== "careers").map((a) => (
            <button
              key={a.id}
              type="button"
              className={`compass-account-card compact${
                a.id === "northwyn" ? " is-included" : ""
              }`}
              onClick={() => confirmSendingAccount(a.email)}
            >
              <strong>{a.name}</strong>
              <div className="compass-muted">&lt;{a.email}&gt;</div>
              {a.id === "northwyn" ? (
                <span className="compass-ok">Recommended</span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="compass-work-actions">
          <button
            type="button"
            className="button primary"
            onClick={() => confirmSendingAccount("dbains@northwyn.com")}
          >
            Confirm &lt;dbains@northwyn.com&gt;
          </button>
        </div>
      </div>
    );
  } else if (stage === "review") {
    work = (
      <FinalReview
        roleSummary={formatRoleSummary()}
        searched={accountLabels || "Northwyn + Edge"}
        sendingAccount={sendingAccount || "dbains@northwyn.com"}
        usedFacts={usedFactCount}
        approvedIds={approvedIds}
        sendableCount={sendableIds.length}
        sendConfirmOpen={sendConfirmOpen}
        onSave={saveDrafts}
        onSchedule={() => showToast("Schedule — coming in a later phase")}
        onSend={openSendConfirm}
        onAuthorizeSend={authorizeSend}
        onCancelSend={() => setSendConfirmOpen(false)}
        onCancelCampaign={reset}
        onResolvePriya={(action) => {
          if (action === "drop") {
            setDecision("priya", "pass");
            showToast("Priya dropped from this campaign");
          } else {
            showToast("LinkedIn path — prototype stub");
          }
        }}
      />
    );
  } else if (stage === "done") {
    work = (
      <div className="compass-work-block">
        <h2 className="compass-work-title">
          {doneAction === "sent" ? "Send authorized (prototype)" : "Drafts saved (prototype)"}
        </h2>
        <p className="compass-muted">
          Tracking (Day 0+) lands in a later phase. You can restart the walkthrough anytime.
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
    <div className="compass-workspace">
      <ConversationRail messages={messages} onSubmit={handleNl} />
      <main className="compass-work">{work}</main>
      <CampaignSummary
        objective={objective}
        mailboxes={accountLabels}
        found={CANDIDATES.length}
        approved={approvedIds.length}
        researched={researchForApproved.length}
        drafted={draftedCount}
        sendingAccount={sendingAccount}
        nextDecision={nextDecision}
        open={summaryOpen}
        onToggle={() => setSummaryOpen(!summaryOpen)}
      />
    </div>
  );
}
