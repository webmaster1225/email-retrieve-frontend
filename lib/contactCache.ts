import { OutlookContact } from "@/lib/api";

const CACHE_KEY = "crm-contacts-v2";

export type ContactCacheFilters = {
  q: string;
  fundraisingTier: string;
  emailCountMin: string;
  reviewFilter: string;
};

export type ContactCache = {
  contacts: OutlookContact[];
  page: number;
  total: number | null;
  source: "local" | "outlook";
  filters: ContactCacheFilters;
  userEmail: string | null;
};

function filtersMatch(a: ContactCacheFilters, b: ContactCacheFilters) {
  return (
    a.q === b.q &&
    a.fundraisingTier === b.fundraisingTier &&
    a.emailCountMin === b.emailCountMin &&
    a.reviewFilter === b.reviewFilter
  );
}

export function loadContactCache(
  userEmail: string | null,
  filters: ContactCacheFilters
): ContactCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as ContactCache;
    if (cached.userEmail !== userEmail) return null;
    if (!filtersMatch(cached.filters, filters)) return null;
    if (!cached.contacts.length) return null;
    return cached;
  } catch {
    return null;
  }
}

export function saveContactCache(data: ContactCache) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Quota exceeded — drop cache silently.
  }
}

export function clearContactCache() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CACHE_KEY);
}
