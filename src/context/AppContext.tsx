"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { AudioTrack, Playlist, AppState } from "@/types";

// ─── Actions ────────────────────────────────────────────────────────────────

type Action =
  | { type: "ADD_TRACK"; track: AudioTrack }
  | { type: "REMOVE_TRACK"; id: string }
  | { type: "SET_CURRENT_TRACK"; id: string | null }
  | { type: "ADD_PLAYLIST"; playlist: Playlist }
  | { type: "REMOVE_PLAYLIST"; id: string }
  | { type: "ADD_TRACK_TO_PLAYLIST"; playlistId: string; trackId: string }
  | { type: "REMOVE_TRACK_FROM_PLAYLIST"; playlistId: string; trackId: string }
  | { type: "SET_CURRENT_PLAYLIST"; id: string | null }
  | { type: "HYDRATE"; state: AppState };

// ─── Reducer ────────────────────────────────────────────────────────────────

const initialState: AppState = {
  tracks: [],
  playlists: [],
  currentTrackId: null,
  currentPlaylistId: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_TRACK":
      return { ...state, tracks: [action.track, ...state.tracks] };

    case "REMOVE_TRACK":
      return {
        ...state,
        tracks: state.tracks.filter((t) => t.id !== action.id),
        currentTrackId: state.currentTrackId === action.id ? null : state.currentTrackId,
        playlists: state.playlists.map((pl) => ({
          ...pl,
          trackIds: pl.trackIds.filter((tid) => tid !== action.id),
        })),
      };

    case "SET_CURRENT_TRACK":
      return { ...state, currentTrackId: action.id };

    case "ADD_PLAYLIST":
      return { ...state, playlists: [...state.playlists, action.playlist] };

    case "REMOVE_PLAYLIST":
      return {
        ...state,
        playlists: state.playlists.filter((pl) => pl.id !== action.id),
        currentPlaylistId: state.currentPlaylistId === action.id ? null : state.currentPlaylistId,
      };

    case "ADD_TRACK_TO_PLAYLIST":
      return {
        ...state,
        playlists: state.playlists.map((pl) =>
          pl.id === action.playlistId && !pl.trackIds.includes(action.trackId)
            ? { ...pl, trackIds: [...pl.trackIds, action.trackId] }
            : pl
        ),
      };

    case "REMOVE_TRACK_FROM_PLAYLIST":
      return {
        ...state,
        playlists: state.playlists.map((pl) =>
          pl.id === action.playlistId
            ? { ...pl, trackIds: pl.trackIds.filter((id) => id !== action.trackId) }
            : pl
        ),
      };

    case "SET_CURRENT_PLAYLIST":
      return { ...state, currentPlaylistId: action.id };

    case "HYDRATE":
      return action.state;

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "pippify_state";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate da localStorage al mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AppState = JSON.parse(stored);
        dispatch({ type: "HYDRATE", state: parsed });
      }
    } catch {}
  }, []);

  // Persisti ogni cambio di stato
  useEffect(() => {
    try {
      const toStore: AppState = { ...state, currentTrackId: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {}
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
