/**
 * Centralised feature-flag allowlists.
 *
 * Server-side: reads REBALANCING_ALLOWED_EMAILS from env (comma-separated).
 * Client-side: call GET /api/rebalancing/access to check.
 *
 * NEVER hardcode emails elsewhere — always funnel through this module.
 */

const DEFAULT_REBALANCING_EMAILS = "eduardo.ti.vix@gmail.com";

function getAllowedRebalancingEmails(): Set<string> {
  const raw = process.env.REBALANCING_ALLOWED_EMAILS ?? DEFAULT_REBALANCING_EMAILS;
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Server-only — checks if an email is in the rebalancing allowlist. */
export function isRebalancingAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAllowedRebalancingEmails().has(email.toLowerCase());
}
