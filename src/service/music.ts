import MUSIC_API from "../config/api";

// Home
export const getHomeData = async (language: string) => {
  const response = await fetch(
    MUSIC_API.modules.replace("{language}", encodeURIComponent(language)),
  );
  return await response.json();
};

// Global Search
export const getGlobalSearch = async (query: string) => {
  const response = await fetch(
    MUSIC_API.search.replace("{query}", encodeURIComponent(query)),
  );
  return await response.json();
};

// Search Songs
export const getSongBySearch = async (songName: string) => {
  const response = await fetch(
    MUSIC_API.searchSongs
      .replace("{songName}", encodeURIComponent(songName))
      .replace("{page}", "1")
      .replace("{limit}", "20"),
  );
  return await response.json();
};

// Search Albums
export const getAlbumBySearch = async (albumName: string) => {
  const response = await fetch(
    MUSIC_API.searchAlbums
      .replace("{albumName}", encodeURIComponent(albumName))
      .replace("{page}", "1")
      .replace("{limit}", "20"),
  );
  return await response.json();
};

// Search Artists
export const getArtistBySearch = async (artistName: string) => {
  const response = await fetch(
    MUSIC_API.searchArtists
      .replace("{artistName}", encodeURIComponent(artistName))
      .replace("{page}", "1")
      .replace("{limit}", "20"),
  );
  return await response.json();
};

export interface ApiArtist {
  id: string;
  name: string;
  role?: string;
  genre?: string;
  avatar: string;
}

// Fetch popular artists from API based on preferred languages or global seeds
export const getPopularArtists = async (languages: string[] = []): Promise<ApiArtist[]> => {
  const seeds: string[] = [];
  if (languages.includes('punjabi')) {
    seeds.push('Diljit Dosanjh', 'Sidhu Moose Wala', 'Karan Aujla', 'AP Dhillon');
  }
  if (languages.includes('hindi')) {
    seeds.push('Arijit Singh', 'Shreya Ghoshal', 'Atif Aslam', 'Badshah');
  }
  if (languages.includes('spanish')) {
    seeds.push('Bad Bunny', 'Rosalia', 'J Balvin');
  }
  if (languages.includes('korean')) {
    seeds.push('BTS', 'BLACKPINK');
  }
  seeds.push(
    'The Weeknd',
    'Taylor Swift',
    'Drake',
    'Dua Lipa',
    'Billie Eilish',
    'Ed Sheeran',
    'Bruno Mars',
    'Post Malone',
    'Ariana Grande',
    'Justin Bieber',
  );

  const uniqueSeeds = Array.from(new Set(seeds)).slice(0, 15);

  const results = await Promise.allSettled(
    uniqueSeeds.map(async (name) => {
      const res = await getArtistBySearch(name);
      const first = res?.data?.results?.[0];
      if (!first) return null;
      const imageUrl =
        first.image?.[1]?.url ||
        first.image?.[2]?.url ||
        first.image?.[0]?.url ||
        'https://c.saavncdn.com/artists/default_150x150.jpg';
      return {
        id: String(first.id),
        name: String(first.name),
        role: first.role || 'Artist',
        genre: first.role || 'Artist',
        avatar: imageUrl,
      };
    }),
  );

  const artists: ApiArtist[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      artists.push(r.value);
    }
  }

  return artists;
};

// Search artists for onboarding
export const searchArtistsForOnboarding = async (query: string): Promise<ApiArtist[]> => {
  if (!query.trim()) return [];
  try {
    const res = await getArtistBySearch(query);
    const results = res?.data?.results ?? [];
    return results.map((item: any) => ({
      id: String(item.id),
      name: String(item.name),
      role: item.role || 'Artist',
      genre: item.role || 'Artist',
      avatar:
        item.image?.[1]?.url ||
        item.image?.[2]?.url ||
        item.image?.[0]?.url ||
        'https://c.saavncdn.com/artists/default_150x150.jpg',
    }));
  } catch (error) {
    console.log('Error searching artists:', error);
    return [];
  }
};

// Search Playlists
export const getPlaylistBySearch = async (playlistName: string) => {
  const response = await fetch(
    MUSIC_API.searchPlaylists
      .replace("{playlistName}", encodeURIComponent(playlistName))
      .replace("{page}", "1")
      .replace("{limit}", "20"),
  );
  return await response.json();
};

// Song Details
export const getSongDetails = async (songId: string) => {
  const response = await fetch(
    MUSIC_API.songs.replace("{songId}", encodeURIComponent(songId)),
  );
  return await response.json();
};

// Album Details
export const getAlbumDetails = async (albumId: string) => {
  const response = await fetch(
    MUSIC_API.album.replace("{albumId}", encodeURIComponent(albumId)),
  );
  return await response.json();
};

// Artist Details
export const getArtistDetails = async (artistId: string) => {
  const response = await fetch(
    MUSIC_API.artist.replace("{artistId}", encodeURIComponent(artistId)),
  );
  return await response.json();
};

// Artist Songs
export const getArtistSongs = async (artistId: string, page = 1) => {
  const response = await fetch(
    MUSIC_API.artistSongs
      .replace("{artistId}", encodeURIComponent(artistId))
      .replace("{page}", String(page)),
  );
  return await response.json();
};

// Songs by Genre
export const getSongsByGenre = async (genre: string, page = 1, limit = 10) => {
  const query = `${genre} hits`;
  const response = await fetch(
    MUSIC_API.searchSongs
      .replace("{songName}", encodeURIComponent(query))
      .replace("{page}", String(page))
      .replace("{limit}", String(limit)),
  );
  return await response.json();
};

// Songs by Language
export const getSongsByLanguage = async (language: string, page = 1, limit = 15) => {
  const query = `${language} top hits`;
  const response = await fetch(
    MUSIC_API.searchSongs
      .replace("{songName}", encodeURIComponent(query))
      .replace("{page}", String(page))
      .replace("{limit}", String(limit)),
  );
  return await response.json();
};

// Playlist Details
export const getPlaylistDetails = async (playlistId: string) => {
  const response = await fetch(
    MUSIC_API.playlist.replace("{playlistId}", encodeURIComponent(playlistId)),
  );
  return await response.json();
};

// Song Suggestions
export const getSongSuggestions = async (songId: string) => {
  const response = await fetch(
    MUSIC_API.songSuggestions.replace("{songId}", encodeURIComponent(songId)),
  );
  return await response.json();
};

// Lyrics
export const getSongLyrics = async (songId: string) => {
  const response = await fetch(
    MUSIC_API.lyrics.replace("{songId}", encodeURIComponent(songId)),
  );
  return await response.json();
};