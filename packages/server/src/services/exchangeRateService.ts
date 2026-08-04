const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // Frankfurter (ECB-sourced) updates once/business day — no need to refetch more often.
const FETCH_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 500;

interface CacheEntry {
  rate: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRateOnce(base: string, symbol: string): Promise<number> {
  const res = await fetch(`${FRANKFURTER_BASE}/latest?base=${base}&symbols=${symbol}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Frankfurter responded ${res.status}`);
  }
  const data = (await res.json()) as { rates: Record<string, number> };
  const rate = data.rates[symbol];
  if (typeof rate !== "number") {
    throw new Error(`No rate returned for base=${base} symbols=${symbol}`);
  }
  return rate;
}

// One retry after a short delay — empirically, Frankfurter fails intermittently under back-to-back
// requests regardless of which currency is the base (observed both base=INR and base=USD fail in
// the same test session, inconsistently), so this isn't targeting one specific currency, just
// general transient flakiness in a free/unauthenticated API.
async function fetchRateWithRetry(base: string, symbol: string): Promise<number> {
  try {
    return await fetchRateOnce(base, symbol);
  } catch {
    await sleep(RETRY_DELAY_MS);
    return fetchRateOnce(base, symbol);
  }
}

/**
 * Rate to convert an amount FROM one currency TO another, via the free Frankfurter API
 * (api.frankfurter.dev — no key required, verified directly against the live endpoint; see
 * specifications/12-multi-currency.md). Cached in-memory per {from,to} pair for CACHE_TTL_MS.
 *
 * Resilience, in order: retry once same-direction, then try the *inverse* query (`base=to,
 * symbols=from`, inverting the result) with its own retry, before giving up. Frankfurter has
 * observable intermittent failures under rapid requests (not tied to one specific currency as
 * base — both `base=INR` and `base=USD` failed at different points in testing), so this spreads
 * the retry budget across both directions rather than hammering one.
 *
 * Never throws: if every attempt fails, falls back to 1:1 rather than blocking a transaction save
 * — a wrong/stale conversion is recoverable, a lost transaction isn't. This mirrors the same
 * "never lose the user's transaction" fallback philosophy as aiCategorizer.ts and ocrParser.ts.
 * Logs loudly on this path since a silent 1:1 between currencies that aren't actually near parity
 * (e.g. INR/USD) is a real correctness problem, not just a cosmetic one — see
 * specifications/12-multi-currency.md for the known-risk writeup and what a production hardening
 * pass should do about it (pre-fetched/cron-refreshed rate table instead of a request-path call).
 */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const key = `${from}_${to}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.rate;
  }

  try {
    const rate = await fetchRateWithRetry(from, to);
    cache.set(key, { rate, expiresAt: Date.now() + CACHE_TTL_MS });
    return rate;
  } catch (directErr) {
    try {
      const inverseRate = await fetchRateWithRetry(to, from);
      const rate = 1 / inverseRate;
      cache.set(key, { rate, expiresAt: Date.now() + CACHE_TTL_MS });
      return rate;
    } catch (inverseErr) {
      // eslint-disable-next-line no-console
      console.error(
        `[exchangeRate] ${from} -> ${to} failed in both directions (2 attempts each), falling back to 1:1 (this is likely WRONG for non-near-parity currency pairs)`,
        { directErr, inverseErr }
      );
      return 1;
    }
  }
}
