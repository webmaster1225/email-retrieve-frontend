import type { MailboxAccount } from "@/lib/api";
import type { AccountId, AccountView } from "@/lib/compass/types";

export function mailboxToFixture(live: MailboxAccount): AccountView {
  return {
    id: live.id as AccountId,
    name: live.display_name,
    email: live.email,
    blurb: live.blurb,
    synced: live.last_sync_plain
      ? `today ${live.last_sync_plain.replace("up to date ", "")}`
      : "not synced yet",
    defaultIncluded: live.default_included,
    recruiting: live.is_functional,
    badge:
      live.id === "northwyn"
        ? "NW"
        : live.id === "edge"
          ? "EI"
          : live.id === "galaxy"
            ? "GP"
            : "GC",
  };
}

export function accountLabelForIds(
  accounts: MailboxAccount[],
  ids: string[],
): string {
  if (!ids.length) return "selected mailboxes";
  return accounts
    .filter((a) => ids.includes(a.id))
    .map((a) => a.display_name)
    .join(" + ");
}

export function pickRecommendedSendingAccount(
  accounts: MailboxAccount[],
  campaignAccountIds: string[] | undefined,
): MailboxAccount | null {
  const connected = accounts.filter((a) => a.connected && a.can_send);
  const scoped =
    campaignAccountIds?.length
      ? connected.filter((a) => campaignAccountIds.includes(a.id))
      : connected;
  const pool = scoped.length ? scoped : connected;
  return (
    pool.find((a) => a.id === "northwyn") ||
    pool.find((a) => !a.is_functional) ||
    pool[0] ||
    null
  );
}

export function sendingOptionsForCampaign(
  accounts: MailboxAccount[],
  campaignAccountIds: string[] | undefined,
): MailboxAccount[] {
  const connected = accounts.filter((a) => a.connected && a.can_send);
  if (!campaignAccountIds?.length) return connected;
  const inScope = connected.filter((a) => campaignAccountIds.includes(a.id));
  return inScope.length ? inScope : connected;
}
