import YahooFinance from "yahoo-finance2";
import type {
  ChartTimeframe,
  LiveQuoteItem,
  MarketCandlesDoc,
  MarketLiveSnapshotDoc,
  OhlcvCandle,
} from "@/types/firestore";
import { TICKER_META, VALID_TICKERS } from "@/utils/tickers";
import {
  calculateAdminBidAsk,
  calculatePortfolioHhi,
  calculateSgxTradeFees,
  generateDeterministicSparkline,
  getSgxTickSize,
  roundToSgxTick,
} from "@/utils/sgx-market";
import {
  getMarketSnapshot,
  readLocalDb,
  saveMarketSnapshot,
  writeLocalDb,
} from "@/lib/firebase/store";

const yahooFinance = new YahooFinance();

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 200;
const PER_TICKER_TIMEOUT_MS = 5000;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

interface RawYahooQuote {
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketPreviousClose?: number;
  bid?: number;
  ask?: number;
  longName?: string;
  shortName?: string;
}

async function fetchSingleYahooQuote(
  ticker: string,
): Promise<LiveQuoteItem | null> {
  const meta = TICKER_META[ticker];
  if (!meta) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_TICKER_TIMEOUT_MS);

  try {
    const q = (await yahooFinance.quote(
      ticker,
      {},
      { fetchOptions: { signal: controller.signal } },
    )) as RawYahooQuote | undefined;

    const rawPrice = Number(q?.regularMarketPrice);
    if (!Number.isFinite(rawPrice) || rawPrice <= 0) return null;

    const price = roundToSgxTick(rawPrice);
    const tickSize = getSgxTickSize(price);
    const prevClose = roundToSgxTick(
      Number(q?.regularMarketPreviousClose ?? price),
    );
    const open = roundToSgxTick(Number(q?.regularMarketOpen ?? prevClose));
    const dayHigh = roundToSgxTick(
      Math.max(price, open, Number(q?.regularMarketDayHigh ?? price)),
    );
    const dayLow = roundToSgxTick(
      Math.min(price, open, Number(q?.regularMarketDayLow ?? price)),
    );
    const change = Number((price - prevClose).toFixed(tickSize < 0.01 ? 3 : 2));
    const changePct = Number(
      (
        q?.regularMarketChangePercent ??
        (prevClose > 0 ? (change / prevClose) * 100 : 0)
      ).toFixed(2),
    );
    const volume = Math.max(
      meta.refVolume,
      Number(q?.regularMarketVolume ?? meta.refVolume),
    );

    const fallbackSpread = calculateAdminBidAsk(price, tickSize);
    const bid =
      Number(q?.bid) > 0 ? roundToSgxTick(Number(q?.bid)) : fallbackSpread.bid;
    const ask =
      Number(q?.ask) > 0 && Number(q?.ask) >= bid
        ? roundToSgxTick(Number(q?.ask))
        : fallbackSpread.ask;

    return {
      ticker,
      name: meta.name,
      shortName: meta.shortName,
      tier: meta.tier,
      sector: meta.sector,
      price,
      prevClose,
      open,
      dayHigh,
      dayLow,
      change,
      changePct,
      volume,
      bid,
      ask,
      tickSize,
      boardLot: meta.boardLot,
      sparkline: generateDeterministicSparkline(ticker, price, changePct),
      isLive: true,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchFromYahoo(
  tickers: string[],
): Promise<(LiveQuoteItem | null)[]> {
  const results: (LiveQuoteItem | null)[] = new Array(tickers.length).fill(
    null,
  );
  const groups = chunk(
    tickers.map((t, i) => ({ t, i })),
    BATCH_SIZE,
  );

  for (let g = 0; g < groups.length; g++) {
    const settled = await Promise.allSettled(
      groups[g].map(({ t }) => fetchSingleYahooQuote(t)),
    );
    settled.forEach((s, k) => {
      const idx = groups[g][k].i;
      results[idx] = s.status === "fulfilled" ? s.value : null;
    });
    if (g < groups.length - 1) {
      await sleep(BATCH_DELAY_MS);
    }
  }
  return results;
}

interface TwelveDataQuoteRow {
  symbol?: string;
  close?: string;
  open?: string;
  high?: string;
  low?: string;
  previous_close?: string;
  percent_change?: string;
  volume?: string;
}

export async function fetchFromTwelveData(
  tickers: string[],
): Promise<(LiveQuoteItem | null)[]> {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) return tickers.map(() => null);

  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(
    tickers.join(","),
  )}&exchange=XSES&apikey=${encodeURIComponent(key)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_TICKER_TIMEOUT_MS * 2);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return tickers.map(() => null);
    const data = (await res.json()) as Record<string, TwelveDataQuoteRow>;

    return tickers.map((ticker) => {
      const meta = TICKER_META[ticker];
      const row = data?.[ticker];
      const rawPrice = row ? Number(row.close) : NaN;
      if (!meta || !row || !Number.isFinite(rawPrice) || rawPrice <= 0) {
        return null;
      }
      const price = roundToSgxTick(rawPrice);
      const tickSize = getSgxTickSize(price);
      const prevClose = roundToSgxTick(Number(row.previous_close ?? price));
      const open = roundToSgxTick(Number(row.open ?? prevClose));
      const dayHigh = roundToSgxTick(Math.max(price, Number(row.high ?? price)));
      const dayLow = roundToSgxTick(Math.min(price, Number(row.low ?? price)));
      const change = Number(
        (price - prevClose).toFixed(tickSize < 0.01 ? 3 : 2),
      );
      const changePct = Number(Number(row.percent_change ?? 0).toFixed(2));
      const { bid, ask } = calculateAdminBidAsk(price, tickSize);

      return {
        ticker,
        name: meta.name,
        shortName: meta.shortName,
        tier: meta.tier,
        sector: meta.sector,
        price,
        prevClose,
        open,
        dayHigh,
        dayLow,
        change,
        changePct,
        volume: Number(row.volume ?? meta.refVolume),
        bid,
        ask,
        tickSize,
        boardLot: meta.boardLot,
        sparkline: generateDeterministicSparkline(ticker, price, changePct),
        isLive: true,
        updatedAt: new Date().toISOString(),
      };
    });
  } catch {
    return tickers.map(() => null);
  } finally {
    clearTimeout(timer);
  }
}

