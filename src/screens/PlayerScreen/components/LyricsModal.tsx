import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgress } from 'react-native-track-player';
import { useAppTheme } from '../../../theme';
import { getSongLyrics } from '../../../service/music';
import { decodeHtmlEntities, seekTo } from '../../../service/player';

interface LyricsModalProps {
  visible: boolean;
  songId?: string;
  title: string;
  artist: string;
  duration?: number;
  accentColor?: string;
  onClose: () => void;
}

interface SyncedLine {
  timeSec: number;
  text: string;
}

function parseSyncedLyrics(raw: string): SyncedLine[] {
  const lines: SyncedLine[] = [];
  const regex = /^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/;
  for (const row of raw.split('\n')) {
    const match = row.trim().match(regex);
    if (!match) continue;
    const mins = Number(match[1]);
    const secs = Number(match[2]);
    const msStr = (match[3] || '0').padEnd(3, '0').slice(0, 3);
    const timeSec = mins * 60 + secs + Number(msStr) / 1000;
    const text = decodeHtmlEntities(match[4]).trim();
    if (text) {
      lines.push({ timeSec, text });
    }
  }
  return lines;
}

function formatPlainLyrics(raw: string): string {
  return decodeHtmlEntities(
    raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  ).trim();
}

export default function LyricsModal({
  visible,
  songId,
  title,
  artist,
  duration,
  accentColor,
  onClose,
}: LyricsModalProps) {
  const { theme, themeVars } = useAppTheme();
  const resolvedAccent = accentColor ?? theme.colors.accent.DEFAULT;
  const { position } = useProgress(250);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const lineOffsetsRef = useRef<Record<number, number>>({});

  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [syncedLines, setSyncedLines] = useState<SyncedLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadLyrics = useCallback(async () => {
    if (!songId && !title) {
      setPlainLyrics(null);
      setSyncedLines([]);
      return;
    }
    setLoading(true);
    setError(false);
    lineOffsetsRef.current = {};
    try {
      const res = await getSongLyrics(songId || '', { title, artist, duration });
      const parsedSync = res.syncedLyrics ? parseSyncedLyrics(res.syncedLyrics) : [];
      setSyncedLines(parsedSync);
      setPlainLyrics(res.plainLyrics ? formatPlainLyrics(res.plainLyrics) : null);
    } catch (e) {
      console.log('Lyrics fetch error:', e);
      setError(true);
      setPlainLyrics(null);
      setSyncedLines([]);
    } finally {
      setLoading(false);
    }
  }, [artist, duration, songId, title]);

  useEffect(() => {
    if (visible) {
      loadLyrics();
    }
  }, [visible, loadLyrics]);

  const activeLineIndex = useMemo(() => {
    if (!syncedLines.length) return -1;
    let active = -1;
    for (let i = 0; i < syncedLines.length; i++) {
      if (syncedLines[i].timeSec <= position + 0.35) {
        active = i;
      } else {
        break;
      }
    }
    return active;
  }, [position, syncedLines]);

  useEffect(() => {
    if (!visible || activeLineIndex < 0) return;
    const y = lineOffsetsRef.current[activeLineIndex];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 160), animated: true });
    }
  }, [activeLineIndex, visible]);

  const hasLyrics = syncedLines.length > 0 || Boolean(plainLyrics);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background" style={themeVars}>
        <LinearGradient
          colors={theme.gradients.player}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <View className="px-5 py-3 flex-row items-center justify-between border-b border-glass-border">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.75}
              className="h-10 w-10 rounded-full border border-glass-border bg-glass-tint items-center justify-center"
            >
              <Feather name="chevron-down" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="flex-1 mx-3 items-center">
              <Text
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: resolvedAccent }}
              >
                {syncedLines.length > 0 ? 'Synced Lyrics' : 'Lyrics'}
              </Text>
              <Text className="text-sm font-bold text-white mt-0.5" numberOfLines={1}>
                {title}
              </Text>
              <Text className="text-[11px] text-text-muted" numberOfLines={1}>
                {artist}
              </Text>
            </View>
            <View className="h-10 w-10" />
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={resolvedAccent} />
              <Text className="text-xs text-text-muted mt-3">
                Loading lyrics...
              </Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center px-8">
              <Feather name="wifi-off" size={32} color={theme.colors.text.muted} />
              <Text className="text-base font-bold text-white mt-3 text-center">
                Couldn't load lyrics
              </Text>
              <Text className="text-xs text-text-muted mt-1 text-center mb-4">
                Check your connection and try again.
              </Text>
              <TouchableOpacity
                onPress={loadLyrics}
                activeOpacity={0.85}
                className="px-5 py-2.5 rounded-full"
                style={{ backgroundColor: resolvedAccent }}
              >
                <Text className="text-xs font-extrabold text-text-dark">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : !hasLyrics ? (
            <View className="flex-1 items-center justify-center px-8">
              <View className="h-14 w-14 rounded-full border border-glass-border bg-glass-tint items-center justify-center mb-3">
                <Feather name="file-text" size={24} color={theme.colors.text.muted} />
              </View>
              <Text className="text-base font-bold text-white text-center">
                Lyrics Not Available
              </Text>
              <Text className="text-xs text-text-muted mt-1.5 text-center">
                We couldn't find lyrics for this track yet.
              </Text>
            </View>
          ) : syncedLines.length > 0 ? (
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerClassName="px-6 py-8 pb-24"
            >
              {syncedLines.map((line, idx) => {
                const isActive = idx === activeLineIndex;
                return (
                  <TouchableOpacity
                    key={`${line.timeSec}-${idx}`}
                    activeOpacity={0.75}
                    onPress={() => seekTo(line.timeSec)}
                    onLayout={(e) => {
                      lineOffsetsRef.current[idx] = e.nativeEvent.layout.y;
                    }}
                    className="py-2.5"
                  >
                    <Text
                      className={`text-xl leading-8 ${
                        isActive ? 'font-extrabold' : 'font-semibold text-white/45'
                      }`}
                      style={isActive ? { color: resolvedAccent } : undefined}
                    >
                      {line.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerClassName="px-6 py-6 pb-16"
            >
              <Text className="text-lg font-semibold text-white/90 leading-8">
                {plainLyrics}
              </Text>
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}
