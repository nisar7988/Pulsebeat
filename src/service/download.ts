import { Alert } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { Song } from '../types/song';
import { useUserStore } from '../store/useUserStore';
import {
  DownloadedSongRecord,
  useDownloadStore,
} from '../store/useDownloadStore';
import { getSongDetails } from './music';
import { decodeHtmlEntities, pickAudioUrlByQuality } from './audioUtils';

const DOWNLOADS_FOLDER = 'downloads';
const PROGRESS_THROTTLE_MS = 140;
const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  'm4a',
  'mp4',
  'mp3',
  'aac',
  'ogg',
  'wav',
  'flac',
  'webm',
]);

const inFlightControllers = new Map<string, AbortController>();
const inFlightPromises = new Map<string, Promise<DownloadedSongRecord | null>>();

function getDownloadsDirectory(ensureExists = false): Directory {
  const dir = new Directory(Paths.document, DOWNLOADS_FOLDER);
  if (ensureExists && !dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

function sanitizeId(id: string): string {
  const cleaned = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned || `track_${Date.now()}`;
}

function inferAudioExtension(url: string): string {
  const cleanPath = url.split('?')[0].split('#')[0];
  const lastSegment = cleanPath.split('/').pop() || '';
  const dotIdx = lastSegment.lastIndexOf('.');
  if (dotIdx !== -1 && dotIdx < lastSegment.length - 1) {
    const ext = lastSegment.slice(dotIdx + 1).toLowerCase();
    if (SUPPORTED_AUDIO_EXTENSIONS.has(ext)) {
      return ext;
    }
  }
  return 'm4a';
}

function inferImageExtension(url: string): string {
  const cleanPath = url.split('?')[0].split('#')[0].toLowerCase();
  if (cleanPath.endsWith('.png')) return 'png';
  if (cleanPath.endsWith('.webp')) return 'webp';
  return 'jpg';
}

function safeDeleteFile(file: File | null | undefined): void {
  if (!file) return;
  try {
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Ignore cleanup errors
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIdx = 0;
  while (value >= 1024 && unitIdx < units.length - 1) {
    value /= 1024;
    unitIdx += 1;
  }
  const decimals = unitIdx === 0 ? 0 : value >= 100 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unitIdx]}`;
}

export function getLocalAudioUri(songId?: string | null): string | null {
  if (!songId) return null;
  const record = useDownloadStore.getState().downloads[songId];
  if (!record?.fileName) return null;
  try {
    const file = new File(getDownloadsDirectory(), record.fileName);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

export function getLocalArtworkUri(songId?: string | null): string | null {
  if (!songId) return null;
  const record = useDownloadStore.getState().downloads[songId];
  if (!record?.artworkFileName) return null;
  try {
    const file = new File(getDownloadsDirectory(), record.artworkFileName);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

export function cancelDownload(songId: string): void {
  const controller = inFlightControllers.get(songId);
  if (controller) {
    controller.abort();
  }
  useDownloadStore.getState().setActiveDownload(songId, null);
}

async function resolveSongWithAudioUrl(
  song: Song,
  quality: ReturnType<typeof useUserStore.getState>['audioQuality'],
): Promise<{ resolvedSong: Song; audioUrl?: string }> {
  let resolvedSong = song;
  let audioUrl = pickAudioUrlByQuality(song.downloadUrl || [], quality);

  if (!audioUrl && song.id) {
    try {
      const data = await getSongDetails(song.id);
      const songDetail = data?.data?.[0];
      if (songDetail?.downloadUrl?.length) {
        resolvedSong = {
          ...song,
          downloadUrl: songDetail.downloadUrl,
        };
        audioUrl = pickAudioUrlByQuality(songDetail.downloadUrl, quality);
      }
    } catch (err) {
      console.log('Error resolving download URL:', err);
    }
  }

  return { resolvedSong, audioUrl };
}

async function downloadArtworkBestEffort(
  song: Song,
  dir: Directory,
  safeId: string,
): Promise<string | undefined> {
  const artworkUrl =
    song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url;
  if (!artworkUrl) return undefined;

  try {
    const ext = inferImageExtension(artworkUrl);
    const artworkFileName = `${safeId}_art.${ext}`;
    const targetArtwork = new File(dir, artworkFileName);
    const downloadedArt = await File.downloadFileAsync(artworkUrl, targetArtwork, {
      idempotent: true,
    });
    return downloadedArt.exists ? artworkFileName : undefined;
  } catch {
    return undefined;
  }
}

export async function downloadSong(
  song: Song,
  options?: { silent?: boolean },
): Promise<DownloadedSongRecord | null> {
  if (!song?.id) return null;

  const existingPromise = inFlightPromises.get(song.id);
  if (existingPromise) {
    return existingPromise;
  }

  const existingRecord = useDownloadStore.getState().downloads[song.id];
  if (existingRecord && getLocalAudioUri(song.id)) {
    return existingRecord;
  }

  const run = (async (): Promise<DownloadedSongRecord | null> => {
    const store = useDownloadStore.getState();
    const quality = useUserStore.getState().audioQuality;
    const controller = new AbortController();
    inFlightControllers.set(song.id, controller);
    store.setActiveDownload(song.id, {
      progress: 0,
      bytesWritten: 0,
      totalBytes: 0,
    });

    let targetAudioFile: File | null = null;

    try {
      const { resolvedSong, audioUrl } = await resolveSongWithAudioUrl(
        song,
        quality,
      );

      if (!audioUrl) {
        if (!options?.silent) {
          Alert.alert(
            'Download Unavailable',
            `Could not find a downloadable audio stream for "${decodeHtmlEntities(song.name) || 'this track'}".`,
          );
        }
        return null;
      }

      if (controller.signal.aborted) {
        return null;
      }

      const dir = getDownloadsDirectory(true);
      const safeId = sanitizeId(song.id);
      const ext = inferAudioExtension(audioUrl);
      const fileName = `${safeId}.${ext}`;
      targetAudioFile = new File(dir, fileName);

      let lastReportedAt = 0;
      let lastReportedProgress = -1;
      let lastKnownTotalBytes = 0;

      const downloadedFile = await File.downloadFileAsync(
        audioUrl,
        targetAudioFile,
        {
          idempotent: true,
          signal: controller.signal,
          onProgress: ({ bytesWritten, totalBytes }) => {
            if (totalBytes > 0) {
              lastKnownTotalBytes = totalBytes;
            }
            const progress =
              totalBytes > 0
                ? Math.min(Math.max(bytesWritten / totalBytes, 0), 1)
                : 0;
            const now = Date.now();
            if (
              progress >= 1 ||
              now - lastReportedAt >= PROGRESS_THROTTLE_MS ||
              progress - lastReportedProgress >= 0.03
            ) {
              lastReportedAt = now;
              lastReportedProgress = progress;
              useDownloadStore.getState().setActiveDownload(song.id, {
                progress,
                bytesWritten,
                totalBytes,
              });
            }
          },
        },
      );

      const fileSize = downloadedFile.size || lastKnownTotalBytes || 0;
      if (!downloadedFile.exists || fileSize <= 0) {
        safeDeleteFile(downloadedFile);
        throw new Error('Downloaded audio file is empty');
      }

      const artworkFileName = await downloadArtworkBestEffort(
        resolvedSong,
        dir,
        safeId,
      );

      const record: DownloadedSongRecord = {
        song: resolvedSong,
        fileName,
        artworkFileName,
        fileSize,
        quality,
        downloadedAt: Date.now(),
      };

      useDownloadStore.getState().markDownloaded(record);
      return record;
    } catch (error: any) {
      safeDeleteFile(targetAudioFile);
      if (error?.name === 'AbortError' || controller.signal.aborted) {
        return null;
      }
      console.log('Download song error:', error);
      if (!options?.silent) {
        Alert.alert(
          'Download Failed',
          `Unable to download "${decodeHtmlEntities(song.name) || 'this track'}". Check your connection and try again.`,
        );
      }
      return null;
    } finally {
      inFlightControllers.delete(song.id);
      inFlightPromises.delete(song.id);
      useDownloadStore.getState().setActiveDownload(song.id, null);
    }
  })();

  inFlightPromises.set(song.id, run);
  return run;
}

export async function downloadSongsBatch(
  songs: Song[],
  concurrency = 2,
): Promise<{ downloaded: number; skipped: number; failed: number }> {
  const pending: Song[] = [];
  let skipped = 0;

  for (const song of songs) {
    if (!song?.id) continue;
    if (getLocalAudioUri(song.id)) {
      skipped += 1;
    } else {
      pending.push(song);
    }
  }

  let downloaded = 0;
  let failed = 0;
  let cursor = 0;

  const workers = Array.from(
    { length: Math.min(concurrency, pending.length) },
    async () => {
      while (cursor < pending.length) {
        const current = pending[cursor];
        cursor += 1;
        const result = await downloadSong(current, { silent: true });
        if (result) {
          downloaded += 1;
        } else {
          failed += 1;
        }
      }
    },
  );

  await Promise.all(workers);
  return { downloaded, skipped, failed };
}

export function removeDownloadedSong(songId: string): void {
  cancelDownload(songId);
  const record = useDownloadStore.getState().downloads[songId];
  if (record) {
    try {
      const dir = getDownloadsDirectory();
      safeDeleteFile(new File(dir, record.fileName));
      if (record.artworkFileName) {
        safeDeleteFile(new File(dir, record.artworkFileName));
      }
    } catch {
      // Ignore filesystem errors during cleanup
    }
  }
  useDownloadStore.getState().removeDownloadedRecord(songId);
}

export function clearAllDownloads(): void {
  for (const songId of Array.from(inFlightControllers.keys())) {
    cancelDownload(songId);
  }
  try {
    const dir = getDownloadsDirectory();
    if (dir.exists) {
      dir.delete();
    }
  } catch {
    // Ignore directory deletion errors
  }
  useDownloadStore.getState().clearDownloadedRecords();
}
