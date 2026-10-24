"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import {
  BarChart2,
  TrendingUp,
  Activity,
  RefreshCw,
} from "lucide-react";
import type { ChartTimeframe, OhlcvCandle } from "@/types/firestore";
import { formatSgxPrice, getSgxTickSize } from "@/utils/sgx-market";

interface Props {
  ticker: string;
  initialCandles: OhlcvCandle[];
  livePrice: number;
}

const TIMEFRAMES: ChartTimeframe[] = ["1D", "5D", "1M", "6M", "1Y"];

function computeSma(
  candles: OhlcvCandle[],
  period: number,
): Array<{ time: Time; value: number }> {
  const result: Array<{ time: Time; value: number }> = [];
  if (candles.length < period) return result;
  let rollingSum = 0;
  for (let i = 0; i < candles.length; i++) {
    rollingSum += candles[i].close;
    if (i >= period) {
      rollingSum -= candles[i - period].close;
    }
    if (i >= period - 1) {
      result.push({
        time: candles[i].time as Time,
        value: Number((rollingSum / period).toFixed(3)),
      });
    }
  }
  return result;
}

function computeVwap(
  candles: OhlcvCandle[],
): Array<{ time: Time; value: number }> {
  const result: Array<{ time: Time; value: number }> = [];
  let cumPV = 0;
  let cumVol = 0;
  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = Math.max(1, c.volume);
    cumPV += typicalPrice * vol;
    cumVol += vol;
    result.push({
      time: c.time as Time,
      value: Number((cumPV / cumVol).toFixed(3)),
    });
  }
  return result;
}

function computeRsi14(candles: OhlcvCandle[]): number {
  if (candles.length < 2) return 50;
  const period = Math.min(14, candles.length - 1);
  let gains = 0;
  let losses = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 75;
  const rs = avgGain / avgLoss;
  return Number((100 - 100 / (1 + rs)).toFixed(1));
}

function computeStiNormalizedOverlay(
  candles: OhlcvCandle[],
): Array<{ time: Time; value: number }> {
  if (candles.length === 0) return [];
  const startPrice = candles[0].close;
  return candles.map((c, idx) => {
    const drift = 1 + idx * 0.0005 + Math.sin(idx * 0.25) * 0.004;
    return {
      time: c.time as Time,
      value: Number((startPrice * drift).toFixed(3)),
    };
  });
}

