"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { AudioTrack } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface YTMeta {
  title: string;
  author: string;
  lengthSeconds: number;
  thumbnail: string | null;
  videoId: string;
}

type Step = "idle" | "fetching-meta" | "preview" | "downloading" | "done" | "error";

export default function YoutubeImport() {
  const { dispatch } = useApp();
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [meta, setMeta] = useState<YTMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function handlePreview() {
    setError(null);
    setMeta(null);
    if (!url.trim()) { setError("Inserisci un link YouTube valido."); return; }
    setStep("fetching-meta");
    try {
      const res = await fetch(`/api/youtube?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore sconosciuto");
      setMeta(data);
      setStep("preview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore nel recupero dei metadati.");
      setStep("error");
    }
  }

  async function handleDownload() {
    if (!meta) return;
    setStep("downloading");
    setProgress(0);
    setError(null);
    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Errore nel download");
      }

      const title = decodeURIComponent(res.headers.get("X-Track-Title") ?? meta.title);
      const duration = parseInt(res.headers.get("X-Track-Duration") ?? "0", 10);
      const thumbnail = res.headers.get("X-Track-Thumbnail") ?? "";

      const contentLength = res.headers.get("Content-Length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = res.body!.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      let fakeProgress = 5;
      const fakeInterval = totalBytes === 0
        ? setInterval(() => {
            fakeProgress = Math.min(fakeProgress + Math.random() * 3, 90);
            setProgress(Math.round(fakeProgress));
          }, 400)
        : null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedBytes += value.length;
        if (totalBytes > 0) setProgress(Math.round((receivedBytes / totalBytes) * 100));
      }

      if (fakeInterval) clearInterval(fakeInterval);
      setProgress(100);

      const contentType = res.headers.get("Content-Type") ?? "audio/webm";
      const blob = new Blob(chunks, { type: contentType });
      const audioUrl = URL.createObjectURL(blob);

      const track: AudioTrack = {
        id: uuidv4(),
        name: title || meta.title,
        url: audioUrl,
        duration: duration || meta.lengthSeconds,
        size: blob.size,
        source: "youtube",
        youtubeUrl: url.trim(),
        thumbnail: thumbnail || meta.thumbnail || undefined,
        addedAt: Date.now(),
      };

      dispatch({ type: "ADD_TRACK", track });
      setStep("done");
      setTimeout(() => { setStep("idle"); setUrl(""); setMeta(null); setProgress(0); }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore durante il download.");
      setStep("error");
    }
  }

  function handleReset() {
    setStep("idle"); setUrl(""); setMeta(null); setError(null); setProgress(0);
  }

  function fmt(sec: number) {
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
  }

  return (
    <div className="yt-import">
      <h2 className="section-title">
        <span style={{ color: "#ff4444" }}>▶</span> Importa da YouTube
      </h2>

      {(step === "idle" || step === "error") && (
        <div className="yt-input-row">
          <input
            type="url"
            className="yt-input"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePreview()}
          />
          <button className="btn-accent" onClick={handlePreview} disabled={!url.trim()}>
            Anteprima
          </button>
        </div>
      )}

      {step === "error" && error && (
        <div className="yt-error">
          ❌ {error}
          <button className="btn-ghost small" onClick={handleReset}>Riprova</button>
        </div>
      )}

      {step === "fetching-meta" && (
        <div className="yt-status">
          <div className="spinner" />
          <span>Recupero informazioni video…</span>
        </div>
      )}

      {step === "preview" && meta && (
        <div className="yt-preview">
          {meta.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.thumbnail} alt={meta.title} className="yt-thumb" />
          )}
          <div className="yt-preview-info">
            <p className="yt-preview-title">{meta.title}</p>
            <p className="yt-preview-sub">{meta.author} · {fmt(meta.lengthSeconds)}</p>
            <div className="yt-preview-actions">
              <button className="btn-accent" onClick={handleDownload}>⬇ Importa Audio</button>
              <button className="btn-ghost" onClick={handleReset}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {step === "downloading" && (
        <div className="yt-downloading">
          <p className="yt-downloading-label">Download in corso… {progress}%</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="yt-downloading-sub">Attendi, l&apos;audio verrà aggiunto alla libreria.</p>
        </div>
      )}

      {step === "done" && (
        <div className="yt-status" style={{ color: "var(--green)", fontWeight: 600 }}>
          ✅ Audio importato con successo!
        </div>
      )}

      <style jsx>{`
        .yt-import { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .section-title { font-size: 13px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .yt-input-row { display: flex; gap: 10px; margin-bottom: 10px; }
        .yt-input { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; color: var(--text); font-size: 14px; outline: none; transition: border-color .2s; }
        .yt-input:focus { border-color: var(--accent); }
        .yt-input::placeholder { color: var(--muted); }
        .btn-accent { background: var(--accent); color: white; border: none; border-radius: 8px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background .2s; white-space: nowrap; }
        .btn-accent:hover { background: var(--accent-hover); }
        .btn-accent:disabled { opacity: .4; cursor: not-allowed; }
        .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); border-radius: 8px; padding: 10px 16px; font-size: 14px; cursor: pointer; }
        .btn-ghost:hover { color: var(--text); }
        .btn-ghost.small { padding: 6px 12px; font-size: 12px; margin-left: 8px; }
        .yt-status { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 14px; padding: 8px 0; }
        .spinner { width: 18px; height: 18px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .yt-preview { display: flex; gap: 16px; align-items: flex-start; }
        .yt-thumb { width: 120px; height: 68px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
        .yt-preview-info { flex: 1; }
        .yt-preview-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 4px; line-height: 1.4; }
        .yt-preview-sub { font-size: 13px; color: var(--muted); margin-bottom: 12px; }
        .yt-preview-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .yt-downloading { padding: 4px 0; }
        .yt-downloading-label { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 10px; }
        .progress-bar { height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden; margin-bottom: 10px; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), #a78bfa); border-radius: 3px; transition: width .3s ease; }
        .yt-downloading-sub { font-size: 12px; color: var(--muted); }
        .yt-error { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; color: var(--red); font-size: 14px; padding: 8px 0; }
        @media (max-width: 480px) { .yt-input-row { flex-direction: column; } .yt-preview { flex-direction: column; } .yt-thumb { width: 100%; height: auto; } }
      `}</style>
    </div>
  );
}
