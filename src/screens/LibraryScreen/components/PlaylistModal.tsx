import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../../theme';
import { Song } from '../../../types/song';
import { UserPlaylist } from '../../../store';

interface PlaylistModalProps {
  visible: boolean;
  songToAdd?: Song | null;
  playlists: UserPlaylist[];
  likedSongs?: Song[];
  onClose: () => void;
  onCreatePlaylist: (name: string, song?: Song | null) => void;
  onSelectPlaylist?: (playlistId: string, song: Song) => void;
  onToggleLikeSong?: (song: Song) => void;
}

export default function PlaylistModal({
  visible,
  songToAdd,
  playlists,
  likedSongs = [],
  onClose,
  onCreatePlaylist,
  onSelectPlaylist,
  onToggleLikeSong,
}: PlaylistModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
    }
  }, [visible]);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreatePlaylist(trimmed, songToAdd);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-extrabold text-white">
              {songToAdd ? 'Add to Playlist' : 'New Playlist'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="h-8 w-8 rounded-full bg-white/10 items-center justify-center"
            >
              <Feather name="x" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {songToAdd && (playlists.length > 0 || Boolean(onToggleLikeSong)) && (
            <View className="mb-4">
              <Text className="text-xs font-semibold text-text-muted mb-2">
                Your Playlists
              </Text>
              <ScrollView style={{ maxHeight: 190 }}>
                {onToggleLikeSong && (() => {
                  const isLiked = likedSongs.some((s) => s.id === songToAdd.id);
                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        onToggleLikeSong(songToAdd);
                        onClose();
                      }}
                      className="flex-row items-center justify-between py-2.5 px-3 mb-2 rounded-xl border border-accent/35 bg-accent/10"
                    >
                      <View className="flex-row items-center gap-2.5 flex-1">
                        <Feather
                          name="heart"
                          size={15}
                          color={theme.colors.accent.DEFAULT}
                        />
                        <Text
                          className="text-sm font-bold text-white flex-1"
                          numberOfLines={1}
                        >
                          Liked Songs
                        </Text>
                      </View>
                      <Text className="text-xs font-semibold text-accent">
                        {isLiked ? 'Liked ✓' : `${likedSongs.length} tracks`}
                      </Text>
                    </TouchableOpacity>
                  );
                })()}
                {playlists.map((pl) => {
                  const alreadyIn = pl.songs.some((s) => s.id === songToAdd.id);
                  return (
                    <TouchableOpacity
                      key={pl.id}
                      activeOpacity={0.8}
                      disabled={alreadyIn}
                      onPress={() => {
                        onSelectPlaylist?.(pl.id, songToAdd);
                        onClose();
                      }}
                      className="flex-row items-center justify-between py-2.5 px-3 mb-2 rounded-xl border border-glass-border bg-white/5"
                    >
                      <View className="flex-row items-center gap-2.5 flex-1">
                        <Feather
                          name="music"
                          size={15}
                          color={theme.colors.accent.DEFAULT}
                        />
                        <Text
                          className="text-sm font-semibold text-white flex-1"
                          numberOfLines={1}
                        >
                          {pl.name}
                        </Text>
                      </View>
                      <Text className="text-xs font-semibold text-accent">
                        {alreadyIn ? 'Added' : `${pl.songs.length} tracks`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <Text className="text-xs font-semibold text-text-muted mb-1.5">
            {songToAdd ? 'Or Create New Playlist' : 'Playlist Name'}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Late Night Vibes..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            maxLength={36}
            style={styles.input}
            onSubmitEditing={handleCreate}
          />

          <View className="flex-row gap-3 mt-5">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              className="flex-1 py-3 rounded-xl border border-glass-border bg-white/5 items-center"
            >
              <Text className="text-sm font-semibold text-white">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreate}
              activeOpacity={0.85}
              className="flex-1 py-3 rounded-xl bg-accent items-center"
            >
              <Text className="text-sm font-extrabold text-text-dark">
                Create
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 4, 0.8)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#12200F',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(200, 249, 41, 0.25)',
    padding: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(200, 249, 41, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
