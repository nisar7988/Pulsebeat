import AsyncStorage from '@react-native-async-storage/async-storage';
import MUSIC_API, { API_MIRRORS, MUSIC_PATHS } from '../config/api';

const REQUEST_TIMEOUT_MS = 6000;
const CACHE_PREFIX = '@pulsebeat_api_cache:';
let activeMirrorIndex = 0;

async function fetchJsonWithTimeout(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchMusicEndpoint(path: string): Promise<any> {
  const count = API_MIRRORS.length;
  if (count === 0) {
    throw new Error(
      'No music API URL configured. Set EXPO_PUBLIC_MUSIC_API_URL in .env.',
    );
  }

  let lastError: unknown;

  for (let offset = 0; offset < count; offset++) {
    const idx = (activeMirrorIndex + offset) % count;
    const base = API_MIRRORS[idx];
    try {
      const data = await fetchJsonWithTimeout(`${base}${path}`);
      if (data && typeof data === 'object') {
        activeMirrorIndex = idx;
        return data;
      }
      throw new Error('Empty API response');
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All music API mirrors failed');
}

async function readCache<T>(cacheKey: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${cacheKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed?.data ?? null) as T | null;
  } catch {
    return null;
  }
}

async function writeCache<T>(cacheKey: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${cacheKey}`,
      JSON.stringify({ ts: Date.now(), data }),
    );
  } catch {
    // Ignore cache write errors
  }
}

async function fetchWithOfflineCache(path: string, cacheKey: string): Promise<any> {
  try {
    const data = await fetchMusicEndpoint(path);
    writeCache(cacheKey, data);
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return { ...data, _fromCache: false };
    }
    return data;
  } catch (err) {
    const cached = await readCache<any>(cacheKey);
    if (cached) {
      if (typeof cached === 'object' && !Array.isArray(cached)) {
        return { ...cached, _fromCache: true };
      }
      return cached;
    }
    throw err;
  }
}

// Home
export const getHomeData = async (language: string) => {
  const q = encodeURIComponent(language);
  return await fetchWithOfflineCache(`/modules?language=${q}`, `modules_${language.toLowerCase()}`);
};

// Global Search
export const getGlobalSearch = async (query: string) => {
  const path = MUSIC_PATHS.search.replace('{query}', encodeURIComponent(query));
  return await fetchMusicEndpoint(path);
};

// Search Songs
export const getSongBySearch = async (songName: string, page = 1, limit = 20) => {
  const path = MUSIC_PATHS.searchSongs
    .replace('{songName}', encodeURIComponent(songName))
    .replace('{page}', String(page))
    .replace('{limit}', String(limit));
  return await fetchMusicEndpoint(path);
};

// Search Albums
export const getAlbumBySearch = async (albumName: string, page = 1, limit = 20) => {
  const path = MUSIC_PATHS.searchAlbums
    .replace('{albumName}', encodeURIComponent(albumName))
    .replace('{page}', String(page))
    .replace('{limit}', String(limit));
  return await fetchMusicEndpoint(path);
};

// Search Artists
export const getArtistBySearch = async (artistName: string, page = 1, limit = 20) => {
  const path = MUSIC_PATHS.searchArtists
    .replace('{artistName}', encodeURIComponent(artistName))
    .replace('{page}', String(page))
    .replace('{limit}', String(limit));
  return await fetchMusicEndpoint(path);
};

export interface ApiArtist {
  id: string;
  name: string;
  role?: string;
  genre?: string;
  avatar: string;
}

const LANGUAGE_ARTIST_SEEDS: Record<string, string[]> = {
  english: ['The Weeknd', 'Taylor Swift', 'Drake', 'Dua Lipa', 'Billie Eilish', 'Ed Sheeran'],
  hindi: ['Arijit Singh', 'Shreya Ghoshal', 'Atif Aslam', 'Pritam', 'Jubin Nautiyal', 'Badshah'],
  punjabi: ['Diljit Dosanjh', 'Karan Aujla', 'AP Dhillon', 'Sidhu Moose Wala', 'Shubh', 'Ammy Virk'],
  tamil: ['Anirudh Ravichander', 'A.R. Rahman', 'Sid Sriram', 'Yuvan Shankar Raja', 'G.V. Prakash'],
  telugu: ['Devi Sri Prasad', 'Thaman S', 'Sid Sriram', 'Anirudh Ravichander', 'Armaan Malik'],
  spanish: ['Bad Bunny', 'Rosalia', 'J Balvin', 'Shakira', 'Karol G'],
  korean: ['BTS', 'BLACKPINK', 'Jungkook', 'Stray Kids', 'NewJeans'],
  japanese: ['YOASOBI', 'Kenshi Yonezu', 'Ado', 'Fujii Kaze', 'LiSA'],
  french: ['Stromae', 'Aya Nakamura', 'Indila', 'Daft Punk', 'Gims'],
  german: ['Rammstein', 'Apache 207', 'Robin Schulz', 'Zedd', 'Cro'],
  arabic: ['Amr Diab', 'Nancy Ajram', 'Elissa', 'Tamer Hosny', 'Saad Lamjarred'],
  bengali: ['Arijit Singh', 'Anupam Roy', 'Shreya Ghoshal', 'Nachiketa', 'Fossils'],
};

// Fetch popular artists from API matching user's preferred languages
export const getPopularArtists = async (languages: string[] = []): Promise<ApiArtist[]> => {
  const lowerLanguages = languages.map((l) => l.toLowerCase());
  const seeds: string[] = [];

  for (const lang of lowerLanguages) {
    const langSeeds = LANGUAGE_ARTIST_SEEDS[lang];
    if (langSeeds) {
      seeds.push(...langSeeds);
    }
  }

  if (seeds.length < 10) {
    seeds.push(
      'The Weeknd',
      'Taylor Swift',
      'Arijit Singh',
      'Drake',
      'Dua Lipa',
      'Billie Eilish',
      'Ed Sheeran',
      'Bruno Mars',
      'Post Malone',
      'Ariana Grande',
    );
  }

  const uniqueSeeds = Array.from(new Set(seeds)).slice(0, 14);

  const results = await Promise.allSettled(
    uniqueSeeds.map(async (name) => {
      const res = await getArtistBySearch(name);
      const first = res?.data?.results?.[0];
      if (!first) return null;
      const imageUrl =
        first.image?.[2]?.url ||
        first.image?.[1]?.url ||
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
  const seenIds = new Set<string>();
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value && !seenIds.has(r.value.id)) {
      seenIds.add(r.value.id);
      artists.push(r.value);
    }
  }

  const cacheKey = `popular_artists_${lowerLanguages.join('_') || 'default'}`;
  if (artists.length > 0) {
    writeCache(cacheKey, artists);
    return artists;
  }

  const cached = await readCache<ApiArtist[]>(cacheKey);
  return cached ?? [];
};

// Resolve user-selected artist IDs/slugs into ApiArtist objects with avatars
export const resolveSelectedArtists = async (
  artistIds: string[],
  savedProfiles: Record<string, ApiArtist> = {},
  artistNames: Record<string, string> = {},
): Promise<ApiArtist[]> => {
  if (!artistIds.length) return [];

  const resolved = await Promise.allSettled(
    artistIds.map(async (id): Promise<ApiArtist | null> => {
      if (savedProfiles[id]?.name && savedProfiles[id]?.avatar) {
        return savedProfiles[id];
      }
      const isNumericId = /^\d+$/.test(id);
      if (isNumericId) {
        const res = await getArtistDetails(id);
        const item = res?.data;
        if (item?.id && item?.name) {
          return {
            id: String(item.id),
            name: String(item.name),
            role: item.role || 'Artist',
            genre: item.role || 'Artist',
            avatar:
              item.image?.[2]?.url ||
              item.image?.[1]?.url ||
              item.image?.[0]?.url ||
              'https://c.saavncdn.com/artists/default_150x150.jpg',
          };
        }
      }
      const lookupName = artistNames[id] || id.replace(/-/g, ' ');
      const res = await getArtistBySearch(lookupName, 1, 1);
      const first = res?.data?.results?.[0];
      if (!first) return null;
      return {
        id: String(first.id),
        name: String(first.name),
        role: first.role || 'Artist',
        genre: first.role || 'Artist',
        avatar:
          first.image?.[2]?.url ||
          first.image?.[1]?.url ||
          first.image?.[0]?.url ||
          'https://c.saavncdn.com/artists/default_150x150.jpg',
      };
    }),
  );

  const list: ApiArtist[] = [];
  const seen = new Set<string>();
  for (const item of resolved) {
    if (item.status === 'fulfilled' && item.value && !seen.has(item.value.id)) {
      seen.add(item.value.id);
      list.push(item.value);
    }
  }
  return list;
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
  const path = MUSIC_PATHS.searchPlaylists
    .replace('{playlistName}', encodeURIComponent(playlistName))
    .replace('{page}', String(page))
    .replace('{limit}', String(limit));
  return await fetchWithOfflineCache(
    path,
    `playlists_${playlistName.toLowerCase()}_p${page}`,
  );
};

// Song Details
export const getSongDetails = async (songId: string) => {
  const path = MUSIC_PATHS.songById.replace('{songId}', encodeURIComponent(songId));
  return await fetchWithOfflineCache(path, `song_${songId}`);
};

// Album Details
export const getAlbumDetails = async (albumId: string) => {
  const path = MUSIC_PATHS.album.replace('{albumId}', encodeURIComponent(albumId));
  return await fetchWithOfflineCache(path, `album_${albumId}`);
};

// Artist Details
export const getArtistDetails = async (artistId: string) => {
  const path = MUSIC_PATHS.artist.replace('{artistId}', encodeURIComponent(artistId));
  return await fetchWithOfflineCache(path, `artist_${artistId}`);
};

// Artist Songs (0-indexed pagination on API)
export const getArtistSongs = async (artistId: string, page = 0) => {
  const path = MUSIC_PATHS.artistSongs
    .replace('{artistId}', encodeURIComponent(artistId))
    .replace('{page}', String(page));
  return await fetchWithOfflineCache(path, `artist_songs_${artistId}_p${page}`);
};

// Songs by Genre (tailored to user's preferred language when provided)
export const getSongsByGenre = async (
  genre: string,
  page = 1,
  limit = 12,
  language?: string,
) => {
  const query = language ? `${language} ${genre}` : `${genre} hits`;
  const path = MUSIC_PATHS.searchSongs
    .replace('{songName}', encodeURIComponent(query))
    .replace('{page}', String(page))
    .replace('{limit}', String(limit));
  const cacheKey = `genre_${(language || 'all').toLowerCase()}_${genre.toLowerCase()}_p${page}`;
  const data = await fetchWithOfflineCache(path, cacheKey);
  const results = data?.data?.results || [];
  if (language && results.length === 0) {
    const fallbackPath = MUSIC_PATHS.searchSongs
      .replace('{songName}', encodeURIComponent(`${genre} hits`))
      .replace('{page}', String(page))
      .replace('{limit}', String(limit));
    return await fetchWithOfflineCache(
      fallbackPath,
      `genre_all_${genre.toLowerCase()}_p${page}`,
    );
  }
  return data;
};

// Songs by Language
export const getSongsByLanguage = async (language: string, page = 1, limit = 15) => {
  const query = `${language} top hits`;
  const path = MUSIC_PATHS.searchSongs
    .replace('{songName}', encodeURIComponent(query))
    .replace('{page}', String(page))
    .replace('{limit}', String(limit));
  return await fetchWithOfflineCache(path, `lang_${language.toLowerCase()}_p${page}`);
};

// Playlist Details
export const getPlaylistDetails = async (playlistId: string) => {
  const path = MUSIC_PATHS.playlist.replace('{playlistId}', encodeURIComponent(playlistId));
  return await fetchWithOfflineCache(path, `playlist_${playlistId}`);
};

// Song Suggestions
export const getSongSuggestions = async (songId: string) => {
  const path = MUSIC_PATHS.songSuggestions.replace('{songId}', encodeURIComponent(songId));
  return await fetchMusicEndpoint(path);
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
    if (!MUSIC_API.lyrics) return [];
    const qs = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    try {
      const data = await fetchJsonWithTimeout(`${MUSIC_API.lyrics}?${qs}`);
      return Array.isArray(data) ? (data as LrcLibItem[]) : [];
    } catch {
      return [];
    }
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