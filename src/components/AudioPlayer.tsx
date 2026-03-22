"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";

export default function AudioPlayer() {
  const { state, dispatch } = useApp();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const currentTrack = state.tracks.find((t) => t.id === state.currentTrackId);

  // Cambio traccia
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.url;
    audio.load();
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [currentTrack?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
  }

  function handleNext() {
    if (!currentTrack) return;
    const idx = state.tracks.findIndex((t) => t.id === currentTrack.id);
    const next = state.tracks[idx + 1];
    if (next) dispatch({ type: "SET_CURRENT_TRACK", id: next.id });
  }

  function handlePrev() {
    if (!currentTrack) return;
    const audio = audioRef.current;
    // Se siamo > 3s riavvolgi, altrimenti vai al precedente
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
    const idx = state.tracks.findIndex((t) => t.id === currentTrack.id);
    const prev = state.tracks[idx - 1];
    if (prev) dispatch({ type: "SET_CURRENT_TRACK", id: prev.id });
  }

  function fmt(s: number) {
    if (!isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  }

  if (!currentTrack) return null;

  return (
    <div className="player">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleNext}
      />

      {/* Track info */}
      <div className="player-info">
        {currentTrack.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentTrack.thumbnail} alt="" className="player-thumb" />
        ) : (
          <div className="player-thumb-placeholder">🎵</div>
        )}
        <div className="player-meta">
          <p className="player-name">{currentTrack.name}</p>
          <p className="player-source">
            {currentTrack.source === "youtube" ? "▶ YouTube" : "📁 Upload"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="player-controls">
        <button className="ctrl-btn" onClick={handlePrev} title="Precedente">⏮</button>
        <button className="ctrl-btn play" onClick={togglePlay} title={isPlaying ? "Pausa" : "Play"}>
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button className="ctrl-btn" onClick={handleNext} title="Successivo">⏭</button>
      </div>

      {/* Progress */}
      <div className="player-progress">
        <span className="time">{fmt(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={(e) => {
            const t = parseFloat(e.target.value);
            setCurrentTime(t);
            if (audioRef.current) audioRef.current.currentTime = t;
          }}
          className="seek-bar"
        />
        <span className="time">{fmt(duration)}</span>
      </div>

      {/* Volume */}
      <div className="player-volume">
        <span>🔉</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="vol-bar"
        />
      </div>

      <style jsx>{`
        .player {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--surface);
          border-top: 1px solid var(--border);
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          z-index: 100;
          backdrop-filter: blur(12px);
        }
        .player-info { display: flex; align-items: center; gap: 12px; min-width: 180px; flex: 1; }
        .player-thumb { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; }
        .player-thumb-placeholder { width: 44px; height: 44px; border-radius: 6px; background: var(--surface2); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .player-name { font-size: 14px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        .player-source { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .player-controls { display: flex; align-items: center; gap: 8px; }
        .ctrl-btn { background: none; border: none; color: var(--muted); font-size: 20px; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: color .2s; }
        .ctrl-btn:hover { color: var(--text); }
        .ctrl-btn.play { font-size: 24px; color: var(--accent); }
        .ctrl-btn.play:hover { color: var(--accent-hover); }
        .player-progress { display: flex; align-items: center; gap: 8px; flex: 2; }
        .time { font-size: 12px; color: var(--muted); min-width: 36px; }
        .seek-bar, .vol-bar {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: var(--border);
          outline: none;
          cursor: pointer;
        }
        .seek-bar::-webkit-slider-thumb, .vol-bar::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
        }
        .player-volume { display: flex; align-items: center; gap: 8px; width: 120px; }
        @media (max-width: 640px) {
          .player { flex-wrap: wrap; padding: 10px 16px; gap: 10px; }
          .player-info { min-width: unset; }
          .player-volume { display: none; }
        }
      `}</style>
    </div>
  );
}
