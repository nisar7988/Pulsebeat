import React from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { theme } from '../../../theme';
import { Song } from '../../../types/song';
import { getSongArtistName, getSongArtwork } from '../../../service/player';

export interface ActivePlaylistDetail {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  isLocal: boolean;
  songs: Song[];
}

interface PlaylistDetailModalProps {
  playlist: ActivePlaylistDetail | null;
  loading: boolean;
  onClose: () => void;
  onPlayAll: (songs: Song[], startIndex?: number) => void;
  onRemoveSong?: (playlistId: string, songId: string) => void;
  onDeletePlaylist?: (playlistId: string) => void;
  onSaveCuratedPlaylist?: (playlist: ActivePlaylistDetail) => void;
}

export default function PlaylistDetailModal({
  playlist,
  loading,
  onClose,
  onPlayAll,
  onRemoveSong,
  onDeletePlaylist,
  onSaveCuratedPlaylist,
}: PlaylistDetailModalProps) {
  if (!playlist) return null;

  const coverUrl =
    playlist.image ||
    (playlist.songs[0] ? getSongArtwork(playlist.songs[0]) : undefined);

  const handleDelete = () => {
    Alert.alert(
      'Delete Playlist',
      `Delete "${playlist.title}" from your local library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDeletePlaylist?.(playlist.id);
            onClose();
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={!!playlist}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <LinearGradient
          colors={theme.gradients.app}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View className="pt-12 px-5 pb-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={onClose}
            className="h-10 w-10 rounded-full border border-glass-border bg-glass-tint items-center justify-center"
          >
            <Feather name="chevron-down" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-xs font-bold text-text-muted uppercase tracking-widest">
            {playlist.isLocal ? 'Local Playlist' : 'Curated Collection'}
          </Text>
          {playlist.isLocal ? (
            <TouchableOpacity
              onPress={handleDelete}
              className="h-10 w-10 rounded-full border border-glass-border bg-glass-tint items-center justify-center"
            >
              <Feather name="trash-2" size={16} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => onSaveCuratedPlaylist?.(playlist)}
              className="h-10 px-3 rounded-full border border-accent/50 bg-accent/15 items-center justify-center"
            >
              <Text className="text-xs font-bold text-accent">Save</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-5 pb-16"
        >
          {/* Hero */}
          <View className="items-center mt-2 mb-6">
            <View className="w-44 h-44 rounded-3xl overflow-hidden border border-glass-border bg-glass-tint items-center justify-center mb-4">
              {coverUrl ? (
                <Image
                  source={{ uri: coverUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Feather
                  name="music"
                  size={48}
                  color={theme.colors.accent.DEFAULT}
                />
              )}
            </View>
            <Text
              className="text-2xl font-extrabold text-white text-center"
              numberOfLines={2}
            >
              {playlist.title}
            </Text>
            <Text className="text-xs text-text-muted mt-1">
              {loading
                ? 'Loading tracks...'
                : `${playlist.songs.length} tracks`}
            </Text>

            {playlist.songs.length > 0 && !loading && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  onPlayAll(playlist.songs, 0);
                  onClose();
                }}
                className="mt-4 flex-row items-center gap-2 bg-accent px-6 py-3 rounded-full"
              >
                <Feather name="play" size={16} color={theme.colors.text.dark} />
                <Text className="text-sm font-extrabold text-text-dark">
                  Play All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={theme.colors.accent.DEFAULT} />
            </View>
          ) : playlist.songs.length === 0 ? (
            <View className="p-6 rounded-2xl border border-glass-border bg-glass-tint items-center">
              <Text className="text-sm font-semibold text-white mb-1">
                No songs in this playlist yet
              </Text>
              <Text className="text-xs text-text-muted text-center">
                Tap the + button on any track in Library to add songs here.
              </Text>
            </View>
          ) : (
            playlist.songs.map((song, idx) => (
              <TouchableOpacity
                key={`${song.id}-${idx}`}
                activeOpacity={0.8}
                onPress={() => {
                  onPlayAll(playlist.songs, idx);
                  onClose();
                }}
                className="flex-row items-center py-2.5 px-3 mb-2 rounded-2xl border border-glass-border bg-glass-tint"
              >
                <Image
                  source={{ uri: getSongArtwork(song) }}
                  className="w-12 h-12 rounded-xl mr-3"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text
                    className="text-sm font-bold text-white"
                    numberOfLines={1}
                  >
                    {song.name}
                  </Text>
                  <Text
                    className="text-xs text-text-muted mt-0.5"
                    numberOfLines={1}
                  >
                    {getSongArtistName(song)}
                  </Text>
                </View>

                {playlist.isLocal && onRemoveSong ? (
                  <TouchableOpacity
                    onPress={() => onRemoveSong(playlist.id, song.id)}
                    className="h-9 w-9 items-center justify-center"
                  >
                    <Feather name="minus-circle" size={17} color="rgba(255,255,255,0.55)" />
                  </TouchableOpacity>
                ) : (
                  <View className="h-9 w-9 rounded-full bg-accent/15 items-center justify-center">
                    <Feather
                      name="play"
                      size={14}
                      color={theme.colors.accent.DEFAULT}
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
