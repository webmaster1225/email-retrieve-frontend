"use client";

import { useEffect, useState } from "react";
import { OBJECTIVE_CHIPS, NORTHWYN_OBJECTIVE } from "@/lib/compass/northwynScenario";
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
    onStart(objective.trim() || NORTHWYN_OBJECTIVE);
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

  return (
    <div className="compass-home">
      <h1 className="compass-home-title">
        What would you like to accomplish through your relationships?
      </h1>

      <div className="compass-objective-row">
        <textarea
          className="compass-objective-input"
          rows={3}
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
        <button type="button" className="compass-mic" disabled title="Voice — coming later">
          🎤
        </button>
      </div>

      <div className="compass-chips">
        {OBJECTIVE_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className="compass-chip"
            onClick={() => {
              const text = chip === "Fundraising help" ? NORTHWYN_OBJECTIVE : chip;
              onObjectiveChange(text);
              onStart(text);
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      <button type="button" className="button primary compass-start-btn" onClick={submit}>
        Continue
      </button>

      <section className="compass-section">
        <h2 className="compass-section-label">Where should I look?</h2>
        <p className="compass-muted" style={{ marginTop: 0 }}>
          Connected mailboxes from Settings — only real accounts you have OAuth&apos;d
        </p>
        {accountsError ? <p className="compass-warn">{accountsError}</p> : null}
        {liveAccounts === null ? <p className="compass-muted">Loading mailboxes…</p> : null}
        {liveAccounts && displayAccounts.length === 0 ? (
          <p className="compass-muted">
            No mailboxes loaded. Connect Edge, Northwyn, Galaxy, or Careers in{" "}
            <a href="/settings">Settings</a>.
          </p>
        ) : null}
        <div className="compass-account-grid">
          {displayAccounts.map((acct) => (
            <AccountCard
              key={acct.id}
              account={acct}
              included={includedAccounts[acct.id] ?? false}
              liveStatus={"liveStatus" in acct ? acct.liveStatus : undefined}
              connected={"connected" in acct ? acct.connected : undefined}
              onToggle={() => onToggleAccount(acct.id)}
              onDetails={() => onStub?.(`${acct.name} details`)}
            />
          ))}
        </div>
      </section>

      <section className="compass-section">
        <h2 className="compass-section-label">Active campaigns</h2>
        {liveCampaigns === null ? <p className="compass-muted">Loading campaigns…</p> : null}
        <ul className="compass-campaign-list">
          {activeCampaigns.length === 0 && liveCampaigns !== null ? (
            <li className="compass-muted">No campaigns yet — start with an objective above.</li>
          ) : null}
          {activeCampaigns.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="compass-campaign-item"
                onClick={() =>
                  onOpenCampaign ? onOpenCampaign(c.id) : onStub?.(c.title || c.objective_raw || "")
                }
              >
                <span className="compass-campaign-arrow">▸</span>
                <span>
                  <strong>{c.title || c.objective_raw?.slice(0, 60) || c.id}</strong>
                  <span className="compass-muted">
                    {" "}
                    — {c.status}
                    {typeof c.sent === "number" ? ` · ${c.sent} sent` : ""}
                    {typeof c.replied === "number" ? ` · ${c.replied} replied` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="compass-footer-note">
        🔒 Connected: {connectedCount} account{connectedCount === 1 ? "" : "s"} · data stays in
        your tenant ·{" "}
        <button type="button" className="compass-text-link" onClick={() => onStub?.("Audit")}>
          Audit
        </button>
      </p>
    </div>
  );
}
