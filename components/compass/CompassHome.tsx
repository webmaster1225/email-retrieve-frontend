"use client";

import { useEffect, useMemo, useState } from "react";
import { OBJECTIVE_CHIPS } from "@/lib/compass/northwynScenario";
import type { AccountId, AccountView } from "@/lib/compass/types";
import { mailboxToFixture } from "@/lib/compass/accountUtils";
import { api, type MailboxAccount } from "@/lib/api";
import { AccountCard } from "./AccountCard";

type CampaignSummary = {
  id: string;
  title: string | null;
  status: string;
  objective_raw?: string;
  sent?: number;
  replied?: number;
};

type Props = {
  objective: string;
  onObjectiveChange: (v: string) => void;
  includedAccounts: Record<AccountId, boolean>;
  onToggleAccount: (id: AccountId) => void;
  onStart: (objective: string) => void;
  onStub?: (label: string) => void;
  onLiveAccountsLoaded?: (accounts: MailboxAccount[]) => void;
  onOpenCampaign?: (id: string) => void;
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export function CompassHome({
  objective,
  onObjectiveChange,
  includedAccounts,
  onToggleAccount,
  onStart,
  onStub,
  onLiveAccountsLoaded,
  onOpenCampaign,
}: Props) {
  const [liveAccounts, setLiveAccounts] = useState<MailboxAccount[] | null>(null);
  const [liveCampaigns, setLiveCampaigns] = useState<CampaignSummary[] | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listAccounts()
      .then((rows) => {
        if (cancelled) return;
        setLiveAccounts(rows);
        onLiveAccountsLoaded?.(rows);
        setAccountsError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setLiveAccounts([]);
        setAccountsError(e instanceof Error ? e.message : "Could not load mailboxes");
      });
    return () => {
      cancelled = true;
    };
  }, [onLiveAccountsLoaded]);

  useEffect(() => {
    let cancelled = false;
    api
      .listCampaignsSummary()
      .then((rows) => {
        if (!cancelled) setLiveCampaigns(rows);
      })
      .catch(() => {
        if (!cancelled) setLiveCampaigns([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = () => {
    const text = objective.trim();
    if (!text) return;
    onStart(text);
  };

  const displayAccounts: (AccountView & {
    liveStatus?: string;
    connected?: boolean;
  })[] =
    liveAccounts && liveAccounts.length > 0
      ? liveAccounts.map((a) => ({
          ...mailboxToFixture(a),
          liveStatus: a.plain_message || a.last_sync_plain || a.status,
          connected: a.connected,
        }))
      : [];

  const activeCampaigns = liveCampaigns || [];
  const connectedCount = liveAccounts?.filter((a) => a.connected).length ?? 0;
  const includedCount = displayAccounts.filter((a) => includedAccounts[a.id]).length;
  const selectedCount = selectedIds.size;
  const allSelected =
    activeCampaigns.length > 0 && activeCampaigns.every((c) => selectedIds.has(c.id));

  const selectedLabel = useMemo(() => {
    if (selectedCount === 0) return "";
    if (selectedCount === 1) return "1 campaign";
    return `${selectedCount} campaigns`;
  }, [selectedCount]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(activeCampaigns.map((c) => c.id)));
  };

  const deleteCampaigns = async (ids: string[]) => {
    if (!ids.length || deleting) return;
    const label =
      ids.length === 1
        ? activeCampaigns.find((c) => c.id === ids[0])?.title ||
          activeCampaigns.find((c) => c.id === ids[0])?.objective_raw?.slice(0, 40) ||
          "this campaign"
        : `${ids.length} campaigns`;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      if (ids.length === 1) {
        await api.deleteCampaign(ids[0]);
      } else {
        await api.deleteCampaigns(ids);
      }
      setLiveCampaigns((prev) => (prev ? prev.filter((c) => !ids.includes(c.id)) : prev));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Could not delete campaign(s)");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="compass-home">
      <header className="compass-home-header">
        <div>
          <h1 className="compass-home-title">
            What would you like to accomplish through your relationships?
          </h1>
          <p className="compass-home-subtitle">
            Describe your goal, choose mailboxes, and continue — Compass ranks real
            relationships from your synced history.
          </p>
        </div>
        <p className="compass-home-meta">
          <span>{connectedCount} connected</span>
          <span>{includedCount} included</span>
        </p>
      </header>

      <div className="compass-home-grid">
        <section className="compass-home-start" aria-label="Active campaigns">
          <div className="compass-home-panel-head">
            <h2 className="compass-section-label">Active campaigns</h2>
            <div className="compass-home-campaign-actions">
              {selectedCount > 0 ? (
                <button
                  type="button"
                  className="button small compass-home-delete-btn"
                  disabled={deleting}
                  onClick={() => deleteCampaigns([...selectedIds])}
                >
                  {deleting ? "Deleting…" : `Delete (${selectedCount})`}
                </button>
              ) : null}
              {activeCampaigns.length > 0 ? (
                <label className="compass-home-select-all">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    disabled={deleting}
                    onChange={toggleSelectAll}
                    aria-label="Select all campaigns"
                  />
                  <span className="compass-muted">
                    All
                  </span>
                </label>
              ) : (
                <span className="compass-muted">0 open</span>
              )}
            </div>
          </div>
          <div className="compass-home-panel-body">
            {deleteError ? <p className="compass-warn">{deleteError}</p> : null}
            {liveCampaigns === null ? (
              <p className="compass-muted">Loading campaigns…</p>
            ) : null}
            {activeCampaigns.length === 0 && liveCampaigns !== null ? (
              <p className="compass-muted compass-home-empty">
                No campaigns yet — start with an objective on the left.
              </p>
            ) : null}
            <ul className="compass-campaign-list compass-campaign-list--home">
              {activeCampaigns.map((c) => {
                const selected = selectedIds.has(c.id);
                const openCampaign = () => {
                  if (onOpenCampaign) onOpenCampaign(c.id);
                  else onStub?.(c.title || c.objective_raw || "");
                };
                return (
                  <li key={c.id} className={selected ? "is-selected" : undefined}>
                    <div
                      role="button"
                      tabIndex={0}
                      className="compass-campaign-item compass-campaign-item--home"
                      onClick={openCampaign}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openCampaign();
                        }
                      }}
                    >
                      <span className="compass-campaign-item-main">
                        <span className="compass-campaign-item-text">
                          <strong>{c.title || c.objective_raw?.slice(0, 72) || c.id}</strong>
                          <span className="compass-campaign-arrow" aria-hidden>
                            →
                          </span>
                        </span>
                        <span className="compass-campaign-item-meta">
                          <span className="compass-status-pill">{formatStatus(c.status)}</span>
                          {typeof c.sent === "number" ? `${c.sent} sent / ` : null}
                          {typeof c.replied === "number" ? `${c.replied} replied` : null}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        className="compass-campaign-check"
                        checked={selected}
                        disabled={deleting}
                        aria-label={`Select ${c.title || c.objective_raw || "campaign"}`}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleSelect(c.id)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
        <div className="compass-home-panels">
          <div className="compass-home-panel compass-home-panel--start" aria-label="Start a campaign">
            <label className="compass-home-field-label" htmlFor="compass-objective">
              Objective
            </label>
            <textarea
              id="compass-objective"
              className="compass-objective-input compass-objective-input--home"
              rows={2}
              placeholder="e.g. Help with Northwyn's capital raise"
              value={objective}
              onChange={(e) => onObjectiveChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />

            <p className="compass-home-field-label">Quick starts</p>
            <div className="compass-chips compass-chips--home">
              {OBJECTIVE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="compass-chip"
                  onClick={() => {
                    onObjectiveChange(chip);
                    onStart(chip);
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="button primary compass-start-btn compass-start-btn--home"
              onClick={submit}
              disabled={!objective.trim()}
            >
              Continue
            </button>
          </div>
          <div className="compass-home-panel" aria-label="Mailboxes">
            <div className="compass-home-panel-head">
              <h2 className="compass-section-label">Where should I look?</h2>
              <span className="compass-muted">
                {includedCount}/{displayAccounts.length || 0} selected
              </span>
            </div>
            <div className="compass-home-panel-body">
              {accountsError ? <p className="compass-warn">{accountsError}</p> : null}
              {liveAccounts === null ? (
                <p className="compass-muted">Loading mailboxes…</p>
              ) : null}
              {liveAccounts && displayAccounts.length === 0 ? (
                <p className="compass-muted">
                  No mailboxes loaded. Connect accounts on the <a href="/">Contacts</a> page.
                </p>
              ) : null}
              <div className="compass-account-grid compass-account-grid--home">
                {displayAccounts.map((acct) => (
                  <AccountCard
                    key={acct.id}
                    compact
                    account={acct}
                    included={includedAccounts[acct.id] ?? false}
                    liveStatus={"liveStatus" in acct ? acct.liveStatus : undefined}
                    connected={"connected" in acct ? acct.connected : undefined}
                    onToggle={() => onToggleAccount(acct.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
