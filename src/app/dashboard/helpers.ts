import { TIER_LIST, type RiskTier } from "@/utils/tickers";

export const RISK_TIER_ORDER: RiskTier[] = TIER_LIST;

export function formatVolumeShort(volume: number): string {
  if (!Number.isFinite(volume) || volume <= 0) return "0";
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(2)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(0)}K`;
  return String(volume);
}
