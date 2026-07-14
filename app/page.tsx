"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  Contact,
  ExchangeEmail,
  formatDate,
  OutlookContact,
  RelationshipAnalysis,
  RelationshipResult,
  reviewClass,
  SeniorityResult,
  Stats,
  SyncRun,
  tierClass,
} from "@/lib/api";
import { InfoTip } from "@/components/InfoTip";
import { Nav } from "@/components/Nav";
import {
  clearContactCache,
  loadContactCache,
  saveContactCache,
} from "@/lib/contactCache";
import { RelevanceTierHelp } from "@/lib/helpText";

const PAGE_SIZE = 50;

const USEFULNESS_LABELS: Record<string, string> = {
  business_development: "Business dev",
  board_opportunities: "Board",
  ma: "M&A",
  investment: "Investment",
  fundraising: "Fundraising",
  strategic_introductions: "Intros",
};

function patternLabel(pattern: string) {
  const labels: Record<string, string> = {
    two_way: "Two-way",
    mostly_outbound: "Mostly outbound",
    mostly_inbound: "Mostly inbound",
    one_off: "One-off",
    unknown: "Unknown",
  };
  return labels[pattern] || pattern.replace(/_/g, " ");
}

function usefulnessEntries(analysis: RelationshipAnalysis | null | undefined) {
  if (!analysis?.business_usefulness) return [];
  return Object.entries(analysis.business_usefulness).filter(
    ([, value]) => value === "high" || value === "medium"
  );
}

function directionLabel(direction: string) {
  if (direction === "inbound") return "Received";
  if (direction === "outbound") return "Sent";
  return "Unknown";
}

function contactToRow(contact: Contact): OutlookContact {
  return {
    id: contact.id,
    local_contact_id: contact.id,
    list_number: contact.list_number,
    full_name: contact.full_name,
    primary_email: contact.primary_email,
    company_name: contact.company_name,
    company_domain: contact.company_domain,
    last_contacted_at: contact.last_contacted_at,
    last_subject: contact.last_subject,
    last_preview: contact.last_preview,
    latest_message_id: contact.latest_message_id,
    latest_outlook_weblink: contact.latest_outlook_weblink,
    email_count: contact.email_count,
    thread_count: contact.thread_count,
    fundraising_relevance_score: contact.fundraising_relevance_score,
    fundraising_relevance_tier: contact.fundraising_relevance_tier,
    review_status: contact.review_status,
    detected_topics: contact.detected_topics,
    detected_role: contact.detected_role,
    ai_seniority: contact.ai_seniority,
  };
}

function currentFilters(q: string, fundraisingTier: string, emailCountMin: string, reviewFilter: string) {
  return { q, fundraisingTier, emailCountMin, reviewFilter };
}

