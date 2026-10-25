"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Bot,
  ExternalLink,
  Table as TableIcon,
  Video as VideoIcon,
} from "lucide-react";
import {
  EPISODES_DATA,
  EpisodeData,
  VideoBeat,
  HandbookRole,
} from "@/data/handbook-and-video-content";

interface Props {
  initialEpisodeId?: string;
  onRoleChange?: (role: HandbookRole) => void;
}

export default function InteractiveVideoPlayer({
  initialEpisodeId = "ep1",
  onRoleChange,
}: Props) {
  const [selectedEpId, setSelectedEpId] = useState(initialEpisodeId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5 | 2>(1);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [viewMode, setViewMode] = useState<"video" | "script">("video");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [interactiveOrderLots, setInteractiveOrderLots] = useState(5);

  const activeEpisode: EpisodeData =
    EPISODES_DATA.find((e) => e.id === selectedEpId) || EPISODES_DATA[0];

  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const prevBeatIdRef = useRef<string | null>(null);

  // Find active beat based on current time
  const currentBeat: VideoBeat =
    activeEpisode.beats.find(
      (b) => currentTimeSec >= b.startSec && currentTimeSec < b.endSec,
    ) || activeEpisode.beats[activeEpisode.beats.length - 1];

  // Sync role change callback
  useEffect(() => {
    if (onRoleChange) {
      onRoleChange(activeEpisode.role);
    }
  }, [activeEpisode.role, onRoleChange]);

  // Audio Speech Synthesis Handler
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (!isPlaying || !audioEnabled) {
      window.speechSynthesis.cancel();
      return;
    }

    // Trigger speech only when beat changes
    if (currentBeat.id !== prevBeatIdRef.current) {
      prevBeatIdRef.current = currentBeat.id;
      window.speechSynthesis.cancel();

      try {
        const utterance = new SpeechSynthesisUtterance(currentBeat.vo);
        utterance.rate = playbackSpeed * 1.05;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find(
            (v) =>
              (v.lang.includes("en-SG") ||
                v.lang.includes("en-GB") ||
                v.lang.includes("en-US")) &&
              v.name.includes("Natural"),
          ) ||
          voices.find(
            (v) =>
              v.lang.includes("en-SG") ||
              v.lang.includes("en-GB") ||
              v.lang.includes("en-US"),
          ) ||
          voices[0];

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore speech synthesis browser restrictions
      }
    }
  }, [currentBeat.id, isPlaying, audioEnabled, playbackSpeed, currentBeat.vo]);

  // Playback Timer Loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 100;
    const interval = setInterval(() => {
      setCurrentTimeSec((prev) => {
        const next = prev + (intervalMs / 1000) * playbackSpeed;
        if (next >= activeEpisode.durationSec) {
          setIsPlaying(false);
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          return activeEpisode.durationSec;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, activeEpisode.durationSec]);

  const switchEpisode = (epId: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    prevBeatIdRef.current = null;
    setSelectedEpId(epId);
    setCurrentTimeSec(0);
    setIsPlaying(false);
    setInteractiveOrderLots(5);
  };

  const handlePlayPause = () => {
    if (currentTimeSec >= activeEpisode.durationSec) {
      setCurrentTimeSec(0);
      prevBeatIdRef.current = null;
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    prevBeatIdRef.current = null;
    setCurrentTimeSec(0);
    setIsPlaying(true);
  };

  const handleScrub = (sec: number) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    prevBeatIdRef.current = null;
    setCurrentTimeSec(Math.max(0, Math.min(sec, activeEpisode.durationSec)));
  };

  const handlePrevBeat = () => {
    const currentIndex = activeEpisode.beats.findIndex(
      (b) => b.id === currentBeat.id,
    );
    if (currentIndex > 0) {
      handleScrub(activeEpisode.beats[currentIndex - 1].startSec);
    } else {
      handleScrub(0);
    }
  };

  const handleNextBeat = () => {
    const currentIndex = activeEpisode.beats.findIndex(
      (b) => b.id === currentBeat.id,
    );
    if (currentIndex < activeEpisode.beats.length - 1) {
      handleScrub(activeEpisode.beats[currentIndex + 1].startSec);
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = Math.min(
    100,
    (currentTimeSec / activeEpisode.durationSec) * 100,
  );

  return (
    <div
      ref={playerContainerRef}
      className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all"
    >
      {/* Top Episode Selector Bar (Daylight Bright Mode) */}
      <div className="border-b border-slate-200 bg-slate-50/90 text-slate-900 px-4 py-3.5 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-sgx-blue shadow-xs font-black text-xs">
              ▶
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sgx-blue">
                EduFinLit Video Walkthrough Studio
              </span>
              <h3 className="font-display text-sm sm:text-base font-extrabold text-slate-900">
                {activeEpisode.number}: {activeEpisode.title}
              </h3>
            </div>
          </div>

          {/* Mode Switcher & Copy Script */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("video")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                  viewMode === "video"
                    ? "bg-white text-sgx-blue shadow-2xs border border-blue-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <VideoIcon className="h-3.5 w-3.5" />
                Playable Walkthrough
              </button>
              <button
                type="button"
                onClick={() => setViewMode("script")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                  viewMode === "script"
                    ? "bg-white text-sgx-blue shadow-2xs border border-blue-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                Script &amp; Storyboard
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const scriptFull = activeEpisode.beats
                  .map(
                    (b) =>
                      `[${b.time}] ${b.cue}\nCALLOUT: ${b.callout}\nVOICEOVER: ${b.vo}\n`,
                  )
                  .join("\n");
                copyText(
                  `script-${activeEpisode.id}`,
                  `# ${activeEpisode.number}: ${activeEpisode.title}\n${activeEpisode.subtitle}\nDuration: ${activeEpisode.duration}\n\n${scriptFull}`,
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
            >
              {copiedKey === `script-${activeEpisode.id}` ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  Copy Script
                </>
              )}
            </button>
          </div>
        </div>

        {/* 6 Episode Pill Switchers */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EPISODES_DATA.map((ep) => {
            const isActive = ep.id === selectedEpId;
            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => switchEpisode(ep.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition border ${
                  isActive
                    ? "bg-blue-50 text-sgx-blue border-blue-300 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="font-mono text-[10px] opacity-80">
                  {ep.number.replace("Episode ", "EP")}
                </span>
                <span className="truncate max-w-[150px] sm:max-w-[200px]">
                  {ep.title}
                </span>
                <span
                  className={`rounded px-1.5 py-0.2 font-mono text-[10px] ${
                    isActive ? "bg-blue-100 text-sgx-blue" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {ep.duration}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {viewMode === "video" ? (
        <div>
          {/* Main Simulated Screen Viewport (Daylight Bright Theme) */}
          <div className="relative aspect-video w-full bg-slate-100/70 overflow-hidden select-none flex flex-col justify-between border-b border-slate-200">
            {/* Visual Simulator Canvas / Screen Cue Render */}
            <div className="absolute inset-0 z-0">
              {renderSimulatedSceneDaylight(
                currentBeat.sceneType,
                activeEpisode,
                currentBeat,
                interactiveOrderLots,
                setInteractiveOrderLots,
              )}
            </div>

            {/* Top Overlay: Active Screen Cue & Kinetic Callout */}
            <div className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-b from-white/90 via-white/50 to-transparent">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-0.5 font-mono text-[11px] font-bold text-sgx-blue border border-blue-200 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {currentBeat.time}
                </span>
                <span className="rounded-full bg-white/90 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-2xs">
                  {currentBeat.cue}
                </span>
              </div>

              {/* Kinetic On-Screen Callout Pill */}
              <div className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/95 backdrop-blur-md px-3 py-1 font-mono text-xs font-bold text-amber-900 shadow-sm animate-pulse">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                {currentBeat.callout}
              </div>
            </div>

            {/* Center Big Play Button (when paused) */}
            {!isPlaying && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/10 backdrop-blur-[1px]">
                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="group flex h-20 w-20 items-center justify-center rounded-full bg-sgx-blue text-white shadow-2xl transition hover:scale-110 hover:bg-blue-600 focus:outline-none"
                  aria-label="Play Walkthrough"
                >
                  <Play className="h-9 w-9 translate-x-0.5 fill-white" />
                </button>
              </div>
            )}

            {/* Bottom Overlay: Closed Captions Subtitle Box (Daylight) */}
            <div className="relative z-10 p-4 sm:p-6 bg-gradient-to-t from-white/95 via-white/60 to-transparent">
              {showCaptions && (
                <div className="mx-auto max-w-3xl rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 p-3 sm:p-4 text-center shadow-md">
                  <p className="font-sans text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed tracking-wide">
                    &ldquo;{currentBeat.vo}&rdquo;
                  </p>
                  <div className="mt-1.5 flex items-center justify-center gap-2">
                    <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 font-mono text-[10px] font-bold text-sgx-blue">
                      CC · EduFinLit Voiceover
                    </span>
                    {audioEnabled && isPlaying && (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Speaking…
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video Scrub Bar & Interactive Controls (Daylight Bright Mode) */}
          <div className="border-t border-slate-200 bg-white text-slate-800 p-3 sm:p-4 space-y-3">
            {/* Scrubber Progress Bar with Chapter Markers */}
            <div className="relative">
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = clickX / rect.width;
                  handleScrub(ratio * activeEpisode.durationSec);
                }}
                className="group relative h-2.5 w-full cursor-pointer rounded-full bg-slate-200 overflow-hidden"
              >
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-100 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Beat Marker Ticks */}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex h-2.5 justify-between px-0.5">
                {activeEpisode.beats.map((b) => {
                  const tickPercent = (b.startSec / activeEpisode.durationSec) * 100;
                  return (
                    <div
                      key={b.id}
                      style={{ left: `${tickPercent}%` }}
                      className="absolute top-0 h-2.5 w-0.5 bg-slate-400/80"
                      title={b.cue}
                    />
                  );
                })}
              </div>
            </div>

            {/* Transport & Control Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-sgx-blue text-white shadow-xs hover:bg-blue-700 transition"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-white" />
                  ) : (
                    <Play className="h-4 w-4 fill-white translate-x-0.5" />
                  )}
                </button>

                {/* Restart */}
                <button
                  type="button"
                  onClick={handleRestart}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                  title="Restart Episode"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                {/* Prev Beat */}
                <button
                  type="button"
                  onClick={handlePrevBeat}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                  title="Previous Chapter"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Next Beat */}
                <button
                  type="button"
                  onClick={handleNextBeat}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                  title="Next Chapter"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Time Display */}
                <div className="font-mono text-xs font-semibold text-slate-600 pl-1">
                  <span className="text-slate-900 font-bold">
                    {formatTime(currentTimeSec)}
                  </span>
                  <span className="text-slate-400"> / </span>
                  <span>{formatTime(activeEpisode.durationSec)}</span>
                </div>
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center gap-2.5">
                {/* Audio Voiceover Mute/Unmute */}
                <button
                  type="button"
                  onClick={() => {
                    if (audioEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                    }
                    setAudioEnabled(!audioEnabled);
                  }}
                  className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition border ${
                    audioEnabled
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                  title="Toggle Browser Voiceover Audio"
                >
                  {audioEnabled ? (
                    <>
                      <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Voiceover ON</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-3.5 w-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Muted</span>
                    </>
                  )}
                </button>

                {/* Captions Toggle */}
                <button
                  type="button"
                  onClick={() => setShowCaptions(!showCaptions)}
                  className={`rounded-xl px-2.5 py-1 font-mono text-xs font-bold transition border ${
                    showCaptions
                      ? "bg-blue-50 text-sgx-blue border-blue-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                  title="Toggle Subtitles"
                >
                  CC
                </button>

                {/* Speed Control */}
                <div className="flex items-center rounded-xl bg-slate-100 border border-slate-200 p-0.5">
                  {([1, 1.25, 1.5, 2] as const).map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`rounded-lg px-1.5 py-0.5 font-mono text-[11px] font-bold transition ${
                        playbackSpeed === spd
                          ? "bg-sgx-blue text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {/* Fullscreen */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                  title="Fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full 3-Column Production Script Table View (Daylight Theme) */
        <div className="p-4 sm:p-6 space-y-4 bg-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
            <div>
              <h4 className="font-display text-base font-extrabold text-slate-900">
                Full Production Script &amp; Storyboard: {activeEpisode.number}
              </h4>
              <p className="text-xs text-slate-500">
                Paced at 130–140 WPM with exact visual cues, on-screen callouts,
                and educational narration.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 font-mono text-xs font-bold text-sgx-blue shrink-0">
              {activeEpisode.beats.length} Scene Blocks · {activeEpisode.duration}
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 w-1/4">Timestamp &amp; Screen Cue</th>
                  <th className="p-3.5 w-1/3">On-Screen Kinetic Callout</th>
                  <th className="p-3.5 w-5/12">Creator Voiceover Script</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeEpisode.beats.map((b, idx) => (
                  <tr
                    key={b.id}
                    className={`transition hover:bg-blue-50/40 ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    }`}
                  >
                    <td className="p-3.5 align-top font-mono text-[11px]">
                      <span className="font-bold text-sgx-blue block mb-1">
                        {b.time}
                      </span>
                      <span className="text-slate-600 font-sans text-xs">
                        {b.cue}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode("video");
                          handleScrub(b.startSec);
                          setIsPlaying(true);
                        }}
                        className="mt-2 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-sgx-blue hover:text-white transition"
                      >
                        <Play className="h-2.5 w-2.5" /> Jump to Beat
                      </button>
                    </td>
                    <td className="p-3.5 align-top">
                      <span className="inline-block rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 font-mono text-[11px] font-bold text-blue-900 leading-snug">
                        {b.callout}
                      </span>
                    </td>
                    <td className="p-3.5 align-top text-slate-800 leading-relaxed font-sans">
                      &ldquo;{b.vo}&rdquo;
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Episode Challenge & Hook Bar */}
      <div className="border-t border-slate-200 bg-slate-50/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="space-y-1 max-w-2xl">
          <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
            ⚡ 60-Second Action Challenge for This Episode:
          </span>
          <p className="text-slate-700 leading-relaxed text-[11px] sm:text-xs">
            {activeEpisode.challenge}
          </p>
        </div>

        <Link
          href={
            activeEpisode.role === "admin"
              ? "/admin"
              : activeEpisode.role === "teacher"
              ? "/admin"
              : "/dashboard"
          }
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 font-bold text-white shadow-xs hover:bg-sgx-blue transition text-xs"
        >
          Try In App Now
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// High-Fidelity Daylight Visual Scene Simulators (SGX Institutional Daylight)
// ─────────────────────────────────────────────────────────────────────────────
function renderSimulatedSceneDaylight(
  sceneType: VideoBeat["sceneType"],
  episode: EpisodeData,
  beat: VideoBeat,
  interactiveLots: number,
  setInteractiveLots: React.Dispatch<React.SetStateAction<number>>,
) {
  switch (sceneType) {
    case "intro":
    case "outro":
      return (
        <div className="h-full w-full bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 flex flex-col items-center justify-center p-6 text-center text-slate-900 space-y-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-3xl bg-white p-2 shadow-lg border border-slate-200 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/efl-logo.png"
                alt="EduFinLit Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 font-bold text-[10px] text-white shadow-sm">
              S$
            </span>
          </div>
          <div>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 font-mono text-xs font-bold text-sgx-blue">
              {episode.number} · {episode.duration}
            </span>
            <h2 className="mt-2 font-display text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight max-w-xl">
              {episode.title}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-lg">
              {episode.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-mono text-emerald-800 shadow-2xs font-semibold">
              S$10,000 Starting Capital
            </span>
            <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-mono text-sgx-blue shadow-2xs font-semibold">
              20 SGX Blue Chips
            </span>
            <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-mono text-indigo-800 shadow-2xs font-semibold">
              TradingView Pro Charts
            </span>
          </div>
        </div>
      );

    case "login_onboarding":
      return (
        <div className="h-full w-full bg-slate-100/60 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/efl-logo.png" alt="Logo" className="h-7 w-7 rounded-lg" />
                <span className="font-display text-sm font-extrabold text-slate-900">
                  EduFinLit
                </span>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Singapore Cloud Ready
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">
                Welcome! Enter your School Class Join Code:
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    readOnly
                    value="SGX4E1"
                    className="w-full rounded-xl border border-blue-300 bg-blue-50/40 px-3 py-2 font-mono text-sm font-bold text-blue-900"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-emerald-600">
                    ✓ Verified Class
                  </span>
                </div>
                <button
                  type="button"
                  className="rounded-xl bg-sgx-blue px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Confirm
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">
                  Automated Cash Provisioning
                </span>
                <span className="font-mono text-base font-extrabold text-emerald-600">
                  S$10,000.00 SGD
                </span>
              </div>
              <span className="rounded-lg bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                T+2 Real SGX Rules
              </span>
            </div>
          </div>
        </div>
      );

    case "market_screener":
      return (
        <div className="h-full w-full bg-slate-100/60 p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 text-slate-900">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs sm:text-sm font-extrabold text-slate-900">
                SGX Market Screener
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                LIVE · Singapore Morning Session
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-500 font-semibold">
              SGT 10:45:22 · SGX Cash Market OPEN
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-auto">
            {[
              {
                ticker: "D05.SI",
                name: "DBS Group Holdings",
                price: "S$36.20",
                chg: "+0.85%",
                up: true,
                tier: "Safe Bets",
              },
              {
                ticker: "OV8.SI",
                name: "Sheng Siong Group",
                price: "S$1.58",
                chg: "+1.28%",
                up: true,
                tier: "Everyday Brands",
              },
              {
                ticker: "Z74.SI",
                name: "Singtel Ltd",
                price: "S$2.42",
                chg: "-0.41%",
                up: false,
                tier: "Safe Bets",
              },
              {
                ticker: "C6L.SI",
                name: "Singapore Airlines",
                price: "S$6.85",
                chg: "+0.59%",
                up: true,
                tier: "Everyday Brands",
              },
            ].map((st) => (
              <div
                key={st.ticker}
                className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900 space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-sgx-blue">
                    {st.ticker}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                      st.up
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {st.chg}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 truncate">{st.name}</div>
                <div className="font-mono text-sm font-extrabold text-slate-900">
                  {st.price}
                </div>
                <span className="inline-block text-[9px] text-slate-500 border border-slate-200 rounded px-1.5 py-0.2 bg-slate-50">
                  {st.tier}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-2.5 text-center text-[11px] text-slate-600 font-mono shadow-2xs">
            SGX Tick Precision: 0.1¢ below S$0.20 · 0.5¢ below S$2.00 · 1.0¢ above S$2.00
          </div>
        </div>
      );

    case "order_ticket_fee":
      const shares = interactiveLots * 100;
      const sharePrice = 1.58;
      const gross = shares * sharePrice;
      const brokerage = Math.max(10, gross * 0.0008);
      const cdp = gross * 0.000325;
      const sgx = gross * 0.000075;
      const gst = (brokerage + cdp + sgx) * 0.09;
      const totalFees = brokerage + cdp + sgx + gst;
      const feeDragPct = (totalFees / gross) * 100;

      return (
        <div className="h-full w-full bg-slate-100/60 p-4 sm:p-6 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-slate-900 space-y-3.5 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-700">
                  BUY OV8.SI · Sheng Siong Group
                </span>
                <p className="text-[11px] text-slate-500">
                  SGX Board Lot = 100 Shares @ S$1.580
                </p>
              </div>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-mono text-[10px] text-sgx-blue font-bold">
                FL-C2 Fee Sizing
              </span>
            </div>

            {/* Interactive Quantity Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Position Size (Lots):</span>
                <span className="font-mono font-bold text-slate-900">
                  {interactiveLots} Lots ({shares.toLocaleString()} Shares) = S$
                  {gross.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setInteractiveLots((prev) => Math.max(1, prev - 1))
                  }
                  className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800 hover:bg-slate-200"
                >
                  -1 Lot
                </button>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={interactiveLots}
                  onChange={(e) => setInteractiveLots(Number(e.target.value))}
                  className="h-2 flex-1 cursor-pointer accent-blue-600 rounded-lg bg-slate-200"
                />
                <button
                  type="button"
                  onClick={() =>
                    setInteractiveLots((prev) => Math.min(15, prev + 1))
                  }
                  className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800 hover:bg-slate-200"
                >
                  +1 Lot
                </button>
              </div>
            </div>

            {/* Fee Drag Comparison Meter */}
            <div
              className={`rounded-xl border p-3 space-y-1.5 transition-colors ${
                feeDragPct > 3.0
                  ? "border-rose-200 bg-rose-50/80 text-rose-900"
                  : feeDragPct > 1.5
                  ? "border-amber-200 bg-amber-50/80 text-amber-900"
                  : "border-emerald-200 bg-emerald-50/80 text-emerald-900"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Fee Drag on Trade:</span>
                <span className="font-mono text-sm">
                  {feeDragPct.toFixed(2)}% (S${totalFees.toFixed(2)} Total)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    feeDragPct > 3.0
                      ? "bg-rose-600"
                      : feeDragPct > 1.5
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  }`}
                  style={{ width: `${Math.min(100, (feeDragPct / 7) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] opacity-90">
                {feeDragPct > 3.0
                  ? "⚠️ Warning: S$10 min brokerage creates severe drag on tiny orders!"
                  : "✓ Optimal: Sizing keeps fees under 1.5%."}
              </p>
            </div>
          </div>
        </div>
      );

    case "candlestick_charts":
      return (
        <div className="h-full w-full bg-white p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-900 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sgx-blue">
                D05.SI · DBS Group Holdings
              </span>
              <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-mono text-sgx-blue font-semibold">
                TradingView Lightweight Engine
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-sgx-blue font-bold">SMA 20: S$35.90</span>
              <span className="text-amber-700 font-bold">SMA 50: S$34.80</span>
              <span className="text-emerald-700 font-bold">VWAP: S$36.15</span>
            </div>
          </div>

          {/* Simulated Candlesticks (Daylight) */}
          <div className="my-auto flex items-end justify-center gap-3 h-36 px-4 bg-slate-50/50 rounded-xl border border-slate-100">
            {[
              { h: 60, bull: true, wickT: 10, wickB: 12 },
              { h: 45, bull: false, wickT: 8, wickB: 10 },
              { h: 75, bull: true, wickT: 14, wickB: 8 },
              { h: 50, bull: true, wickT: 12, wickB: 15 },
              { h: 35, bull: false, wickT: 10, wickB: 6 },
              { h: 80, bull: true, wickT: 18, wickB: 12 },
              { h: 95, bull: true, wickT: 15, wickB: 10 },
              { h: 65, bull: false, wickT: 10, wickB: 14 },
              { h: 85, bull: true, wickT: 12, wickB: 8 },
            ].map((c, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`w-0.5 ${c.bull ? "bg-emerald-600" : "bg-rose-500"}`}
                  style={{ height: `${c.wickT}px` }}
                />
                <div
                  className={`w-4 rounded-xs shadow-2xs ${
                    c.bull ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                  style={{ height: `${c.h}px` }}
                />
                <div
                  className={`w-0.5 ${c.bull ? "bg-emerald-600" : "bg-rose-500"}`}
                  style={{ height: `${c.wickB}px` }}
                />
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-2 text-center text-[10px] font-mono text-slate-600">
            RSI(14): 58.4 (Neutral Bullish) · MACD Bullish Cross Confirmed
          </div>
        </div>
      );

    case "level2_depth":
      return (
        <div className="h-full w-full bg-slate-100/60 p-4 sm:p-6 flex flex-col justify-center items-center">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-mono text-xs font-bold text-slate-900">
                SGX 5-Level Bid / Ask Depth Book (DBS D05.SI)
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                Spread: S$0.01 (0.03%)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              {/* Bids */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">
                  Bids (Buyers)
                </div>
                {[
                  { price: "S$36.20", qty: "45,200", bar: "90%" },
                  { price: "S$36.19", qty: "32,100", bar: "65%" },
                  { price: "S$36.18", qty: "61,000", bar: "100%" },
                ].map((b, i) => (
                  <div
                    key={i}
                    className="relative flex justify-between p-1 rounded bg-slate-50 border border-slate-100 overflow-hidden"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-emerald-100"
                      style={{ width: b.bar }}
                    />
                    <span className="relative text-emerald-800 font-bold">
                      {b.price}
                    </span>
                    <span className="relative text-slate-700">{b.qty}</span>
                  </div>
                ))}
              </div>

              {/* Asks */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-rose-700 uppercase">
                  Asks (Sellers)
                </div>
                {[
                  { price: "S$36.21", qty: "28,400", bar: "55%" },
                  { price: "S$36.22", qty: "40,000", bar: "80%" },
                  { price: "S$36.23", qty: "55,800", bar: "100%" },
                ].map((a, i) => (
                  <div
                    key={i}
                    className="relative flex justify-between p-1 rounded bg-slate-50 border border-slate-100 overflow-hidden"
                  >
                    <div
                      className="absolute inset-y-0 right-0 bg-rose-100"
                      style={{ width: a.bar }}
                    />
                    <span className="relative text-slate-700">{a.qty}</span>
                    <span className="relative text-rose-800 font-bold">
                      {a.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case "ai_copilot_chat":
      return (
        <div className="h-full w-full bg-slate-100/60 p-4 sm:p-6 flex flex-col justify-center items-center">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 space-y-3 shadow-md">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Bot className="h-4 w-4 text-sgx-blue" />
              <span className="font-display text-xs font-bold text-slate-900">
                Agentic Socratic Trading Copilot
              </span>
            </div>

            {/* User message */}
            <div className="flex justify-end">
              <div className="rounded-xl rounded-tr-xs bg-sgx-blue px-3 py-1.5 text-xs text-white max-w-[80%] shadow-2xs">
                Compare DBS vs Singtel yields and stage 100 shares for higher yield.
              </div>
            </div>

            {/* AI Response Card */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-sgx-blue font-bold text-[11px]">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Socratic Analysis &amp; Staged Order:
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Singtel (<code>Z74.SI</code>) yields <strong>5.8%</strong> vs DBS (<code>D05.SI</code>) at <strong>5.2%</strong>. Here is your staged order for 100 shares of Singtel at S$2.42:
              </p>

              {/* Staged Order Box */}
              <div className="rounded-lg border border-slate-200 bg-white p-2.5 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    BUY 100 Z74.SI @ S$2.42
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Gross S$242.00 · Fee S$10.96
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded bg-slate-100 border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700"
                  >
                    +1 Lot
                  </button>
                  <button
                    type="button"
                    className="rounded bg-sgx-blue px-2.5 py-1 text-[10px] font-bold text-white shadow-xs"
                  >
                    Execute
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case "leaderboard_hhi":
      return (
        <div className="h-full w-full bg-slate-100/60 p-4 sm:p-6 flex flex-col justify-center items-center">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-display text-xs font-bold text-slate-900">
                EduFinLit Smart Investor Score Podium
              </span>
              <span className="font-mono text-[10px] text-slate-500 font-semibold">
                Score = Return × (1 + (1 − HHI))
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 space-y-1">
                <span className="font-bold text-rose-900 block">
                  Gambler Portfolio
                </span>
                <span className="text-[10px] text-slate-500 block">
                  100% in 1 Penny Stock
                </span>
                <div className="font-mono text-xs text-slate-700">
                  Return: +12.0%
                </div>
                <div className="font-mono text-xs text-slate-700">
                  HHI: 1.0 (Multiplier: 1.0x)
                </div>
                <div className="pt-1 font-mono text-sm font-extrabold text-rose-700">
                  Final: 12.00 Pts
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-1">
                <span className="font-bold text-emerald-900 block">
                  Diversified Student 🏆
                </span>
                <span className="text-[10px] text-slate-500 block">
                  4 Stocks @ 25% Each
                </span>
                <div className="font-mono text-xs text-slate-700">
                  Return: +10.0%
                </div>
                <div className="font-mono text-xs text-slate-700">
                  HHI: 0.25 (Multiplier: 1.75x!)
                </div>
                <div className="pt-1 font-mono text-sm font-extrabold text-emerald-700">
                  Final: 17.50 Pts
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case "cognitive_passport":
    case "teacher_heatmap":
    case "teacher_solo_taxonomy":
    case "teacher_comments_export":
      return (
        <div className="h-full w-full bg-slate-100/60 p-4 sm:p-6 flex flex-col justify-center items-center">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-display text-xs font-bold text-slate-900">
                Cognitive Science 5-Pillar Competency Radar (FL-C1 to FL-C5)
              </span>
              <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                Mastery Score: 84 / 100
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { name: "FL-C1: Execution Discipline", score: 92, band: "Mastery" },
                { name: "FL-C2: Fee Drag Awareness", score: 85, band: "Mastery" },
                { name: "FL-C3: Portfolio Diversification", score: 90, band: "Mastery" },
                { name: "FL-C4: Valuation & DRIP", score: 78, band: "Proficient" },
                { name: "FL-C5: Metacognitive Reflection", score: 75, band: "Proficient" },
              ].map((c) => (
                <div key={c.name} className="space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">{c.name}</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {c.score}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-emerald-500"
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "admin_google_cloud":
    case "admin_google_sites_embed":
    case "admin_chromebook_session":
    case "admin_governance":
    case "teacher_class_create":
    case "teacher_roster_sync":
    case "teacher_market_controls":
    case "teacher_dividends":
    case "stress_tester":
    case "drip_simulator":
    default:
      return (
        <div className="h-full w-full bg-slate-100/60 p-6 flex flex-col justify-center items-center text-center text-slate-900 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 max-w-md space-y-2 shadow-md">
            <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 font-mono text-[10px] font-bold text-sgx-blue">
              {beat.cue}
            </span>
            <h3 className="font-display text-base font-extrabold text-slate-900">
              {beat.callout}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              &ldquo;{beat.vo}&rdquo;
            </p>
          </div>
        </div>
      );
  }
}
