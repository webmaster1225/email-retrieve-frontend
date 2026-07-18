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

// Keep within /contacts max (100).
const PAGE_SIZE = 50;
const OUTLOOK_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

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
  const [hasNextPage, setHasNextPage] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sync, setSync] = useState<SyncRun | null>(null);
  const [dataSource, setDataSource] = useState<"local" | "outlook">("outlook");
  const [selected, setSelected] = useState<OutlookContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
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
  const [debouncedQ, setDebouncedQ] = useState("");
  const [fundraisingTier, setFundraisingTier] = useState("");
  const [emailCountMin, setEmailCountMin] = useState("");
  const [debouncedEmailCountMin, setDebouncedEmailCountMin] = useState("");
  const [reviewFilter, setReviewFilter] = useState("");
  const [page, setPage] = useState(1);

  const loadGenRef = useRef(0);
  const contactsRef = useRef<OutlookContact[]>([]);
  const pageRef = useRef(1);
  const totalRef = useRef<number | null>(null);
  const useLocalRef = useRef(false);
  const loadedKeyRef = useRef<string | null>(null);
  const outlookCursorsRef = useRef<Map<number, string | null>>(new Map([[1, null]]));
  const filterKeyRef = useRef<string | null>(null);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    totalRef.current = total;
  }, [total]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedEmailCountMin(emailCountMin.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [emailCountMin]);

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
    (items: OutlookContact[], pageNum: number, source: "local" | "outlook", totalCount: number | null) => {
      saveContactCache({
        contacts: items,
        page: pageNum,
        total: totalCount,
        source,
        filters: currentFilters(debouncedQ, fundraisingTier, debouncedEmailCountMin, reviewFilter),
        userEmail: auth?.user_email ?? null,
      });
    },
    [auth?.user_email, debouncedQ, fundraisingTier, debouncedEmailCountMin, reviewFilter]
  );

  const resetOutlookCursors = useCallback(() => {
    outlookCursorsRef.current = new Map([[1, null]]);
  }, []);

  const loadContactsPage = useCallback(
    async (pageNum: number, useLocal = useLocalRef.current) => {
      const gen = loadGenRef.current;
      const isInitial = contactsRef.current.length === 0;
      if (isInitial) setLoading(true);
      else setPageLoading(true);
      setError(null);
      try {
        if (useLocal) {
          const params: Record<string, string | number | boolean> = {
            page: pageNum,
            page_size: PAGE_SIZE,
            exclude_internal: true,
            exclude_noise: true,
            sort: "last_contacted_at",
            order: "desc",
            include_total: true,
          };
          if (debouncedQ) params.q = debouncedQ;
          if (fundraisingTier) params.fundraising_tier = fundraisingTier;
          if (debouncedEmailCountMin) {
            const minEmails = Number(debouncedEmailCountMin);
            if (!Number.isNaN(minEmails)) params.email_count_min = minEmails;
          }
          if (reviewFilter) params.review_status = reviewFilter;

          const contactData = await api.contacts(params);
          if (gen !== loadGenRef.current) return;

          const rows = contactData.items.map(contactToRow);
          const nextTotal = contactData.total ?? totalRef.current;
          setContacts(rows);
          setDataSource("local");
          setTotal(nextTotal);
          pageRef.current = pageNum;
          const hasMore =
            nextTotal != null ? pageNum * PAGE_SIZE < nextTotal : rows.length >= PAGE_SIZE;
          setHasNextPage(hasMore);
          persistCache(rows, pageNum, "local", nextTotal);
        } else {
          const cursor = outlookCursorsRef.current.has(pageNum)
            ? outlookCursorsRef.current.get(pageNum) ?? null
            : null;
          if (pageNum > 1 && !outlookCursorsRef.current.has(pageNum)) {
            throw new Error("That page is not loaded yet. Use Next to move forward.");
          }

          const contactData = await api.outlookContacts({
            page_size: OUTLOOK_PAGE_SIZE,
            next_link: cursor || undefined,
            q: debouncedQ || undefined,
            include_total: pageNum === 1,
            prefer_local: false,
          });
          if (gen !== loadGenRef.current) return;

          if (contactData.next_link) {
            outlookCursorsRef.current.set(pageNum + 1, contactData.next_link);
          }
          setContacts(contactData.items);
          setDataSource("outlook");
          setHasNextPage(!!contactData.next_link);
          if (contactData.total != null) setTotal(contactData.total);
          pageRef.current = pageNum;
          persistCache(contactData.items, pageNum, "outlook", contactData.total ?? totalRef.current);
        }
      } catch (err) {
        if (gen !== loadGenRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to load contacts");
      } finally {
        if (gen !== loadGenRef.current) return;
        setLoading(false);
        setPageLoading(false);
      }
    },
    [debouncedQ, fundraisingTier, debouncedEmailCountMin, reviewFilter, persistCache]
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
      setHasNextPage(false);
      setTotal(null);
      setStats(null);
      setSync(null);
      setLoading(false);
      setPage(1);
      loadedKeyRef.current = null;
      filterKeyRef.current = null;
      resetOutlookCursors();
      return;
    }

    const filters = currentFilters(debouncedQ, fundraisingTier, debouncedEmailCountMin, reviewFilter);
    const filterKey = JSON.stringify(filters);
    const filtersChanged = filterKeyRef.current !== filterKey;

    if (filtersChanged) {
      filterKeyRef.current = filterKey;
      loadedKeyRef.current = null;
      resetOutlookCursors();
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    const cacheKey = `${filterKey}|${page}`;
    if (loadedKeyRef.current === cacheKey) return;

    const cached = loadContactCache(auth.user_email, filters);
    if (cached && cached.page === page) {
      loadedKeyRef.current = cacheKey;
      loadGenRef.current += 1;
      useLocalRef.current = cached.source === "local";
      setContacts(cached.contacts);
      setTotal(cached.total);
      setDataSource(cached.source);
      pageRef.current = cached.page;
      setHasNextPage(
        cached.total != null
          ? cached.page * PAGE_SIZE < cached.total
          : cached.contacts.length >= PAGE_SIZE
      );
      setLoading(false);
      return;
    }

    loadedKeyRef.current = cacheKey;
    useLocalRef.current = true;
    loadGenRef.current += 1;
    loadContactsPage(page, true);
  }, [
    auth?.connected,
    auth?.user_email,
    page,
    debouncedQ,
    fundraisingTier,
    debouncedEmailCountMin,
    reviewFilter,
    loadContactsPage,
    resetOutlookCursors,
  ]);

  // If optimistic local load returned nothing and there is no synced data, use Outlook Graph.
  useEffect(() => {
    if (!auth?.connected || stats === null) return;
    if (useLocalRef.current && stats.external_contacts === 0 && contacts.length === 0 && !loading) {
      const filters = currentFilters(debouncedQ, fundraisingTier, debouncedEmailCountMin, reviewFilter);
      const cacheKey = `${JSON.stringify(filters)}|${page}`;
      loadedKeyRef.current = cacheKey;
      useLocalRef.current = false;
      loadGenRef.current += 1;
      resetOutlookCursors();
      setTotal(null);
      setHasNextPage(false);
      loadContactsPage(page, false);
    }
  }, [
    auth?.connected,
    stats,
    contacts.length,
    loading,
    page,
    debouncedQ,
    fundraisingTier,
    debouncedEmailCountMin,
    reviewFilter,
    loadContactsPage,
    resetOutlookCursors,
  ]);

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
          const filters = currentFilters(debouncedQ, fundraisingTier, debouncedEmailCountMin, reviewFilter);
          const cacheKey = `${JSON.stringify(filters)}|1`;
          loadedKeyRef.current = cacheKey;
          filterKeyRef.current = JSON.stringify(filters);
          loadGenRef.current += 1;
          resetOutlookCursors();
          clearContactCache();
          useLocalRef.current = true;
          setContacts([]);
          setPage(1);
          loadContactsPage(1, true);
        }
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [
    sync,
    refreshStats,
    loadContactsPage,
    debouncedQ,
    fundraisingTier,
    debouncedEmailCountMin,
    reviewFilter,
    resetOutlookCursors,
  ]);

  const filteredContacts = useMemo(() => {
    if (dataSource === "local") return contacts;
    const minEmails = debouncedEmailCountMin === "" ? null : Number(debouncedEmailCountMin);
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
  }, [contacts, dataSource, fundraisingTier, debouncedEmailCountMin, reviewFilter]);

  const filtersActive = Boolean(
    debouncedQ || fundraisingTier || debouncedEmailCountMin || reviewFilter
  );
  const totalPages =
    total != null && total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : null;
  const rangeFrom = contacts.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = contacts.length === 0 ? 0 : (page - 1) * PAGE_SIZE + contacts.length;
  const canGoPrev = page > 1 && !loading && !pageLoading;
  const canGoNext = hasNextPage && !loading && !pageLoading;
  const [pageInput, setPageInput] = useState(String(page));

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  function goToPage(nextPage: number) {
    if (loading || pageLoading) return;
    const maxPage = totalPages ?? (hasNextPage ? page + 1 : page);
    const target = Math.min(Math.max(1, Math.floor(nextPage)), maxPage);
    if (target === page) {
      setPageInput(String(page));
      return;
    }
    // Outlook cursor pagination only has links for visited pages (+ next).
    if (dataSource === "outlook" && target > page) {
      const known = outlookCursorsRef.current.has(target);
      const isNext = target === page + 1 && hasNextPage;
      if (!known && !isNext) {
        setPageInput(String(page));
        return;
      }
    }
    setPage(target);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function submitPageInput() {
    const parsed = Number(pageInput.trim());
    if (!Number.isFinite(parsed)) {
      setPageInput(String(page));
      return;
    }
    goToPage(parsed);
  }

  function updateFilter<T>(setter: (value: T) => void, value: T) {
    setter(value);
    if (page !== 1) setPage(1);
  }

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

  async function handleClearStuckSync() {
    setSyncing(true);
    setError(null);
    try {
      await api.failRunningSyncs();
      const status = await api.syncStatus();
      setSync(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear stuck sync");
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
      setHasNextPage(false);
      setTotal(null);
      setStats(null);
      setSync(null);
      setSelected(null);
      setPage(1);
      resetOutlookCursors();
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

  const isSyncing = syncing || sync?.status === "running";
  const pageBusy = Boolean(auth?.connected && (isSyncing || (loading && contacts.length === 0)));

  useEffect(() => {
    if (!pageBusy) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [pageBusy]);

  useEffect(() => {
    if (pageBusy) setSelected(null);
  }, [pageBusy]);

  const busyTitle = isSyncing
    ? sync?.status === "running"
      ? `Syncing ${sync.sync_type === "inbox" ? "Inbox" : "Sent Items"}…`
      : "Starting sync…"
    : "Loading contacts…";

  const syncTotal = stats?.graph_sent_total ?? null;
  const syncFetched = sync?.status === "running" ? sync.messages_fetched : 0;
  const loadTotal = total ?? stats?.external_contacts ?? null;
  const loadCurrent = rangeTo;

  const busyProgressPct =
    sync?.status === "running" && syncTotal && syncTotal > 0
      ? Math.min(100, Math.round((syncFetched / syncTotal) * 100))
      : loading && loadCurrent > 0 && loadTotal && loadTotal > 0
        ? Math.min(100, Math.round((loadCurrent / loadTotal) * 100))
        : null;

  const busyDetail =
    sync?.status === "running"
      ? `${syncFetched.toLocaleString()} messages fetched${
          syncTotal ? ` of ${syncTotal.toLocaleString()}` : ""
        }${busyProgressPct != null ? ` · ${busyProgressPct}%` : ""}`
      : loading
        ? loadCurrent > 0 && loadTotal && loadTotal > 0
          ? `${Math.min(loadCurrent, loadTotal).toLocaleString()} of ${loadTotal.toLocaleString()} contacts`
          : "Please wait while contacts load from the database."
        : "Connecting to Outlook…";

  return (
    <main className="page" aria-busy={pageBusy}>
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
                disabled={pageBusy || !auth?.connected}
              >
                {sync?.status === "running"
                  ? "Syncing…"
                  : syncing
                    ? "Starting sync…"
                    : stats?.sync_complete
                      ? "Re-sync Sent Items"
                      : "Sync Sent Items"}
              </button>
              <button className="primary" onClick={handleDisconnect} disabled={disconnecting || pageBusy}>
                {disconnecting ? "Disconnecting…" : "Disconnect Outlook"}
              </button>
            </>
          )}
          <a
            className={`button${pageBusy ? " disabled" : ""}`}
            href={pageBusy ? undefined : api.exportXlsxUrl()}
            aria-disabled={pageBusy}
            onClick={(e) => {
              if (pageBusy) e.preventDefault();
            }}
          >
            Export Excel
          </a>
          <a
            className={`button${pageBusy ? " disabled" : ""}`}
            href={pageBusy ? undefined : api.exportCsvUrl()}
            aria-disabled={pageBusy}
            onClick={(e) => {
              if (pageBusy) e.preventDefault();
            }}
          >
            Export CSV
          </a>
        </div>
      </div>

      {error && <div className="banner error">{error}</div>}

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
                disabled={!auth?.connected || pageBusy}
              />
              <select
                value={fundraisingTier}
                onChange={(e) => updateFilter(setFundraisingTier, e.target.value)}
                disabled={!auth?.connected || pageBusy}
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
                disabled={!auth?.connected || pageBusy}
                inputMode="numeric"
              />
              <select
                value={reviewFilter}
                onChange={(e) => updateFilter(setReviewFilter, e.target.value)}
                disabled={!auth?.connected || pageBusy}
              >
                <option value="">All review status</option>
                <option value="pending">To review</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>
            </div>
          </div>

          <div className={`table-wrap${pageLoading ? " table-wrap-loading" : ""}`}>
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
                    <td colSpan={11}>
                      {filtersActive
                        ? "No contacts match the current filters."
                        : "No external contacts found in Sent Items."}
                    </td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={11}>No contacts match the current filters.</td>
                  </tr>
                ) : (
                  filteredContacts.map((contact, index) => (
                    <tr
                      key={contact.id}
                      onClick={() => openContact(contact)}
                      style={{ cursor: "pointer" }}
                      className={rowClass(contact)}
                      aria-selected={selected?.id === contact.id}
                    >
                      <td className="serial">
                        {contact.list_number ?? (page - 1) * PAGE_SIZE + index + 1}
                      </td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {auth?.connected && (
            <div className="pagination">
              <span>
                {contacts.length === 0
                  ? filtersActive
                    ? "No matching contacts"
                    : "No contacts to show"
                  : total != null
                    ? `Showing ${rangeFrom.toLocaleString()}–${rangeTo.toLocaleString()} of ${total.toLocaleString()}${
                        filtersActive ? " matching" : ""
                      } contacts`
                    : `Showing ${rangeFrom.toLocaleString()}–${rangeTo.toLocaleString()} on this page`}
                {pageLoading ? " · Loading…" : ""}
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="button"
                  disabled={!canGoPrev}
                  onClick={() => goToPage(page - 1)}
                >
                  Previous
                </button>
                <label className="pagination-goto">
                  <span>Page</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={totalPages ?? undefined}
                    value={pageInput}
                    disabled={loading || pageLoading || contacts.length === 0}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={submitPageInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitPageInput();
                      }
                    }}
                    aria-label="Go to page"
                  />
                  {totalPages != null && <span>of {totalPages.toLocaleString()}</span>}
                </label>
                <button
                  type="button"
                  className="button"
                  disabled={!canGoNext}
                  onClick={() => goToPage(page + 1)}
                >
                  Next
                </button>
              </div>
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

      {pageBusy && (
        <div className="page-busy-overlay" role="alertdialog" aria-modal="true" aria-labelledby="page-busy-title">
          <div className="page-busy-card">
            <div className="page-busy-spinner" aria-hidden="true" />
            <h2 id="page-busy-title">{busyTitle}</h2>
            <p>{busyDetail}</p>
            <div
              className={`page-busy-progress${busyProgressPct == null ? " page-busy-progress-indeterminate" : ""}`}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={busyProgressPct ?? undefined}
              aria-label={busyTitle}
            >
              <div
                className="page-busy-progress-bar"
                style={busyProgressPct != null ? { width: `${busyProgressPct}%` } : undefined}
              />
            </div>
            {sync?.status === "running" && (
              <button
                type="button"
                className="button"
                onClick={handleClearStuckSync}
                disabled={syncing}
                title="Use if sync froze after an app restart"
              >
                Clear stuck sync
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}