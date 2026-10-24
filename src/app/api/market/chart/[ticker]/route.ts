import { NextRequest, NextResponse } from "next/server";
import type { ChartTimeframe } from "@/types/firestore";
import { VALID_TICKERS } from "@/utils/tickers";
import { getTickerCandles } from "@/lib/stock-provider";
import { getMarketSnapshot } from "@/lib/firebase/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_RANGES: ChartTimeframe[] = ["1D", "5D", "1M", "6M", "1Y"];

export async function GET(
  req: NextRequest,
  context: { params: { ticker: string } },
) {
  const ticker = context.params.ticker.toUpperCase();
  if (!VALID_TICKERS.includes(ticker)) {
    return NextResponse.json(
      { success: false, error: "Invalid SGX ticker." },
      { status: 400 },
    );
  }

  const rangeParam = (
    req.nextUrl.searchParams.get("range") ?? "1M"
  ).toUpperCase() as ChartTimeframe;
  const timeframe: ChartTimeframe = ALLOWED_RANGES.includes(rangeParam)
    ? rangeParam
    : "1M";

  const [candles, snapshot] = await Promise.all([
    getTickerCandles(ticker, timeframe),
    getMarketSnapshot(),
  ]);

  return NextResponse.json({
    success: true,
    ticker,
    timeframe,
    quote: snapshot.quotes[ticker] ?? null,
    candles,
  });
}
