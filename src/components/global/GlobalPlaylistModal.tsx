import React from 'react';
import { Alert } from 'react-native';
import { useDownloadStore, useListeningStore } from '../../store';
import {
  cancelDownload,
  downloadSong,
  removeDownloadedSong,
} from '../../service/download';
import { getSongTitle } from '../../service/player';
import PlaylistModal from '../../screens/LibraryScreen/components/PlaylistModal';

export default function GlobalPlaylistModal() {
  const visible = useListeningStore((state) => state.playlistModalVisible);
  const songToAdd = useListeningStore((state) => state.playlistModalSong);
  const playlists = useListeningStore((state) => state.playlists);
  const likedSongs = useListeningStore((state) => state.likedSongs);
  const closePlaylistModal = useListeningStore(
    (state) => state.closePlaylistModal,
  );
  const createPlaylist = useListeningStore((state) => state.createPlaylist);
  const addSongToPlaylist = useListeningStore(
    (state) => state.addSongToPlaylist,
  );
  const toggleLikeSong = useListeningStore((state) => state.toggleLikeSong);

  const isSongDownloaded = useDownloadStore((state) =>
    songToAdd ? Boolean(state.downloads[songToAdd.id]) : false,
  );
  const activeDownload = useDownloadStore((state) =>
    songToAdd ? state.activeDownloads[songToAdd.id] : undefined,
  );

  const handleToggleDownload = (song: NonNullable<typeof songToAdd>) => {
    if (activeDownload) {
      cancelDownload(song.id);
      return;
    }
    if (isSongDownloaded) {
      Alert.alert(
        'Remove Download',
        `Remove "${getSongTitle(song)}" from offline downloads?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeDownloadedSong(song.id),
          },
        ],
      );
      return;
    }
    downloadSong(song);
  };

  return (
    <PlaylistModal
      visible={visible}
      songToAdd={songToAdd}
      playlists={playlists}
      likedSongs={likedSongs}
      isSongDownloaded={isSongDownloaded}
      isSongDownloading={Boolean(activeDownload)}
      downloadProgress={activeDownload?.progress ?? 0}
      onClose={closePlaylistModal}
      onCreatePlaylist={(name, song) => createPlaylist(name, song || undefined)}
      onSelectPlaylist={(playlistId, song) => addSongToPlaylist(playlistId, song)}
      onToggleLikeSong={toggleLikeSong}
      onToggleDownloadSong={handleToggleDownload}
    />
  );
}