export default function HomePage() {
  const [auth, setAuth] = useState<{ connected: boolean; user_email: string | null } | null>(null);
  const [contacts, setContacts] = useState<OutlookContact[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [nextLink, setNextLink] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sync, setSync] = useState<SyncRun | null>(null);
  const [dataSource, setDataSource] = useState<"local" | "outlook">("outlook");
  const [selected, setSelected] = useState<OutlookContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [seniority, setSeniority] = useState<SeniorityResult | null>(null);
  const [seniorityLoading, setSeniorityLoading] = useState(false);
  const [relationship, setRelationship] = useState<RelationshipResult | null>(null);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [recentEmails, setRecentEmails] = useState<ExchangeEmail[]>([]);
  const [recentEmailsLoading, setRecentEmailsLoading] = useState(false);

  const [q, setQ] = useState("");
  const [fundraisingTier, setFundraisingTier] = useState("");
  const [emailCountMin, setEmailCountMin] = useState("");
  const [reviewFilter, setReviewFilter] = useState("");

  const tableWrapRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLTableRowElement>(null);
  const loadGenRef = useRef(0);
  const contactsRef = useRef<OutlookContact[]>([]);
  const pageRef = useRef(1);
  const useLocalRef = useRef(false);
  const loadedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    if (!selected) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  const refreshAuth = useCallback(async () => {
    try {
      const authStatus = await api.authStatus();
      setAuth(authStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load auth status");
    }
  }, []);

  const refreshStats = useCallback(async (includeGraphTotal = false) => {
    try {
      const statsData = await api.stats(includeGraphTotal);
      setStats(statsData);
      if (statsData.external_contacts > 0) {
        setTotal(statsData.external_contacts);
      } else if (statsData.graph_sent_total != null) {
        setTotal(statsData.graph_sent_total);
      }
      return statsData;
    } catch {
      // Non-blocking — stats are optional for the table.
      return null;
    }
  }, []);

  const persistCache = useCallback(
    (items: OutlookContact[], page: number, source: "local" | "outlook", totalCount: number | null) => {
      saveContactCache({
        contacts: items,
        page,
        total: totalCount,
        source,
        filters: currentFilters(q, fundraisingTier, emailCountMin, reviewFilter),
        userEmail: auth?.user_email ?? null,
      });
    },
    [auth?.user_email, q, fundraisingTier, emailCountMin, reviewFilter]
  );

  const loadContactsPage = useCallback(
    async (cursor: string | null, append: boolean, useLocal = useLocalRef.current) => {
      const gen = loadGenRef.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        if (useLocal) {
          const page = append ? pageRef.current + 1 : 1;
          pageRef.current = page;
          const params: Record<string, string | number | boolean> = {
            page,
            page_size: PAGE_SIZE,
            exclude_internal: true,
            exclude_noise: true,
            sort: "last_contacted_at",
            order: "desc",
          };
          if (q) params.q = q;
          if (fundraisingTier) params.fundraising_tier = fundraisingTier;
          if (emailCountMin.trim()) params.email_count_min = Number(emailCountMin);
          if (reviewFilter) params.review_status = reviewFilter;

          const contactData = await api.contacts(params);
          if (gen !== loadGenRef.current) return;

          const rows = contactData.items.map(contactToRow);
          const merged = append ? [...contactsRef.current, ...rows] : rows;
          setContacts(merged);
          setDataSource("local");
          setTotal(contactData.total);
          setNextLink(page * PAGE_SIZE < contactData.total ? `local:${page + 1}` : null);
          persistCache(merged, page, "local", contactData.total);
        } else {
          const excludeEmails = append
            ? contactsRef.current.map((c) => c.primary_email).join(",")
            : undefined;
          const contactData = await api.outlookContacts({
            page_size: PAGE_SIZE,
            next_link: cursor || undefined,
            q: q || undefined,
            exclude_emails: excludeEmails,
            include_total: false,
            prefer_local: false,
          });
          if (gen !== loadGenRef.current) return;

          const merged = append ? [...contactsRef.current, ...contactData.items] : contactData.items;
          setContacts(merged);
          setDataSource("outlook");
          setNextLink(contactData.next_link);
          if (contactData.total != null) setTotal(contactData.total);
          persistCache(merged, append ? pageRef.current + 1 : 1, "outlook", contactData.total);
        }
      } catch (err) {
        if (gen !== loadGenRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to load contacts");
      } finally {
        if (gen !== loadGenRef.current) return;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [q, fundraisingTier, emailCountMin, reviewFilter, persistCache]
  );

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    if (!auth?.connected) return;
    refreshStats();
    api.syncStatus().then(setSync).catch(() => {});
  }, [auth?.connected, refreshStats]);

  useEffect(() => {
    if (!auth?.connected) {
      setContacts([]);
      setNextLink(null);
      setTotal(null);
      setStats(null);
      setSync(null);
      setLoading(false);
      loadedKeyRef.current = null;
      return;
    }

    const filters = currentFilters(q, fundraisingTier, emailCountMin, reviewFilter);
    const key = JSON.stringify(filters);

    // Already restored/loaded these filters — don't let a later stats update
    // clobber the list or reset infinite-scroll pagination.
    if (loadedKeyRef.current === key) return;

    // Restore from the session cache immediately, without waiting for stats.
    const cached = loadContactCache(auth.user_email, filters);
    if (cached) {
      loadedKeyRef.current = key;
      loadGenRef.current += 1;
      useLocalRef.current = cached.source === "local";
      setContacts(cached.contacts);
      setTotal(cached.total);
      setDataSource(cached.source);
      pageRef.current = cached.page;
      setNextLink(
        cached.source === "local"
          ? cached.total != null && cached.contacts.length < cached.total
            ? `local:${cached.page + 1}`
            : null
          : "resume"
      );
      setLoading(false);
      return;
    }

    // No cache: we need stats to pick the source. This call is now DB-only/fast.
    if (stats === null) {
      setLoading(true);
      return;
    }

    loadedKeyRef.current = key;
    const useLocal = stats.external_contacts > 0;
    useLocalRef.current = useLocal;
    loadGenRef.current += 1;
    setContacts([]);
    setNextLink(null);
    pageRef.current = 1;
    if (!useLocal) setTotal(null);
    loadContactsPage(null, false, useLocal);
  }, [auth?.connected, auth?.user_email, q, fundraisingTier, emailCountMin, reviewFilter, stats, loadContactsPage]);

  useEffect(() => {
    if (!auth?.connected || !stats || stats.external_contacts > 0 || stats.synced_messages > 0) return;
    if (sync?.status === "running") return;

    let cancelled = false;
    (async () => {
      const status = await api.syncStatus();
      if (cancelled) return;
      if (status?.status === "running") {
        setSync(status);
        return;
      }
      try {
        const run = await api.startSync();
        if (!cancelled) setSync(run);
      } catch {
        // User can start sync manually.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth?.connected, stats?.external_contacts, stats?.synced_messages, sync?.status]);

  useEffect(() => {
    if (!sync || sync.status !== "running") return;
    const timer = setInterval(async () => {
      const status = await api.syncStatus();
      setSync(status);
      // Fetch the live Graph total only while syncing so progress "X / Y" shows.
      const statsData = await refreshStats(true);
      if (status?.status !== "running") {
        if ((statsData?.external_contacts ?? 0) > 0) {
          loadedKeyRef.current = JSON.stringify(
            currentFilters(q, fundraisingTier, emailCountMin, reviewFilter)
          );
          loadGenRef.current += 1;
          pageRef.current = 1;
          setContacts([]);
          clearContactCache();
          loadContactsPage(null, false, true);
        }
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [sync, refreshStats, loadContactsPage, q, fundraisingTier, emailCountMin, reviewFilter]);

  const hasMore = !!nextLink;

  const filteredContacts = useMemo(() => {
    if (dataSource === "local") return contacts;
    const minEmails = emailCountMin.trim() === "" ? null : Number(emailCountMin);
    return contacts.filter((contact) => {
      if (fundraisingTier && (contact.fundraising_relevance_tier || "low") !== fundraisingTier) {
        return false;
      }
      if (minEmails != null && !Number.isNaN(minEmails) && contact.email_count < minEmails) {
        return false;
      }
      if (reviewFilter && contact.review_status !== reviewFilter) {
        return false;
      }
      return true;
    });
  }, [contacts, dataSource, fundraisingTier, emailCountMin, reviewFilter]);

  const filtersActive = Boolean(fundraisingTier || emailCountMin.trim() || reviewFilter);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = tableWrapRef.current;
    if (!sentinel || !root || !hasMore || loading || loadingMore || !auth?.connected) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || !nextLink) return;
        const cursor = nextLink === "resume" ? null : nextLink;
        loadContactsPage(cursor, true);
      },
      { root, rootMargin: "200px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, nextLink, loadContactsPage, auth?.connected]);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const run = await api.startSync();
      setSync(run);
      clearContactCache();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start sync");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    setError(null);
    try {
      await api.disconnect();
      clearContactCache();
      setAuth({ connected: false, user_email: null });
      setContacts([]);
      setNextLink(null);
      setTotal(null);
      setStats(null);
      setSync(null);
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  }

  async function setReviewStatus(contact: OutlookContact, review_status: string) {
    try {
      const contactId = contact.local_contact_id || contact.id;
      const updated =
        dataSource === "local" && contactId
          ? await api.updateContact(contactId, { review_status })
          : await api.updateContactByEmail(contact.primary_email, { review_status });
      setContacts((prev) => {
        const next = prev.map((c) =>
          c.primary_email === contact.primary_email
            ? { ...c, review_status: updated.review_status, local_contact_id: updated.id }
            : c
        );
        persistCache(next, pageRef.current, dataSource, total);
        return next;
      });
      if (selected?.primary_email === contact.primary_email) {
        setSelected((prev) => (prev ? { ...prev, review_status: updated.review_status } : prev));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update review status");
    }
  }

  async function loadRecentEmails(contact: OutlookContact) {
    setRecentEmailsLoading(true);
    setRecentEmails([]);
    try {
      const result = await api.contactMessagesByEmail(contact.primary_email, 5);
      setRecentEmails(result.items);
    } catch {
      if (contact.last_subject || contact.last_preview) {
        setRecentEmails([
          {
            subject: contact.last_subject,
            body_preview: contact.last_preview,
            sent_datetime: contact.last_contacted_at,
            direction: "outbound",
            outlook_weblink: contact.latest_outlook_weblink,
            has_attachments: false,
          },
        ]);
      }
    } finally {
      setRecentEmailsLoading(false);
    }
  }

  async function loadRelationship(contact: OutlookContact) {
    const cached = contact.ai_relationship_analysis;
    if (cached?.stats && cached.analysis) {
      setRelationship({
        stats: cached.stats,
        analysis: cached.analysis,
        cached: true,
        generated_at: cached.generated_at,
      });
      return;
    }

    setRelationshipLoading(true);
    setRelationship(null);
    try {
      const result = await api.aiRelationshipByEmail(contact.primary_email, {
        full_name: contact.full_name,
        company_name: contact.company_name,
        last_subject: contact.last_subject,
        last_preview: contact.last_preview,
      });
      setRelationship(result);
      setSelected((prev) =>
        prev?.primary_email === contact.primary_email
          ? {
              ...prev,
              ai_relationship_analysis: {
                generated_at: result.generated_at,
                stats: result.stats,
                analysis: result.analysis,
              },
            }
          : prev
      );
    } catch {
      // Non-blocking — drawer still works without relationship analysis.
    } finally {
      setRelationshipLoading(false);
    }
  }

  async function loadSeniority(contact: OutlookContact) {
    if (contact.ai_seniority) {
      setSeniority(contact.ai_seniority);
      return;
    }
    setSeniorityLoading(true);
    setSeniority(null);
    try {
      const result = await api.aiSeniorityByEmail(contact.primary_email, {
        full_name: contact.full_name,
        company_name: contact.company_name,
        last_subject: contact.last_subject,
        last_preview: contact.last_preview,
      });
      setSeniority(result.seniority);
      setSelected((prev) =>
        prev?.primary_email === contact.primary_email
          ? { ...prev, ai_seniority: result.seniority, detected_role: result.seniority.title }
          : prev
      );
    } catch {
      // Non-blocking — drawer still works without seniority.
    } finally {
      setSeniorityLoading(false);
    }
  }

  async function openContact(contact: OutlookContact) {
    setDetailLoading(true);
    setSeniority(null);
    setSeniorityLoading(false);
    setRelationship(null);
    setRelationshipLoading(false);
    setRecentEmails([]);
    setRecentEmailsLoading(false);
    setSelected(contact);
    try {
      const detail =
        dataSource === "local"
          ? await api.contact(contact.local_contact_id || contact.id)
          : await api.outlookContact(contact.id);
      const merged = {
        ...contact,
        ...(dataSource === "local" ? contactToRow(detail as Contact) : detail),
      };
      setSelected(merged);
      void loadSeniority(merged);
      void loadRelationship(merged);
      void loadRecentEmails(merged);
    } catch (err) {
      setSelected(null);
      setSeniority(null);
      setRelationship(null);
      setRecentEmails([]);
      setError(err instanceof Error ? err.message : "Failed to load contact");
    } finally {
      setDetailLoading(false);
    }
  }

  function rowClass(contact: OutlookContact) {
    const classes: string[] = [];
    if (selected?.id === contact.id) classes.push("row-selected");
    else if (contact.review_status === "approved") classes.push("row-approved");
    else if (contact.review_status === "denied") classes.push("row-denied");
    return classes.join(" ");
  }

  return (
    <main className="page">
      <div className="header">
        <div>
          <Nav />
          <h1 style={{ marginTop: 12 }}>Relationship Intelligence CRM</h1>
          <p>
            {dataSource === "local"
              ? "Contacts from synced Sent Items — fast local database"
              : "Contacts from Outlook Sent Items — sync recommended for large mailboxes"}
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
              <button
                onClick={handleSync}
                disabled={syncing || sync?.status === "running"}
              >
                {sync?.status === "running"
                  ? "Syncing…"
                  : syncing
                    ? "Starting sync…"
                    : stats?.sync_complete
                      ? "Re-sync Sent Items"
                      : "Sync Sent Items"}
              </button>
              <button className="primary" onClick={handleDisconnect} disabled={disconnecting}>
                {disconnecting ? "Disconnecting…" : "Disconnect Outlook"}
              </button>
            </>
          )}
          <a className="button" href={api.exportXlsxUrl()}>
            Export Excel
          </a>
          <a className="button" href={api.exportCsvUrl()}>
            Export CSV
          </a>
        </div>
      </div>

      {error && <div className="banner error">{error}</div>}

      {auth?.connected && sync?.status === "running" && (
        <div className="banner">
          Importing Sent Items from Outlook: {sync.messages_fetched.toLocaleString()} messages fetched
          {stats?.graph_sent_total ? ` of ${stats.graph_sent_total.toLocaleString()}` : ""}…
        </div>
      )}

      {auth?.connected && stats && stats.external_contacts === 0 && sync?.status !== "running" && (
        <div className="banner">
          No contacts synced yet. Click <strong>Sync Sent Items</strong> to import your mailbox (first run may take 15–30+ minutes).
        </div>
      )}

      {auth?.connected && stats && (
        <div className="stats">
          <div className="stat-card">
            <div className="label">External contacts</div>
            <div className="value">{stats.external_contacts.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="label">Messages synced</div>
            <div className="value">
              {stats.synced_messages.toLocaleString()}
              {stats.graph_sent_total != null ? ` / ${stats.graph_sent_total.toLocaleString()}` : ""}
            </div>
          </div>
          <div className="stat-card">
            <div className="label">Showing in table</div>
            <div className="value">{filteredContacts.length.toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="layout-with-drawer">
        <div style={{ display: "contents", flexDirection: "column", gap: 12 }}>
          <div className="panel">
            <div className="filters">
              <input
                placeholder="Search name, email, or company…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                disabled={!auth?.connected}
              />
              <select
                value={fundraisingTier}
                onChange={(e) => setFundraisingTier(e.target.value)}
                disabled={!auth?.connected}
              >
                <option value="">All relevance</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <input
                placeholder="Min emails"
                value={emailCountMin}
                onChange={(e) => setEmailCountMin(e.target.value)}
                disabled={!auth?.connected}
                inputMode="numeric"
              />
              <select
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value)}
                disabled={!auth?.connected}
              >
                <option value="">All review status</option>
                <option value="pending">To review</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>
            </div>
          </div>

          <div className="table-wrap" ref={tableWrapRef}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Last</th>
                  <th>Emails</th>
                  <th>
                    Relevance{" "}
                    <InfoTip label="How relevance tiers work">
                      <RelevanceTierHelp />
                    </InfoTip>
                  </th>
                  <th>Review</th>
                  <th>Topics</th>
                  <th>Last subject</th>
                  <th>Outlook</th>
                </tr>
              </thead>
              <tbody>
                {!auth?.connected ? (
                  <tr>
                    <td colSpan={11}>Connect Microsoft Outlook to load contacts from Sent Items.</td>
                  </tr>
                ) : loading && contacts.length === 0 ? (
                  <tr>
                    <td colSpan={11}>Loading…</td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={11}>No external contacts found in Sent Items.</td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={11}>No contacts match the current filters.</td>
                  </tr>
                ) : (
                  <>
                    {filteredContacts.map((contact, index) => (
                      <tr
                        key={contact.id}
                        onClick={() => openContact(contact)}
                        style={{ cursor: "pointer" }}
                        className={rowClass(contact)}
                        aria-selected={selected?.id === contact.id}
                      >
                        <td className="serial">{contact.list_number ?? index + 1}</td>
                        <td>{contact.full_name || "—"}</td>
                        <td className="overflow-td">{contact.primary_email}</td>
                        <td>{contact.company_name || "—"}</td>
                        <td>{formatDate(contact.last_contacted_at)}</td>
                        <td>
                          {contact.email_count} / {contact.thread_count}
                        </td>
                        <td>
                          <span className={tierClass(contact.fundraising_relevance_tier)}>
                            {contact.fundraising_relevance_tier || "low"} ({contact.fundraising_relevance_score})
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="review-actions">
                            <span className={reviewClass(contact.review_status)}>{contact.review_status}</span>
                            <button
                              className="review-btn approve"
                              title="Approve — email later"
                              onClick={() => setReviewStatus(contact, "approved")}
                            >
                              ✓
                            </button>
                            <button
                              className="review-btn deny"
                              title="Deny — not interested"
                              onClick={() => setReviewStatus(contact, "denied")}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="chips">
                            {(contact.detected_topics || []).slice(0, 3).map((topic) => (
                              <span className="chip" key={topic}>
                                {topic}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="preview">{contact.last_subject || "—"}</td>
                        <td>
                          {contact.latest_outlook_weblink ? (
                            <a
                              href={contact.latest_outlook_weblink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                    {hasMore && (
                      <tr ref={sentinelRef}>
                        <td colSpan={11} className="load-more">
                          {loadingMore ? "Loading more…" : "Scroll for more"}
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {auth?.connected && (
            <div className="pagination">
              <span>
                {dataSource === "local" && total != null
                  ? filtersActive || q
                    ? `Showing ${filteredContacts.length.toLocaleString()} of ${total.toLocaleString()} contacts`
                    : `Showing ${contacts.length.toLocaleString()} of ${total.toLocaleString()} contacts`
                  : filtersActive
                    ? `Showing ${filteredContacts.length.toLocaleString()} of ${contacts.length.toLocaleString()} loaded contacts`
                    : `Showing ${contacts.length.toLocaleString()} contacts from Sent Items`}
              </span>
              {!hasMore && contacts.length > 0 && <span>End of list reached</span>}
            </div>
          )}
        </div>
        {selected && (
          <>
            <div
              className="drawer-backdrop"
              onClick={() => setSelected(null)}
              aria-hidden="true"
            />
            <aside className="drawer" role="dialog" aria-modal="true" aria-label="Contact details">
            <div className="drawer-header">
              <button className="drawer-close" onClick={() => setSelected(null)} aria-label="Close">
                ✕
              </button>
              <div className="drawer-title">
                <h2>{selected.full_name || selected.primary_email}</h2>
              </div>
              <div className="drawer-meta">{selected.company_name || "—"}</div>
              <div className="drawer-meta">{selected.primary_email}</div>
              <div className="drawer-seniority">
                {seniorityLoading ? (
                  <span className="drawer-seniority-loading">Checking title & seniority…</span>
                ) : seniority ? (
                  <>
                    <span className="drawer-seniority-title">{seniority.title || "Title unknown"}</span>
                    {seniority.is_senior && <span className="chip senior">Senior</span>}
                    <span className="drawer-seniority-level">{seniority.seniority_level.replace(/_/g, " ")}</span>
                  </>
                ) : (
                  <span className="drawer-seniority-loading">Title & seniority unavailable</span>
                )}
              </div>
              {seniority?.reason && <div className="drawer-seniority-reason">{seniority.reason}</div>}
              <div className="drawer-badges">
                <span className={tierClass(selected.fundraising_relevance_tier)}>
                  {selected.fundraising_relevance_tier || "low"} ({selected.fundraising_relevance_score})
                </span>
                <span className={reviewClass(selected.review_status)}>{selected.review_status}</span>
              </div>
              <div className="review-actions drawer-review">
                <button className="review-btn approve" onClick={() => setReviewStatus(selected, "approved")}>
                  Approve to email
                </button>
                <button className="review-btn deny" onClick={() => setReviewStatus(selected, "denied")}>
                  Deny
                </button>
                {selected.review_status !== "pending" && (
                  <button className="review-btn reset" onClick={() => setReviewStatus(selected, "pending")}>
                    Reset
                  </button>
                )}
              </div>
            </div>

            {detailLoading ? (
              <div className="drawer-loading">Loading contact details…</div>
            ) : (
              <>
                <section className="drawer-section">
                  <h3>Recent emails</h3>
                  {recentEmailsLoading ? (
                    <p className="drawer-relationship-loading">Loading recent emails…</p>
                  ) : recentEmails.length === 0 ? (
                    <p className="drawer-relationship-loading">No exchanged emails found.</p>
                  ) : (
                    <div className="drawer-email-list">
                      {recentEmails.map((email, index) => (
                        <article className="drawer-email-item" key={`${email.sent_datetime}-${index}`}>
                          <div className="drawer-email-meta">
                            <span className={`chip direction ${email.direction}`}>
                              {directionLabel(email.direction)}
                            </span>
                            <span className="drawer-email-date">{formatDate(email.sent_datetime)}</span>
                          </div>
                          <p className="drawer-subject">{email.subject || "—"}</p>
                          <p className="drawer-body preview-block">
                            {email.body_preview || "No preview available."}
                          </p>
                          {email.outlook_weblink && (
                            <a href={email.outlook_weblink} target="_blank" rel="noreferrer">
                              Open in Outlook →
                            </a>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
                <section className="drawer-section">
                  <h3>Relationship analysis</h3>
                  {relationshipLoading ? (
                    <p className="drawer-relationship-loading">
                      Fetching exchanged emails and analyzing relationship…
                    </p>
                  ) : relationship ? (
                    <>
                      <div className="drawer-stats">
                        <div className="drawer-stat">
                          <span className="label">Sent by you</span>
                          <span className="value">{relationship.stats.outbound_count}</span>
                        </div>
                        <div className="drawer-stat">
                          <span className="label">Received</span>
                          <span className="value">{relationship.stats.inbound_count}</span>
                        </div>
                        <div className="drawer-stat">
                          <span className="label">Threads</span>
                          <span className="value">{relationship.stats.thread_count}</span>
                        </div>
                        <div className="drawer-stat">
                          <span className="label">Back-and-forth</span>
                          <span className="value">
                            {relationship.stats.has_two_way ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                      <div className="drawer-relationship-badges">
                        <span className="chip">
                          {patternLabel(relationship.analysis.conversation_pattern)}
                        </span>
                        <span className="chip">
                          {relationship.analysis.conversation_depth} depth
                        </span>
                        {relationship.analysis.primary_value &&
                          relationship.analysis.primary_value !== "unknown" &&
                          relationship.analysis.primary_value !== "limited" && (
                            <span className="chip primary-value">
                              {USEFULNESS_LABELS[relationship.analysis.primary_value] ||
                                relationship.analysis.primary_value.replace(/_/g, " ")}
                            </span>
                          )}
                      </div>
                      {usefulnessEntries(relationship.analysis).length > 0 && (
                        <div className="chips" style={{ marginTop: 12 }}>
                          {usefulnessEntries(relationship.analysis).map(([key, value]) => (
                            <span className={`chip usefulness ${value}`} key={key}>
                              {USEFULNESS_LABELS[key] || key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="drawer-relationship-summary">{relationship.analysis.summary}</p>
                      {relationship.analysis.reason && (
                        <p className="drawer-relationship-reason">{relationship.analysis.reason}</p>
                      )}
                    </>
                  ) : (
                    <p className="drawer-relationship-loading">Relationship analysis unavailable</p>
                  )}
                </section>
                <section className="drawer-section">
                  <h3>Details</h3>
                  <div className="drawer-stats">
                    <div className="drawer-stat">
                      <span className="label">Emails</span>
                      <span className="value">
                        {relationship?.stats
                          ? `${relationship.stats.total_count} analyzed`
                          : `${selected.email_count} / ${selected.thread_count}`}
                      </span>
                    </div>
                    <div className="drawer-stat">
                      <span className="label">Last contacted</span>
                      <span className="value">{formatDate(selected.last_contacted_at)}</span>
                    </div>
                    <div className="drawer-stat">
                      <span className="label">Title</span>
                      <span className="value">{seniority?.title || selected.detected_role || "—"}</span>
                    </div>
                    <div className="drawer-stat">
                      <span className="label">Company</span>
                      <span className="value">{selected.company_name || "—"}</span>
                    </div>
                  </div>
                  {(selected.detected_topics || []).length > 0 && (
                    <div className="chips" style={{ marginTop: 12 }}>
                      {(selected.detected_topics || []).map((topic) => (
                        <span className="chip" key={topic}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
            </aside>
          </>
        )}
      </div>
    </main>
  );
}
