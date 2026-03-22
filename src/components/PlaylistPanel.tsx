"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Playlist } from "@/types";
import { v4 as uuidv4 } from "uuid";

export default function PlaylistPanel() {
  const { state, dispatch } = useApp();
  const [newName, setNewName] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  function createPlaylist() {
    const name = newName.trim();
    if (!name) return;
    const playlist: Playlist = {
      id: uuidv4(),
      name,
      trackIds: [],
      createdAt: Date.now(),
    };
    dispatch({ type: "ADD_PLAYLIST", playlist });
    setNewName("");
  }

  function removePlaylist(id: string) { dispatch({ type: "REMOVE_PLAYLIST", id }); }

  function playPlaylistTrack(trackId: string) {
    dispatch({ type: "SET_CURRENT_TRACK", id: trackId });
  }

  function removeFromPlaylist(playlistId: string, trackId: string) {
    dispatch({ type: "REMOVE_TRACK_FROM_PLAYLIST", playlistId, trackId });
  }

  return (
    <div className="playlist-panel">
      <h2 className="section-title">📋 Playlist</h2>

      {/* Crea nuova playlist */}
      <div className="create-row">
        <input
          className="pl-input"
          placeholder="Nome nuova playlist…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
        />
        <button className="btn-accent" onClick={createPlaylist} disabled={!newName.trim()}>
          Crea
        </button>
      </div>

      {/* Lista playlist */}
      {state.playlists.length === 0 ? (
        <p className="empty-pl">Nessuna playlist ancora.</p>
      ) : (
        <ul className="pl-list">
          {state.playlists.map((pl: Playlist) => {
            const tracks = pl.trackIds
              .map((tid) => state.tracks.find((t) => t.id === tid))
              .filter(Boolean);
            const isOpen = expanded === pl.id;

            return (
              <li key={pl.id} className="pl-item">
                <div className="pl-header" onClick={() => setExpanded(isOpen ? null : pl.id)}>
                  <span className="pl-arrow">{isOpen ? "▾" : "▸"}</span>
                  <span className="pl-name">{pl.name}</span>
                  <span className="pl-count">{tracks.length} tracce</span>
                  <button
                    className="action-btn danger"
                    onClick={(e) => { e.stopPropagation(); removePlaylist(pl.id); }}
                    title="Elimina playlist"
                  >
                    ✕
                  </button>
                </div>

                {isOpen && (
                  <ul className="pl-tracks">
                    {tracks.length === 0 ? (
                      <li className="pl-empty">Aggiungi tracce dalla libreria.</li>
                    ) : (
                      tracks.map((t) => t && (
                        <li key={t.id} className={`pl-track ${state.currentTrackId === t.id ? "active" : ""}`}>
                          <span className="pl-track-name" onClick={() => playPlaylistTrack(t.id)}>
                            {state.currentTrackId === t.id ? "🔊 " : "▶ "}{t.name}
                          </span>
                          <button
                            className="action-btn danger small"
                            onClick={() => removeFromPlaylist(pl.id, t.id)}
                            title="Rimuovi dalla playlist"
                          >
                            ✕
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <style jsx>{`
        .playlist-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .section-title { font-size: 13px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 16px; }
        .create-row { display: flex; gap: 10px; margin-bottom: 16px; }
        .pl-input { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; color: var(--text); font-size: 14px; outline: none; }
        .pl-input:focus { border-color: var(--accent); }
        .pl-input::placeholder { color: var(--muted); }
        .btn-accent { background: var(--accent); color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .btn-accent:hover { background: var(--accent-hover); }
        .btn-accent:disabled { opacity: .4; cursor: not-allowed; }
        .empty-pl { font-size: 13px; color: var(--muted); }
        .pl-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
        .pl-item { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .pl-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; cursor: pointer; background: var(--surface2); transition: background .2s; }
        .pl-header:hover { background: rgba(124,106,247,.08); }
        .pl-arrow { color: var(--muted); font-size: 12px; width: 12px; }
        .pl-name { flex: 1; font-size: 14px; font-weight: 500; color: var(--text); }
        .pl-count { font-size: 12px; color: var(--muted); }
        .action-btn { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 6px; width: 24px; height: 24px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; }
        .action-btn.danger:hover { color: var(--red); border-color: var(--red); }
        .action-btn.small { width: 20px; height: 20px; font-size: 10px; }
        .pl-tracks { list-style: none; border-top: 1px solid var(--border); }
        .pl-empty { padding: 10px 16px; font-size: 12px; color: var(--muted); }
        .pl-track { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; gap: 8px; }
        .pl-track:hover { background: rgba(124,106,247,.04); }
        .pl-track.active { background: rgba(124,106,247,.08); }
        .pl-track-name { font-size: 13px; color: var(--text); cursor: pointer; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>
    </div>
  );
}
