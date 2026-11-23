
export interface SongAlbum {
  id: string;
  name: string;
  url: string;
}

export interface Artist {
  id: string;
  name: string;
  url: string;
  image?: ImageQuality[];
  type?: string;
}

export interface SongArtists {
  primary: Artist[];
  featured: Artist[];
  all: Artist[];
}

export interface ImageQuality {
  quality: string;
  url: string;
}

export interface DownloadQuality {
  quality: string;
  url: string;
}

export interface Song {
  album: SongAlbum;
  artists: SongArtists;
  copyright: string;
  downloadUrl: DownloadQuality[];
  duration: number;
  explicitContent: boolean;
  hasLyrics: boolean;
  id: string;
  image: ImageQuality[];
  label: string;
  language: string;
  lyricsId: string | null;
  name: string;
  playCount: number;
  releaseDate: string | null;
  type: 'song';
  url: string;
  year: string;
}
