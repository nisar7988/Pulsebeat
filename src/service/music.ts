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
export const getSongBySearch = async (songName: string, page = 1, limit = 20) => {
  const response = await fetch(
    MUSIC_API.searchSongs
      .replace("{songName}", encodeURIComponent(songName))
      .replace("{page}", String(page))
      .replace("{limit}", String(limit)),
  );
  return await response.json();
};

// Search Albums
export const getAlbumBySearch = async (albumName: string, page = 1, limit = 20) => {
  const response = await fetch(
    MUSIC_API.searchAlbums
      .replace("{albumName}", encodeURIComponent(albumName))
      .replace("{page}", String(page))
      .replace("{limit}", String(limit)),
  );
  return await response.json();
};

// Search Artists
export const getArtistBySearch = async (artistName: string, page = 1, limit = 20) => {
  const response = await fetch(
    MUSIC_API.searchArtists
      .replace("{artistName}", encodeURIComponent(artistName))
      .replace("{page}", String(page))
      .replace("{limit}", String(limit)),
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
  const lowerLanguages = languages.map((l) => l.toLowerCase());
  const seeds: string[] = [];
  if (lowerLanguages.includes('punjabi')) {
    seeds.push('Diljit Dosanjh', 'Sidhu Moose Wala', 'Karan Aujla', 'AP Dhillon');
  }
  if (lowerLanguages.includes('hindi')) {
    seeds.push('Arijit Singh', 'Shreya Ghoshal', 'Atif Aslam', 'Badshah');
  }
  if (lowerLanguages.includes('spanish')) {
    seeds.push('Bad Bunny', 'Rosalia', 'J Balvin');
  }
  if (lowerLanguages.includes('korean')) {
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
export const getPlaylistBySearch = async (playlistName: string, page = 1, limit = 20) => {
  const response = await fetch(
    MUSIC_API.searchPlaylists
      .replace("{playlistName}", encodeURIComponent(playlistName))
      .replace("{page}", String(page))
      .replace("{limit}", String(limit)),
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

export interface LyricsResult {
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

interface LrcLibItem {
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
}

// Lyrics via LRCLIB (saavn.bycomsolutions.com /api/lyrics returns 404)
export const getSongLyrics = async (
  _songId: string,
  meta?: { title?: string; artist?: string; duration?: number },
): Promise<LyricsResult> => {
  const cleanTitle = (meta?.title || '')
    .replace(/\s*[[(].*?[\])]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanTitle) {
    return { plainLyrics: null, syncedLyrics: null };
  }

  const artistParts = (meta?.artist || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s.toLowerCase() !== 'unknown artist');

  const candidates: LrcLibItem[] = [];
  const fetchList = async (params: Record<string, string>) => {
    const qs = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const res = await fetch(`${MUSIC_API.lyrics}?${qs}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as LrcLibItem[]) : [];
  };

  for (const artist of artistParts.slice(0, 2)) {
    const list = await fetchList({ track_name: cleanTitle, artist_name: artist });
    candidates.push(...list);
    if (candidates.some((c) => !c.instrumental && (c.syncedLyrics || c.plainLyrics))) {
      break;
    }
  }

  if (!candidates.some((c) => !c.instrumental && (c.syncedLyrics || c.plainLyrics))) {
    const fallbackQuery = artistParts[0] ? `${cleanTitle} ${artistParts[0]}` : cleanTitle;
    const list = await fetchList({ q: fallbackQuery });
    candidates.push(...list);
  }

  const playable = candidates.filter(
    (c) => !c.instrumental && (c.syncedLyrics || c.plainLyrics),
  );
  if (!playable.length) {
    return { plainLyrics: null, syncedLyrics: null };
  }

  const targetDuration = meta?.duration || 0;
  playable.sort((a, b) => {
    const aHasSync = a.syncedLyrics ? 0 : 1;
    const bHasSync = b.syncedLyrics ? 0 : 1;
    if (aHasSync !== bHasSync) return aHasSync - bHasSync;
    if (targetDuration > 0 && a.duration && b.duration) {
      return Math.abs(a.duration - targetDuration) - Math.abs(b.duration - targetDuration);
    }
    return 0;
  });

  const best = playable[0];
  return {
    plainLyrics: best.plainLyrics?.trim() || null,
    syncedLyrics: best.syncedLyrics?.trim() || null,
  };
};