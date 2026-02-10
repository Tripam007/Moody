
export interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail?: string;
  youtubeQuery: string;
}

export interface MoodConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export enum AppState {
  HOME = 'home',
  PLAYLIST = 'playlist',
  FAVORITES = 'favorites',
  HISTORY = 'history'
}
