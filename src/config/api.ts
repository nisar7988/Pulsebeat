function cleanUrl(value?: string): string {
  return (value || '').trim().replace(/\/+$/, '');
}

const envMirrorsList = (process.env.EXPO_PUBLIC_MUSIC_API_MIRRORS || '')
  .split(',')
  .map((item) => cleanUrl(item))
  .filter(Boolean);

const envPrimary = cleanUrl(process.env.EXPO_PUBLIC_MUSIC_API_URL);
const envFallback = cleanUrl(process.env.EXPO_PUBLIC_MUSIC_API_FALLBACK_URL);

export const API_MIRRORS: string[] = Array.from(
  new Set([
    ...envMirrorsList,
    ...(envPrimary ? [envPrimary] : []),
    ...(envFallback ? [envFallback] : []),
  ]),
);

const BASE_URL = API_MIRRORS[0] || '';

export const MUSIC_PATHS = {
  // Search
  search: '/search?query={query}',
  searchSongs: '/search/songs?query={songName}&page={page}&limit={limit}',
  searchAlbums: '/search/albums?query={albumName}&page={page}&limit={limit}',
  searchArtists: '/search/artists?query={artistName}&page={page}&limit={limit}',
  searchPlaylists: '/search/playlists?query={playlistName}&page={page}&limit={limit}',

  // Songs
  songs: '/songs?ids={songId}',
  songById: '/songs/{songId}',
  songSuggestions: '/songs/{songId}/suggestions',

  // Albums
  album: '/albums?id={albumId}',

  // Artists
  artist: '/artists?id={artistId}',
  artistById: '/artists/{artistId}',
  artistSongs: '/artists/{artistId}/songs?page={page}',
  artistAlbums: '/artists/{artistId}/albums',

  // Playlists
  playlist: '/playlists?id={playlistId}',
} as const;

export const MUSIC_API = {
  // Search
  search: `${BASE_URL}${MUSIC_PATHS.search}`,
  searchSongs: `${BASE_URL}${MUSIC_PATHS.searchSongs}`,
  searchAlbums: `${BASE_URL}${MUSIC_PATHS.searchAlbums}`,
  searchArtists: `${BASE_URL}${MUSIC_PATHS.searchArtists}`,
  searchPlaylists: `${BASE_URL}${MUSIC_PATHS.searchPlaylists}`,

  // Songs
  songs: `${BASE_URL}${MUSIC_PATHS.songs}`,
  songById: `${BASE_URL}${MUSIC_PATHS.songById}`,
  songSuggestions: `${BASE_URL}${MUSIC_PATHS.songSuggestions}`,

  // Albums
  album: `${BASE_URL}${MUSIC_PATHS.album}`,

  // Artists
  artist: `${BASE_URL}${MUSIC_PATHS.artist}`,
  artistById: `${BASE_URL}${MUSIC_PATHS.artistById}`,
  artistSongs: `${BASE_URL}${MUSIC_PATHS.artistSongs}`,
  artistAlbums: `${BASE_URL}${MUSIC_PATHS.artistAlbums}`,

  // Playlists
  playlist: `${BASE_URL}${MUSIC_PATHS.playlist}`,

  // Lyrics & Developer endpoints from env
  lyrics: cleanUrl(process.env.EXPO_PUBLIC_LYRICS_API_URL),
  shoutout: cleanUrl(process.env.EXPO_PUBLIC_SHOUTOUT_URL),
  githubRepo: cleanUrl(process.env.EXPO_PUBLIC_GITHUB_REPO_API),
};

export default MUSIC_API;