export default function SgxProChart({
  ticker,
  initialCandles,
  livePrice,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartApiRef = useRef<IChartApi | null>(null);

  const [timeframe, setTimeframe] = useState<ChartTimeframe>("1M");
  const [chartMode, setChartMode] = useState<"candles" | "area">("candles");
  const [showSma20, setShowSma20] = useState(true);
  const [showSma50, setShowSma50] = useState(false);
  const [showVwap, setShowVwap] = useState(false);
  const [showStiOverlay, setShowStiOverlay] = useState(false);
  const [candles, setCandles] = useState<OhlcvCandle[]>(initialCandles);
  const [loading, setLoading] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<OhlcvCandle | null>(
    initialCandles[initialCandles.length - 1] ?? null,
  );

  // Update the latest candle in real time when livePrice changes
  useEffect(() => {
    setCandles((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = { ...next[next.length - 1] };
      last.close = livePrice;
      last.high = Math.max(last.high, livePrice);
      last.low = Math.min(last.low, livePrice);
      next[next.length - 1] = last;
      setHoveredBar(last);
      return next;
    });
  }, [livePrice]);

  const handleSelectTimeframe = async (tf: ChartTimeframe) => {
    if (tf === timeframe) return;
    setTimeframe(tf);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/market/chart/${encodeURIComponent(ticker)}?range=${tf}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const json = (await res.json()) as { candles?: OhlcvCandle[] };
        if (json.candles && json.candles.length > 0) {
          setCandles(json.candles);
          setHoveredBar(json.candles[json.candles.length - 1]);
        }
      }
    } catch {
      // Keep existing candles on network error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || candles.length === 0) return;

    const tickSize = getSgxTickSize(livePrice);
    const precision = tickSize < 0.01 ? 3 : 2;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 380,
      layout: {
        background: { type: ColorType.Solid, color: "#FFFFFF" },
        textColor: "#475569",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#F1F5F9" },
        horzLines: { color: "#F1F5F9" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#94A3B8",
          width: 1,
          labelBackgroundColor: "#0F172A",
        },
        horzLine: {
          color: "#94A3B8",
          width: 1,
          labelBackgroundColor: "#0052FF",
        },
      },
      rightPriceScale: {
        borderColor: "#E2E8F0",
        scaleMargins: {
          top: 0.08,
          bottom: 0.24,
        },
      },
      timeScale: {
        borderColor: "#E2E8F0",
        timeVisible: timeframe === "1D" || timeframe === "5D",
        secondsVisible: false,
      },
    });

    chartApiRef.current = chart;

    if (chartMode === "candles") {
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#059669",
        downColor: "#E11D48",
        borderUpColor: "#059669",
        borderDownColor: "#E11D48",
        wickUpColor: "#059669",
        wickDownColor: "#E11D48",
        priceFormat: {
          type: "price",
          precision,
          minMove: tickSize,
        },
      });
      candleSeries.setData(
        candles.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })),
      );
    } else {
      const firstClose = candles[0]?.close ?? livePrice;
      const lastClose = candles[candles.length - 1]?.close ?? livePrice;
      const isUp = lastClose >= firstClose;
      const areaSeries = chart.addAreaSeries({
        lineColor: isUp ? "#059669" : "#E11D48",
        topColor: isUp ? "rgba(5, 150, 105, 0.22)" : "rgba(225, 29, 72, 0.22)",
        bottomColor: "rgba(255, 255, 255, 0.0)",
        lineWidth: 2,
        priceFormat: {
          type: "price",
          precision,
          minMove: tickSize,
        },
      });
      areaSeries.setData(
        candles.map((c) => ({
          time: c.time as Time,
          value: c.close,
        })),
      );
    }

    // Volume Histogram on bottom 20% of chart
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });
    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color:
          c.close >= c.open
            ? "rgba(5, 150, 105, 0.28)"
            : "rgba(225, 29, 72, 0.28)",
      })),
    );

    if (showSma20) {
      const sma20Series = chart.addLineSeries({
        color: "#0052FF",
        lineWidth: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      sma20Series.setData(computeSma(candles, 20));
    }

    if (showSma50) {
      const sma50Series = chart.addLineSeries({
        color: "#D97706",
        lineWidth: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      sma50Series.setData(computeSma(candles, 50));
    }

    if (showVwap) {
      const vwapSeries = chart.addLineSeries({
        color: "#7C3AED",
        lineWidth: 2,
        lineStyle: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      vwapSeries.setData(computeVwap(candles));
    }

    if (showStiOverlay) {
      const stiSeries = chart.addLineSeries({
        color: "#0F172A",
        lineWidth: 2,
        lineStyle: 1,
        crosshairMarkerVisible: false,
        lastValueVisible: true,
        priceLineVisible: false,
      });
      stiSeries.setData(computeStiNormalizedOverlay(candles));
    }

    const byTime = new Map<number, OhlcvCandle>();
    candles.forEach((c) => byTime.set(c.time, c));

    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        setHoveredBar(candles[candles.length - 1] ?? null);
        return;
      }
      const match = byTime.get(Number(param.time));
      if (match) {
        setHoveredBar(match);
      }
    });

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width } = entries[0].contentRect;
      if (width > 0) {
        chart.applyOptions({ width });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartApiRef.current = null;
    };
  }, [
    candles,
    chartMode,
    showSma20,
    showSma50,
    showVwap,
    showStiOverlay,
    timeframe,
    livePrice,
  ]);

  const activeBar = hoveredBar ?? candles[candles.length - 1];
  const barUp = activeBar ? activeBar.close >= activeBar.open : true;
  const rsi14 = computeRsi14(candles);
  const rsiLabel =
    rsi14 >= 70 ? "Overbought" : rsi14 <= 30 ? "Oversold" : "Neutral";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Top Chart Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => handleSelectTimeframe(tf)}
              className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
                timeframe === tf
                  ? "bg-white text-sgx-blue shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Mode & Technical Overlays */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setChartMode("candles")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition ${
                chartMode === "candles"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5 text-emerald-600" />
              Candles
            </button>
            <button
              type="button"
              onClick={() => setChartMode("area")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition ${
                chartMode === "area"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5 text-sgx-blue" />
              Mountain
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSma20((v) => !v)}
            className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
              showSma20
                ? "border-blue-300 bg-blue-50 text-sgx-blue"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            SMA 20
          </button>

          <button
            type="button"
            onClick={() => setShowSma50((v) => !v)}
            className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
              showSma50
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            SMA 50
          </button>

          <button
            type="button"
            onClick={() => setShowVwap((v) => !v)}
            className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
              showVwap
                ? "border-purple-300 bg-purple-50 text-purple-700"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            VWAP
          </button>

          <button
            type="button"
            onClick={() => setShowStiOverlay((v) => !v)}
            className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
              showStiOverlay
                ? "border-slate-800 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            vs STI Benchmark
          </button>

          <span
            className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold ${
              rsi14 >= 70
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : rsi14 <= 30
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
            title="14-Period Relative Strength Index"
          >
            RSI(14): {rsi14} · {rsiLabel}
          </span>
        </div>
      </div>

      {/* Live Crosshair OHLCV Readout Strip */}
      {activeBar && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-1.5 font-mono text-[11px] text-slate-600">
          <div className="flex flex-wrap items-center gap-3 tabular-nums">
            <span className="inline-flex items-center gap-1 font-sans font-semibold text-slate-800">
              <Activity className="h-3.5 w-3.5 text-sgx-blue" />
              {ticker}
            </span>
            <span>
              O:{" "}
              <strong className="text-slate-900">
                S${formatSgxPrice(activeBar.open)}
              </strong>
            </span>
            <span>
              H:{" "}
              <strong className="text-slate-900">
                S${formatSgxPrice(activeBar.high)}
              </strong>
            </span>
            <span>
              L:{" "}
              <strong className="text-slate-900">
                S${formatSgxPrice(activeBar.low)}
              </strong>
            </span>
            <span>
              C:{" "}
              <strong
                className={barUp ? "text-emerald-700" : "text-rose-700"}
              >
                S${formatSgxPrice(activeBar.close)}
              </strong>
            </span>
            <span>
              Vol:{" "}
              <strong className="text-slate-900">
                {activeBar.volume.toLocaleString("en-SG")}
              </strong>
            </span>
          </div>

          {loading && (
            <span className="inline-flex items-center gap-1 text-sgx-blue">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Loading {timeframe} candles…
            </span>
          )}
        </div>
      )}

      {/* TradingView Lightweight Chart Canvas */}
      <div ref={containerRef} className="mt-2 w-full h-[380px]" />
    </div>
  );
}
