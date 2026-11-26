const BASE_URL = "https://saavn.bycomsolutions.com/api";

export const MUSIC_API = {
  // Search
  search: `${BASE_URL}/search?query={query}`,
  searchSongs: `${BASE_URL}/search/songs?query={songName}&page={page}&limit={limit}`,
  searchAlbums: `${BASE_URL}/search/albums?query={albumName}&page={page}&limit={limit}`,
  searchArtists: `${BASE_URL}/search/artists?query={artistName}&page={page}&limit={limit}`,
  searchPlaylists: `${BASE_URL}/search/playlists?query={playlistName}&page={page}&limit={limit}`,

  // Songs
  songs: `${BASE_URL}/songs?id={songId}`,
  songById: `${BASE_URL}/songs/{songId}`,
  songSuggestions: `${BASE_URL}/songs/{songId}/suggestions`,

  // Albums
  album: `${BASE_URL}/albums?id={albumId}`,

  // Artists
  artist: `${BASE_URL}/artists?id={artistId}`,
  artistById: `${BASE_URL}/artists/{artistId}`,
  artistSongs: `${BASE_URL}/artists/{artistId}/songs`,
  artistAlbums: `${BASE_URL}/artists/{artistId}/albums`,

  // Playlists
  playlist: `${BASE_URL}/playlists?id={playlistId}`,

  // Lyrics (LRCLIB public API)
  lyrics: `https://lrclib.net/api/search`,

  // Browse
  modules: `${BASE_URL}/modules?language={language}`,
};

export default MUSIC_API;