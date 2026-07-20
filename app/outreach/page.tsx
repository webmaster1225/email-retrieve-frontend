"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import {
  api,
  Contact,
  EmailDraft,
  formatDate,
  OutreachIntelligence,
  OutreachJob,
  OutreachPrompt,
  SyncRun,
  tierClass,
} from "@/lib/api";

const USE_CASES = [
  { value: "", label: "Auto (best fit)" },
  { value: "fundraising", label: "Fundraising" },
  { value: "investment", label: "Investment" },
  { value: "business_development", label: "Business development" },
  { value: "ma", label: "M&A" },
  { value: "board_opportunities", label: "Board opportunities" },
  { value: "strategic_introductions", label: "Strategic introductions" },
];

const COMPASS_LIVE =
  process.env.NEXT_PUBLIC_COMPASS_LIVE === "true" ||
  process.env.NEXT_PUBLIC_COMPASS_LIVE === "1";

function patternLabel(pattern: string | undefined) {
  switch (pattern) {
    case "two_way":
      return "Two-way";
    case "mostly_outbound":
      return "Mostly one-way (outbound)";
    case "mostly_inbound":
      return "Mostly inbound";
    case "one_off":
      return "One-off";
    default:
      return pattern || "—";
  }
}

export default function OutreachPage() {
  const [auth, setAuth] = useState<{
    connected: boolean;
    user_email: string | null;
    can_send_mail?: boolean;
  } | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeDraft, setActiveDraft] = useState<EmailDraft | null>(null);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<OutreachPrompt | null>(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userTemplate, setUserTemplate] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [targetUseCase, setTargetUseCase] = useState("");
  const [notRepliedDays, setNotRepliedDays] = useState("");
  const [sortByScore, setSortByScore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sync, setSync] = useState<SyncRun | null>(null);
  const [job, setJob] = useState<OutreachJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [showPromptUsed, setShowPromptUsed] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean> = {
        review_status: "approved",
        exclude_internal: true,
        exclude_noise: true,
        page_size: 100,
        sort: sortByScore ? "outreach_relevance_score" : "list_number",
        order: sortByScore ? "desc" : "asc",
      };
      if (notRepliedDays) {
        params.not_replied_days = Number(notRepliedDays);
        params.awaiting_reply_only = true;
      }
      const [authStatus, contactData, draftData, promptData] = await Promise.all([
        api.authStatus(),
        api.contacts(params),
        api.listDrafts(),
        api.getOutreachPrompt(),
      ]);
      setAuth(authStatus);
      setContacts(contactData.items);
      setDrafts(draftData.items.filter((d) => d.status !== "sent"));
      setPrompt(promptData);
      setSystemPrompt(promptData.system_prompt);
      setUserTemplate(promptData.user_prompt_template);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load outreach data");
    } finally {
      setLoading(false);
    }
  }, [notRepliedDays, sortByScore]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!sync || sync.status !== "running") return;
    const timer = setInterval(async () => {
      const status = await api.syncStatus();
      setSync(status);
      if (status?.status !== "running") loadAll();
    }, 3000);
    return () => clearInterval(timer);
  }, [sync, loadAll]);

  useEffect(() => {
    if (!job || (job.status !== "running" && job.status !== "pending")) return;
    const timer = setInterval(async () => {
      try {
        const status = await api.getOutreachJob(job.id);
        setJob(status);
        if (status.status === "completed" || status.status === "failed") {
          await loadAll();
          if (status.status === "failed") {
            setError(status.error_message || "Outreach analysis job failed");
          } else if (status.failed > 0) {
            const failed = status.results.filter((r) => r.status === "error");
            setError(`Finished with ${status.failed} error(s): ${failed.map((f) => f.error).join("; ")}`);
          }
          setAnalyzing(false);
          setGenerating(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to poll analysis job");
        setAnalyzing(false);
        setGenerating(false);
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [job, loadAll]);

  const activeIntel: OutreachIntelligence | null = useMemo(() => {
    const contact = contacts.find((c) => c.id === activeContactId);
    return (contact?.ai_outreach_intelligence as OutreachIntelligence | undefined) || null;
  }, [contacts, activeContactId]);

  function toggleContact(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setActiveContactId(id);
  }

  function toggleAll() {
    if (selected.size === contacts.length) setSelected(new Set());
    else setSelected(new Set(contacts.map((c) => c.id)));
  }

  function selectTop50() {
    const top = contacts.slice(0, 50).map((c) => c.id);
    setSelected(new Set(top));
  }

  async function savePromptTemplate() {
    try {
      const saved = await api.saveOutreachPrompt({
        system_prompt: systemPrompt,
        user_prompt_template: userTemplate,
      });
      setPrompt(saved);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save prompt");
    }
  }

  async function startBatch(generateDrafts: boolean) {
    const ids = selected.size > 0 ? Array.from(selected) : activeContactId ? [activeContactId] : [];
    if (ids.length === 0) {
      setError("Select at least one approved contact");
      return;
    }
    if (ids.length > 50) {
      setError("Batch limit is 50 contacts — deselect some or use Select top 50");
      return;
    }
    if (generateDrafts) setGenerating(true);
    else setAnalyzing(true);
    setError(null);
    try {
      const result = await api.analyzeOutreach({
        contactIds: ids,
        generateDrafts,
        customInstructions: customInstructions || undefined,
        targetUseCase: targetUseCase || undefined,
        force: false,
        asyncBatch: true,
      });
      if (result.job) {
        setJob(result.job);
      } else if (result.items?.length) {
        await loadAll();
        setAnalyzing(false);
        setGenerating(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setAnalyzing(false);
      setGenerating(false);
    }
  }

  async function handleGenerate() {
    const ids = selected.size > 0 ? Array.from(selected) : activeDraft ? [activeDraft.contact_id] : [];
    if (ids.length === 0) {
      setError("Select at least one approved contact");
      return;
    }
    // Prefer background batch for multi-contact personalized drafts
    if (ids.length > 1) {
      await startBatch(true);
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const result = await api.generateDrafts(ids, customInstructions || undefined, true);
      await loadAll();
      if (result.items.length > 0) {
        setActiveDraft(result.items[0]);
        setActiveContactId(result.items[0].contact_id);
      }
      if (result.results?.some((r) => r.status === "error")) {
        const failed = result.results.filter((r) => r.status === "error");
        setError(`Some drafts failed: ${failed.map((f) => f.error).join("; ")}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDraft() {
    if (!activeDraft) return;
    try {
      const updated = await api.updateDraft(activeDraft.id, {
        subject: activeDraft.subject || "",
        body: activeDraft.body || "",
      });
      setActiveDraft(updated);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    }
  }

  async function handleApproveDraft() {
    if (!activeDraft) return;
    try {
      const updated = await api.approveDraft(activeDraft.id);
      setActiveDraft(updated);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve draft");
    }
  }

  async function handleSendDraft() {
    if (!activeDraft) return;
    setSending(true);
    setError(null);
    try {
      const updated = await api.sendDraft(activeDraft.id);
      setActiveDraft(updated);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  }

  async function handleSendAllApproved() {
    setSending(true);
    setError(null);
    try {
      const result = await api.sendApprovedDrafts();
      const failed = result.results.filter((r) => r.status === "error");
      if (failed.length) setError(`Some sends failed: ${failed.map((f) => f.error).join("; ")}`);
      setActiveDraft(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk send failed");
    } finally {
      setSending(false);
    }
  }

  async function handleInboxSync() {
    setError(null);
    try {
      const run = await api.startInboxSync();
      setSync(run);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inbox sync failed to start");
    }
  }

  const approvedDraftCount = drafts.filter((d) => d.status === "approved").length;
  const busy = analyzing || generating || job?.status === "running" || job?.status === "pending";

  return (
    <main className="page">
      <div className="header">
        <div>
          <Nav />
          <h1 style={{ marginTop: 12 }}>Fundraising Outreach</h1>
          <p>
            Analyze email history, score contacts, and send personalized drafts via Outlook
            {auth?.connected && auth.user_email ? ` · ${auth.user_email}` : ""}
          </p>
        </div>
        <div className="actions">
          {!auth?.connected ? (
            <a className="button primary" href={api.loginUrl()}>
              Connect Microsoft Outlook
            </a>
          ) : (
            <>
              <a className="button" href={api.loginUrl()} title="Reconnect after adding Mail.Send in Azure">
                Reconnect Outlook
              </a>
              <button onClick={handleInboxSync} disabled={sync?.status === "running"}>
                {sync?.status === "running" && sync.sync_type === "inbox" ? "Syncing inbox…" : "Sync Inbox (replies)"}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="banner error">{error}</div>}
      {COMPASS_LIVE && (
        <div className="banner info">
          Draft generation and send are paused while Compass live campaigns are on. Use{" "}
          <a href="/compass">
            <strong>Compass</strong>
          </a>{" "}
          for objective-first outreach (drafting returns in Phase 7).
        </div>
      )}
      {sync?.status === "running" && (
        <div className="banner info">
          {sync.sync_type === "inbox" ? "Inbox" : "Sent"} sync: {sync.messages_fetched.toLocaleString()} fetched…
        </div>
      )}
      {job && (job.status === "running" || job.status === "pending") && (
        <div className="banner info">
          Analyzing contacts: {job.completed}/{job.total} ({job.progress_pct}%)
          {job.generate_drafts ? " · generating personalized drafts" : " · scoring only"}
          {job.failed > 0 ? ` · ${job.failed} failed` : ""}
        </div>
      )}
      {job?.status === "completed" && (
        <div className="banner success">
          Batch complete: {job.total - job.failed}/{job.total} succeeded
          {job.failed > 0 ? `, ${job.failed} failed` : ""}.
        </div>
      )}

      {auth?.connected && auth.can_send_mail && (
        <div className="banner success">
          Outlook connected with send permission. Use <strong>Analyze &amp; score</strong> to rank contacts from
          email history, then generate personalized drafts that reference prior conversations.
        </div>
      )}

      {auth?.connected && !auth.can_send_mail && (
        <div className="banner error">
          Connected as {auth.user_email}, but <strong>Mail.Send</strong> is not in your session yet. Click{" "}
          <strong>Reconnect Outlook</strong>, sign in as dbains@edgeinvesting.ca, and accept all permissions. If
          it still fails, restart the backend and reconnect again.
        </div>
      )}

      {!auth?.connected && (
        <div className="banner info">
          Connect Microsoft Outlook to draft and send fundraising emails.
        </div>
      )}

      <div className="outreach-layout">
        <div className="outreach-panel">
          <div className="panel-header">
            <h2>Approved contacts ({contacts.length})</h2>
            <div className="actions" style={{ flexWrap: "wrap" }}>
              <select value={notRepliedDays} onChange={(e) => setNotRepliedDays(e.target.value)}>
                <option value="">All approved</option>
                <option value="2">No reply ≥ 2 days</option>
                <option value="3">No reply ≥ 3 days</option>
                <option value="7">No reply ≥ 7 days</option>
                <option value="14">No reply ≥ 14 days</option>
                <option value="30">No reply ≥ 30 days</option>
              </select>
              <label className="sort-toggle">
                <input type="checkbox" checked={sortByScore} onChange={(e) => setSortByScore(e.target.checked)} />
                Sort by outreach score
              </label>
            </div>
          </div>

          {loading ? (
            <p>Loading…</p>
          ) : contacts.length === 0 ? (
            <p className="drawer-empty">No approved contacts. Approve people on the Contacts page first.</p>
          ) : (
            <div className="contact-select-list">
              <div className="select-all-row">
                <label className="select-all">
                  <input
                    type="checkbox"
                    checked={selected.size === contacts.length && contacts.length > 0}
                    onChange={toggleAll}
                  />
                  Select all ({selected.size} selected)
                </label>
                <button type="button" className="link-btn" onClick={selectTop50}>
                  Select top 50
                </button>
              </div>
              {contacts.map((c) => {
                const intel = c.ai_outreach_intelligence as OutreachIntelligence | undefined;
                const pattern = intel?.analysis?.conversation_pattern;
                return (
                  <label
                    key={c.id}
                    className={`contact-select-item intel${selected.has(c.id) ? " selected" : ""}${
                      activeContactId === c.id ? " focused" : ""
                    }`}
                  >
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleContact(c.id)} />
                    <span className="serial">#{c.list_number}</span>
                    <span className="contact-meta">
                      <span className="name">{c.full_name || c.primary_email}</span>
                      <span className="email">{c.primary_email}</span>
                      {pattern && <span className="intel-meta">{patternLabel(pattern)}</span>}
                      {intel?.analysis?.seniority?.title && (
                        <span className="intel-meta">{intel.analysis.seniority.title}</span>
                      )}
                    </span>
                    <span className="contact-badges">
                      {(c.outreach_relevance_score ?? 0) > 0 && (
                        <span className={tierClass(c.outreach_relevance_tier || null)} title={c.outreach_score_explanation || ""}>
                          {c.outreach_relevance_score}
                        </span>
                      )}
                      {c.awaiting_reply && c.days_since_outreach != null && (
                        <span className="reply-badge">No reply {c.days_since_outreach}d</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="outreach-panel outreach-compose">
          <div className="panel-header">
            <h2>Intelligence &amp; compose</h2>
            <button onClick={() => setShowPromptEditor(!showPromptEditor)}>
              {showPromptEditor ? "Hide prompt template" : "Edit prompt template"}
            </button>
          </div>

          {showPromptEditor && (
            <div className="prompt-editor">
              <label>
                System prompt (legacy template drafts)
                <textarea rows={3} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
              </label>
              <label>
                User prompt template — use {"{context}"} and {"{custom_instructions_block}"} placeholders
                <textarea rows={10} value={userTemplate} onChange={(e) => setUserTemplate(e.target.value)} />
              </label>
              <button onClick={savePromptTemplate}>Save prompt template</button>
              {prompt?.updated_at && (
                <small className="meta">Last saved {formatDate(prompt.updated_at)}</small>
              )}
            </div>
          )}

          <label>
            Target use case
            <select value={targetUseCase} onChange={(e) => setTargetUseCase(e.target.value)}>
              {USE_CASES.map((u) => (
                <option key={u.value || "auto"} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Optional instructions for this batch (tone, angle, specifics)
            <textarea
              rows={3}
              placeholder="e.g. Mention our Q3 Galaxy Pharma deck and ask for a 15-min call…"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
            />
          </label>

          <div className="actions" style={{ flexWrap: "wrap" }}>
            <button onClick={() => startBatch(false)} disabled={busy || COMPASS_LIVE}>
              {analyzing ? "Analyzing…" : selected.size > 1 ? `Analyze & score ${selected.size}` : "Analyze & score"}
            </button>
            <button className="primary" onClick={handleGenerate} disabled={busy || COMPASS_LIVE}>
              {generating
                ? "Generating…"
                : selected.size > 1
                  ? `Analyze + draft ${selected.size}`
                  : selected.size === 1
                    ? "Personalized draft"
                    : "Personalized draft (select contacts)"}
            </button>
          </div>

          {activeIntel && (
            <div className="intel-card">
              <h3>Analysis · score {activeIntel.score}/100</h3>
              <p className="intel-explanation">{activeIntel.score_explanation}</p>
              <dl className="intel-grid">
                <div>
                  <dt>Conversation</dt>
                  <dd>{patternLabel(activeIntel.analysis?.conversation_pattern)}</dd>
                </div>
                <div>
                  <dt>Depth / strength</dt>
                  <dd>
                    {activeIntel.analysis?.relationship_depth} / {activeIntel.analysis?.relationship_strength}
                  </dd>
                </div>
                <div>
                  <dt>Seniority</dt>
                  <dd>
                    {activeIntel.analysis?.seniority?.title || activeIntel.analysis?.seniority?.level || "—"}
                  </dd>
                </div>
                <div>
                  <dt>Primary use case</dt>
                  <dd>{(activeIntel.analysis?.primary_use_case || "—").replace(/_/g, " ")}</dd>
                </div>
                <div>
                  <dt>Last discussed</dt>
                  <dd>{activeIntel.analysis?.last_discussed_topic || "—"}</dd>
                </div>
              </dl>
              {activeIntel.analysis?.key_conversation_points?.length > 0 && (
                <ul className="intel-points">
                  {activeIntel.analysis.key_conversation_points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
              {activeIntel.analysis?.summary && <p className="intel-summary">{activeIntel.analysis.summary}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="outreach-panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Drafts ({drafts.length})</h2>
          <div className="actions">
            {approvedDraftCount > 0 && (
              <button className="primary" onClick={handleSendAllApproved} disabled={sending}>
                Send all approved ({approvedDraftCount})
              </button>
            )}
          </div>
        </div>

        <div className="drafts-layout">
          <div className="draft-list">
            {drafts.length === 0 ? (
              <p className="drawer-empty">No drafts yet. Analyze contacts and generate personalized drafts.</p>
            ) : (
              drafts.map((d) => (
                <button
                  key={d.id}
                  className={`draft-list-item${activeDraft?.id === d.id ? " active" : ""}`}
                  onClick={() => {
                    setActiveDraft(d);
                    setActiveContactId(d.contact_id);
                  }}
                >
                  <strong>
                    #{d.list_number} {d.contact_name}
                  </strong>
                  <span>{d.subject || "(no subject)"}</span>
                  <span className={`draft-status ${d.status}`}>{d.status}</span>
                </button>
              ))
            )}
          </div>

          {activeDraft && (
            <div className="draft-editor">
              <h3>
                #{activeDraft.list_number} · {activeDraft.contact_name} · {activeDraft.contact_email}
              </h3>
              <label>
                Subject
                <input
                  value={activeDraft.subject || ""}
                  onChange={(e) => setActiveDraft({ ...activeDraft, subject: e.target.value })}
                />
              </label>
              <label>
                Body
                <textarea
                  rows={12}
                  value={activeDraft.body || ""}
                  onChange={(e) => setActiveDraft({ ...activeDraft, body: e.target.value })}
                />
              </label>

              <button type="button" className="link-btn" onClick={() => setShowPromptUsed(!showPromptUsed)}>
                {showPromptUsed ? "Hide" : "Show"} prompt sent to LLM
              </button>
              {showPromptUsed && (
                <div className="prompt-used">
                  <h4>System prompt</h4>
                  <pre>{activeDraft.system_prompt}</pre>
                  <h4>User prompt</h4>
                  <pre>{activeDraft.user_prompt}</pre>
                  {activeDraft.custom_instructions && (
                    <>
                      <h4>Your custom instructions</h4>
                      <pre>{activeDraft.custom_instructions}</pre>
                    </>
                  )}
                </div>
              )}

              <div className="actions">
                <button onClick={handleSaveDraft} disabled={COMPASS_LIVE}>
                  Save edits
                </button>
                <button
                  onClick={handleApproveDraft}
                  disabled={COMPASS_LIVE || activeDraft.status === "approved"}
                >
                  Approve draft
                </button>
                <button
                  className="primary"
                  onClick={handleSendDraft}
                  disabled={COMPASS_LIVE || sending}
                >
                  {sending ? "Sending…" : "Send via Outlook"}
                </button>
              </div>
              {activeDraft.error_message && (
                <div className="banner error" style={{ marginTop: 8 }}>
                  {activeDraft.error_message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
