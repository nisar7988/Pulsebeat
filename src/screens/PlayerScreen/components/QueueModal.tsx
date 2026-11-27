import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { useAppTheme } from '../../../theme';
import { Song } from '../../../types/song';
import {
  getQueueSongs,
  getSongArtistName,
  getSongArtwork,
  getSongTitle,
  removeFromQueue,
  skipToQueueIndex,
} from '../../../service/player';
import { useUserStore } from '../../../store';

interface QueueModalProps {
  visible: boolean;
  accentColor?: string;
  onClose: () => void;
}

export default function QueueModal({
  visible,
  accentColor,
  onClose,
}: QueueModalProps) {
  const { theme, themeVars } = useAppTheme();
  const resolvedAccent = accentColor ?? theme.colors.accent.DEFAULT;
  const autoPlay = useUserStore((state) => state.autoPlay);
  const [songs, setSongs] = useState<Song[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const result = await getQueueSongs();
    setSongs(result.songs);
    setActiveIndex(result.activeIndex);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (visible) {
      loadQueue();
    }
  }, [visible, loadQueue]);

  const handlePlayIndex = async (index: number) => {
    await skipToQueueIndex(index);
    setActiveIndex(index);
    onClose();
  };

  const handleRemoveIndex = async (index: number) => {
    await removeFromQueue(index);
    await loadQueue();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background" style={themeVars}>
        <LinearGradient
          colors={theme.gradients.app}
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
            <View className="items-center">
              <Text className="text-base font-extrabold text-white">Up Next</Text>
              <Text className="text-[11px] text-text-muted mt-0.5">
                {songs.length} {songs.length === 1 ? 'track' : 'tracks'} • Auto-Play{' '}
                {autoPlay ? 'On' : 'Off'}
              </Text>
            </View>
            <View className="h-10 w-10" />
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={resolvedAccent} />
            </View>
          ) : songs.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <Feather name="list" size={32} color={theme.colors.text.muted} />
              <Text className="text-base font-bold text-white mt-3">
                Queue is Empty
              </Text>
              <Text className="text-xs text-text-muted mt-1 text-center">
                Play a song or playlist to populate your listening queue.
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerClassName="px-5 py-4 pb-12"
            >
              {songs.map((song, idx) => {
                const isCurrent = idx === activeIndex;
                return (
                  <TouchableOpacity
                    key={`${song.id}-${idx}`}
                    activeOpacity={0.8}
                    onPress={() => handlePlayIndex(idx)}
                    className={`flex-row items-center p-2.5 mb-2.5 rounded-2xl border ${
                      isCurrent
                        ? 'border-accent bg-accent/15'
                        : 'border-glass-border bg-glass-tint'
                    }`}
                  >
                    <Image
                      source={{ uri: getSongArtwork(song) }}
                      className="w-12 h-12 rounded-xl mr-3"
                      resizeMode="cover"
                    />
                    <View className="flex-1 pr-2">
                      <Text
                        className={`text-sm font-bold ${
                          isCurrent ? 'text-accent' : 'text-white'
                        }`}
                        numberOfLines={1}
                      >
                        {getSongTitle(song)}
                      </Text>
                      <Text className="text-xs text-text-muted mt-0.5" numberOfLines={1}>
                        {isCurrent ? 'Playing Now • ' : ''}
                        {getSongArtistName(song)}
                      </Text>
                    </View>

                    {isCurrent ? (
                      <View className="h-8 w-8 rounded-full bg-accent items-center justify-center">
                        <Feather name="volume-2" size={15} color={theme.colors.text.dark} />
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleRemoveIndex(idx)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        className="h-8 w-8 items-center justify-center"
                      >
                        <Feather name="x" size={16} color="rgba(255,255,255,0.55)" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}
