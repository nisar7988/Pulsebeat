import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../../theme';
import { Song } from '../../../types/song';
import {
  getSongArtistName,
  getSongArtwork,
  getSongTitle,
} from '../../../service/player';

export interface ActivePlaylistDetail {
  id: string;
  title: string;
  subtitle: string;
  badgeLabel?: string;
  image?: string;
  isLocal: boolean;
  isBuiltIn?: boolean;
  songs: Song[];
}

interface PlaylistDetailModalProps {
  playlist: ActivePlaylistDetail | null;
  loading: boolean;
  onClose: () => void;
  onPlayAll: (songs: Song[], startIndex?: number) => void;
  onRemoveSong?: (playlistId: string, songId: string) => void;
  onDeletePlaylist?: (playlistId: string) => void;
  onRenamePlaylist?: (playlistId: string, newName: string) => void;
  onSaveCuratedPlaylist?: (playlist: ActivePlaylistDetail) => void;
}

export default function PlaylistDetailModal({
  playlist,
  loading,
  onClose,
  onPlayAll,
  onRemoveSong,
  onDeletePlaylist,
  onRenamePlaylist,
  onSaveCuratedPlaylist,
}: PlaylistDetailModalProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');

  useEffect(() => {
    setEditingTitle(false);
    setDraftTitle(playlist?.title || '');
  }, [playlist?.id, playlist?.title]);

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

  const handleSaveRename = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== playlist.title) {
      onRenamePlaylist?.(playlist.id, trimmed);
    }
    setEditingTitle(false);
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
            {playlist.badgeLabel ||
              (playlist.isLocal ? 'Local Playlist' : 'Curated Collection')}
          </Text>
          {playlist.isLocal && !playlist.isBuiltIn ? (
            <TouchableOpacity
              onPress={handleDelete}
              className="h-10 w-10 rounded-full border border-glass-border bg-glass-tint items-center justify-center"
            >
              <Feather name="trash-2" size={16} color="#EF4444" />
            </TouchableOpacity>
          ) : !playlist.isLocal && onSaveCuratedPlaylist ? (
            <TouchableOpacity
              disabled={loading || playlist.songs.length === 0}
              onPress={() => onSaveCuratedPlaylist(playlist)}
              className={`h-10 px-3 rounded-full border border-accent/50 bg-accent/15 items-center justify-center ${
                loading || playlist.songs.length === 0 ? 'opacity-40' : ''
              }`}
            >
              <Text className="text-xs font-bold text-accent">Save</Text>
            </TouchableOpacity>
          ) : (
            <View className="h-10 w-10" />
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
                  name={playlist.isBuiltIn ? 'heart' : 'music'}
                  size={48}
                  color={theme.colors.accent.DEFAULT}
                />
              )}
            </View>

            {editingTitle ? (
              <View className="w-full flex-row items-center gap-2 px-4 mb-1">
                <TextInput
                  value={draftTitle}
                  onChangeText={setDraftTitle}
                  autoFocus
                  maxLength={36}
                  onSubmitEditing={handleSaveRename}
                  className="flex-1 rounded-xl border border-accent/50 bg-white/10 px-3 py-2 text-base font-bold text-white text-center"
                />
                <TouchableOpacity
                  onPress={handleSaveRename}
                  className="h-9 px-3 rounded-xl bg-accent items-center justify-center"
                >
                  <Text className="text-xs font-extrabold text-text-dark">Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row items-center justify-center gap-2 px-4">
                <Text
                  className="text-2xl font-extrabold text-white text-center"
                  numberOfLines={2}
                >
                  {playlist.title}
                </Text>
                {playlist.isLocal && !playlist.isBuiltIn && onRenamePlaylist && (
                  <TouchableOpacity
                    onPress={() => {
                      setDraftTitle(playlist.title);
                      setEditingTitle(true);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="h-7 w-7 rounded-full border border-glass-border bg-glass-tint items-center justify-center"
                  >
                    <Feather name="edit-2" size={12} color={theme.colors.accent.DEFAULT} />
                  </TouchableOpacity>
                )}
              </View>
            )}

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
                Tap the + button on any track to add songs here.
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
                    {getSongTitle(song)}
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
