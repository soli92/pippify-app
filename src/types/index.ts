export interface AudioTrack {
  id: string;
  name: string;
  url: string;           // URL del file audio (locale o blob)
  duration?: number;     // in secondi
  size?: number;         // in bytes
  source: "upload" | "youtube";
  youtubeUrl?: string;   // URL originale YouTube (se source === "youtube")
  thumbnail?: string;    // thumbnail YouTube
  addedAt: number;       // timestamp
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

export interface AppState {
  tracks: AudioTrack[];
  playlists: Playlist[];
  currentTrackId: string | null;
  currentPlaylistId: string | null;
}
