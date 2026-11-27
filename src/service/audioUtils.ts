import { AudioQuality } from '../store/useUserStore';

export function decodeHtmlEntities(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function pickAudioUrlByQuality(
  urls: Array<{ quality?: string; url?: string }>,
  quality: AudioQuality,
): string | undefined {
  if (!urls.length) return undefined;
  if (quality === 'high') {
    return urls[urls.length - 1]?.url || urls[0]?.url;
  }
  if (quality === 'medium') {
    const midIndex = Math.floor((urls.length - 1) / 2);
    return urls[midIndex]?.url || urls[urls.length - 1]?.url || urls[0]?.url;
  }
  return urls[0]?.url || urls[urls.length - 1]?.url;
}