export function matchOpenLimitOrders(
  snapshot: MarketLiveSnapshotDoc,
): { matchedCount: number } {
  const db = readLocalDb();
  const feeMode = db.appSettings.feeMode ?? "sgx_realistic";
  const semester = db.appSettings.currentSemester || "2026-S2";
  const nowIso = new Date().toISOString();
  let matchedCount = 0;

  for (const order of db.limitOrders) {
    if (order.status !== "open") continue;
    const quote = snapshot.quotes[order.ticker];
    const meta = TICKER_META[order.ticker];
    if (!quote || !meta) continue;

    const isBuy = order.action === "buy";
    const isMarketable = isBuy
      ? order.limitPrice >= quote.ask
      : order.limitPrice <= quote.bid;

    if (!isMarketable) continue;

    const user = db.users[order.userId];
    if (!user || user.tradingLocked) continue;

    const executionPrice = isBuy
      ? Math.min(order.limitPrice, quote.ask)
      : Math.max(order.limitPrice, quote.bid);

    const fees = calculateSgxTradeFees(
      order.shares,
      executionPrice,
      isBuy,
      feeMode,
    );

    if (!db.holdings[user.uid]) {
      db.holdings[user.uid] = {};
    }
    const existingHolding = db.holdings[user.uid][order.ticker];

    if (isBuy) {
      if (user.cashBalance < fees.netTotal) continue;
      const prevShares = existingHolding?.shares ?? 0;
      const prevCost = prevShares * (existingHolding?.avgPrice ?? 0);
      const nextShares = prevShares + order.shares;
      const nextAvg = Number(
        ((prevCost + order.shares * executionPrice) / nextShares).toFixed(4),
      );
      user.cashBalance = Number((user.cashBalance - fees.netTotal).toFixed(2));
      db.holdings[user.uid][order.ticker] = {
        ticker: order.ticker,
        shares: nextShares,
        avgPrice: nextAvg,
        updatedAt: nowIso,
      };
    } else {
      if (!existingHolding || existingHolding.shares < order.shares) continue;
      user.cashBalance = Number((user.cashBalance + fees.netTotal).toFixed(2));
      const nextShares = existingHolding.shares - order.shares;
      if (nextShares > 0) {
        db.holdings[user.uid][order.ticker] = {
          ...existingHolding,
          shares: nextShares,
          updatedAt: nowIso,
        };
      } else {
        delete db.holdings[user.uid][order.ticker];
      }
    }

    // Recalculate holdingsValue, netValue, and HHI
    const activeHoldings = Object.values(db.holdings[user.uid]).filter(
      (h) => h.shares > 0,
    );
    const posValues: number[] = [];
    let holdSum = 0;
    for (const h of activeHoldings) {
      const px = snapshot.quotes[h.ticker]?.price ?? h.avgPrice;
      const val = Number((h.shares * px).toFixed(2));
      posValues.push(val);
      holdSum += val;
    }

    user.holdingsValue = Number(holdSum.toFixed(2));
    user.netValue = Number((user.cashBalance + user.holdingsValue).toFixed(2));
    user.hhi = calculatePortfolioHhi(posValues);
    user.totalFeesPaid = Number((user.totalFeesPaid + fees.totalFee).toFixed(2));

    const ymd = nowIso.slice(0, 10).replace(/-/g, "");
    const contractNoteNo = `SGX-CN-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;

    db.tradeHistory.unshift({
      id: `trd-lmt-${Date.now()}-${matchedCount}`,
      userId: user.uid,
      userEmail: user.email,
      userNickname: user.nickname,
      ticker: order.ticker,
      companyName: meta.name,
      action: order.action,
      orderType: "limit",
      shares: order.shares,
      executionPrice,
      limitPrice: order.limitPrice,
      grossAmount: fees.grossAmount,
      brokerageFee: fees.brokerageFee,
      clearingFee: fees.clearingFee,
      sgxTradingFee: fees.sgxTradingFee,
      gstAmount: fees.gstAmount,
      totalFee: fees.totalFee,
      netTotal: fees.netTotal,
      realizedPnl: null,
      contractNoteNo,
      semester,
      timestamp: nowIso,
    });

    order.status = "filled";
    order.filledAt = nowIso;
    matchedCount += 1;
  }

  if (matchedCount > 0) {
    writeLocalDb(db);
  }

  return { matchedCount };
}

export async function refreshAllStockQuotes(): Promise<{
  snapshot: MarketLiveSnapshotDoc;
  liveCount: number;
  fallbackTickers: string[];
  matchedLimitOrdersCount: number;
}> {
  const existingSnapshot = await getMarketSnapshot();
  const provider = (process.env.STOCK_DATA_PROVIDER ?? "yahoo").toLowerCase();

  const fetched =
    provider === "twelvedata"
      ? await fetchFromTwelveData(VALID_TICKERS)
      : await fetchFromYahoo(VALID_TICKERS);

  const now = new Date().toISOString();
  const nextQuotes: Record<string, LiveQuoteItem> = {};
  const fallbackTickers: string[] = [];
  let liveCount = 0;

  VALID_TICKERS.forEach((ticker, idx) => {
    const hit = fetched[idx];
    if (hit) {
      nextQuotes[ticker] = hit;
      liveCount += 1;
      return;
    }

    fallbackTickers.push(ticker);
    const prev = existingSnapshot.quotes[ticker];
    const meta = TICKER_META[ticker];
    const basePrice = prev?.price ?? meta.refPrice;
    const tick = getSgxTickSize(basePrice);
    // Apply a subtle 1-tick micro-movement when simulating fallback ticks so live charts/orderbooks respond
    const deltaTicks = ((Date.now() + idx * 13) % 3) - 1; // -1, 0, or +1 tick
    const nextPrice = roundToSgxTick(
      Math.max(tick * 5, basePrice + deltaTicks * tick),
    );
    const prevClose =
      prev?.prevClose ??
      roundToSgxTick(meta.refPrice / (1 + meta.refChangePct / 100));
    const change = Number((nextPrice - prevClose).toFixed(tick < 0.01 ? 3 : 2));
    const changePct = Number(
      (prevClose > 0 ? (change / prevClose) * 100 : 0).toFixed(2),
    );
    const { bid, ask } = calculateAdminBidAsk(nextPrice, tick);

    nextQuotes[ticker] = {
      ticker,
      name: meta.name,
      shortName: meta.shortName,
      tier: meta.tier,
      sector: meta.sector,
      price: nextPrice,
      prevClose,
      open: prev?.open ?? prevClose,
      dayHigh: Math.max(prev?.dayHigh ?? nextPrice, nextPrice),
      dayLow: Math.min(prev?.dayLow ?? nextPrice, nextPrice),
      change,
      changePct,
      volume: (prev?.volume ?? meta.refVolume) + Math.floor(Math.random() * 12000),
      bid,
      ask,
      tickSize: tick,
      boardLot: meta.boardLot,
      sparkline: generateDeterministicSparkline(ticker, nextPrice, changePct),
      isLive: liveCount > 0,
      updatedAt: now,
    };
  });

  const snapshot: MarketLiveSnapshotDoc = {
    updatedAt: now,
    isLive: liveCount > 0,
    quotes: nextQuotes,
  };

  await saveMarketSnapshot(snapshot);
  const { matchedCount } = matchOpenLimitOrders(snapshot);
  return {
    snapshot,
    liveCount,
    fallbackTickers,
    matchedLimitOrdersCount: matchedCount,
  };
}

/**
 * Generates realistic, deterministic SGX OHLCV candlesticks when Yahoo Finance historical
 * endpoint is rate-limited or offline, anchored to the current live SGX quote.
 */
export function generateRealisticSgxCandles(
  ticker: string,
  timeframe: ChartTimeframe,
  currentPrice: number,
  baseVolume: number,
): OhlcvCandle[] {
  const tick = getSgxTickSize(currentPrice);
  const decimals = tick < 0.01 ? 3 : 2;

  let count = 78;
  let stepSeconds = 300; // 5 mins for 1D

  if (timeframe === "1D") {
    count = 78;
    stepSeconds = 5 * 60;
  } else if (timeframe === "5D") {
    count = 120;
    stepSeconds = 15 * 60;
  } else if (timeframe === "1M") {
    count = 30;
    stepSeconds = 86400;
  } else if (timeframe === "6M") {
    count = 130;
    stepSeconds = 86400;
  } else {
    count = 250;
    stepSeconds = 86400;
  }

  let seed = 0;
  for (let i = 0; i < ticker.length; i++) {
    seed = (seed * 41 + ticker.charCodeAt(i)) % 10007;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const alignedNow = Math.floor(nowSec / stepSeconds) * stepSeconds;

  // Walk backward from currentPrice so the final candle matches the live SGX quote
  const closes: number[] = new Array(count);
  closes[count - 1] = currentPrice;

  for (let i = count - 2; i >= 0; i--) {
    const wave =
      Math.sin((i + (seed % 19)) * 0.27) * 0.0045 +
      Math.cos((i * 1.7 + (seed % 13)) * 0.41) * 0.0035;
    const prev = closes[i + 1] / (1 + wave);
    closes[i] = Number(Math.max(tick * 5, roundToSgxTick(prev)).toFixed(decimals));
  }

  const candles: OhlcvCandle[] = [];
  for (let i = 0; i < count; i++) {
    const time = alignedNow - (count - 1 - i) * stepSeconds;
    const close = closes[i];
    const open =
      i === 0
        ? Number(roundToSgxTick(close * 0.996).toFixed(decimals))
        : closes[i - 1];

    const wickRangeTicks = 1 + ((seed + i * 7) % 4);
    const high = Number(
      (Math.max(open, close) + wickRangeTicks * tick).toFixed(decimals),
    );
    const low = Number(
      Math.max(tick, Math.min(open, close) - wickRangeTicks * tick).toFixed(
        decimals,
      ),
    );

    const volFactor = 0.5 + (((seed + i * 23) % 110) / 100);
    const perBarVol =
      timeframe === "1D"
        ? Math.round((baseVolume / 60) * volFactor)
        : timeframe === "5D"
          ? Math.round((baseVolume / 20) * volFactor)
          : Math.round(baseVolume * volFactor);

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.max(100, perBarVol),
    });
  }

  return candles;
}

export async function getTickerCandles(
  ticker: string,
  timeframe: ChartTimeframe,
): Promise<OhlcvCandle[]> {
  const cleanTicker = ticker.toUpperCase();
  const meta = TICKER_META[cleanTicker];
  const snapshot = await getMarketSnapshot();
  const quote = snapshot.quotes[cleanTicker];
  const currentPrice = quote?.price ?? meta?.refPrice ?? 1.0;
  const baseVolume = quote?.volume ?? meta?.refVolume ?? 1000000;

  const cacheKey = `${cleanTicker}_${timeframe}`;
  const local = readLocalDb();
  const cached = local.marketCandles[cacheKey];

  // Return cached candles if younger than 10 minutes
  if (
    cached &&
    cached.candles.length > 5 &&
    Date.now() - new Date(cached.updatedAt).getTime() < 10 * 60 * 1000
  ) {
    // Update the last candle's close to match current live price
    const copy = [...cached.candles];
    const last = { ...copy[copy.length - 1] };
    last.close = currentPrice;
    last.high = Math.max(last.high, currentPrice);
    last.low = Math.min(last.low, currentPrice);
    copy[copy.length - 1] = last;
    return copy;
  }

  // Try fetching real historical/intraday candles via yahooFinance.chart
  try {
    const now = new Date();
    let period1 = new Date(now.getTime() - 30 * 86400000);
    let interval: "5m" | "15m" | "1d" = "1d";

    if (timeframe === "1D") {
      period1 = new Date(now.getTime() - 3 * 86400000);
      interval = "5m";
    } else if (timeframe === "5D") {
      period1 = new Date(now.getTime() - 7 * 86400000);
      interval = "15m";
    } else if (timeframe === "1M") {
      period1 = new Date(now.getTime() - 35 * 86400000);
      interval = "1d";
    } else if (timeframe === "6M") {
      period1 = new Date(now.getTime() - 185 * 86400000);
      interval = "1d";
    } else {
      period1 = new Date(now.getTime() - 365 * 86400000);
      interval = "1d";
    }

    const chartRes = (await yahooFinance.chart(cleanTicker, {
      period1,
      period2: now,
      interval,
    })) as {
      quotes?: Array<{
        date?: Date;
        open?: number | null;
        high?: number | null;
        low?: number | null;
        close?: number | null;
        volume?: number | null;
      }>;
    };

    const rawQuotes = chartRes?.quotes ?? [];
    const seenTimes = new Set<number>();
    const parsed: OhlcvCandle[] = [];

    for (const q of rawQuotes) {
      if (!q.date || q.close === null || q.close === undefined) continue;
      const t = Math.floor(new Date(q.date).getTime() / 1000);
      if (!Number.isFinite(t) || seenTimes.has(t)) continue;
      const close = roundToSgxTick(Number(q.close));
      if (!Number.isFinite(close) || close <= 0) continue;

      const open = roundToSgxTick(Number(q.open ?? close));
      const high = roundToSgxTick(Math.max(open, close, Number(q.high ?? close)));
      const low = roundToSgxTick(Math.min(open, close, Number(q.low ?? close)));
      const volume = Math.max(0, Number(q.volume ?? 0));

      seenTimes.add(t);
      parsed.push({ time: t, open, high, low, close, volume });
    }

    parsed.sort((a, b) => a.time - b.time);

    if (parsed.length >= 10) {
      const doc: MarketCandlesDoc = {
        ticker: cleanTicker,
        range: timeframe,
        updatedAt: new Date().toISOString(),
        candles: parsed,
      };
      local.marketCandles[cacheKey] = doc;
      writeLocalDb(local);
      return parsed;
    }
  } catch {
    // Fallback to deterministic SGX candles below
  }

  const fallbackCandles = generateRealisticSgxCandles(
    cleanTicker,
    timeframe,
    currentPrice,
    baseVolume,
  );
  local.marketCandles[cacheKey] = {
    ticker: cleanTicker,
    range: timeframe,
    updatedAt: new Date().toISOString(),
    candles: fallbackCandles,
  };
  writeLocalDb(local);
  return fallbackCandles;
}
