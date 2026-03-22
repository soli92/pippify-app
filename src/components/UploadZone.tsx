"use client";

import { useCallback, useState } from "react";
import { useApp } from "@/context/AppContext";
import { AudioTrack } from "@/types";
import { v4 as uuidv4 } from "uuid";

const ACCEPTED_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/aac",
  "audio/flac", "audio/webm", "audio/mp4", "audio/x-m4a"];

export default function UploadZone() {
  const { dispatch } = useApp();
  const [dragging, setDragging] = useState(false);

  function processFiles(files: FileList | File[]) {
    Array.from(files).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|aac|flac|webm|m4a)$/i)) {
        return; // ignora file non audio
      }

      const url = URL.createObjectURL(file);

      // Prova a leggere la durata tramite Audio element
      const audio = new Audio(url);
      audio.addEventListener("loadedmetadata", () => {
        const track: AudioTrack = {
          id: uuidv4(),
          name: file.name.replace(/\.[^/.]+$/, ""), // rimuove estensione
          url,
          duration: Math.round(audio.duration),
          size: file.size,
          source: "upload",
          addedAt: Date.now(),
        };
        dispatch({ type: "ADD_TRACK", track });
      });
      audio.addEventListener("error", () => {
        // carica comunque anche senza durata
        const track: AudioTrack = {
          id: uuidv4(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          url,
          size: file.size,
          source: "upload",
          addedAt: Date.now(),
        };
        dispatch({ type: "ADD_TRACK", track });
      });
    });
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) processFiles(e.target.files);
  }

  return (
    <div
      className={`upload-zone ${dragging ? "dragging" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        id="file-input"
        type="file"
        accept="audio/*"
        multiple
        className="hidden-input"
        onChange={onInputChange}
      />
      <label htmlFor="file-input" className="upload-label">
        <span className="upload-icon">🎵</span>
        <span className="upload-text">
          Trascina file audio qui oppure <u>clicca per caricare</u>
        </span>
        <span className="upload-sub">MP3, WAV, FLAC, OGG, AAC, M4A…</span>
      </label>

      <style jsx>{`
        .upload-zone {
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 32px 20px;
          text-align: center;
          transition: border-color 0.2s, background 0.2s;
          cursor: pointer;
          margin-bottom: 24px;
        }
        .upload-zone:hover, .upload-zone.dragging {
          border-color: var(--accent);
          background: rgba(124, 106, 247, 0.05);
        }
        .hidden-input { display: none; }
        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .upload-icon { font-size: 36px; }
        .upload-text { font-size: 15px; color: var(--text); }
        .upload-text u { color: var(--accent); }
        .upload-sub { font-size: 12px; color: var(--muted); }
      `}</style>
    </div>
  );
}
