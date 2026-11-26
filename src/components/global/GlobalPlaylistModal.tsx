import React from 'react';
import { useListeningStore } from '../../store';
import PlaylistModal from '../../screens/LibraryScreen/components/PlaylistModal';

export default function GlobalPlaylistModal() {
  const visible = useListeningStore((state) => state.playlistModalVisible);
  const songToAdd = useListeningStore((state) => state.playlistModalSong);
  const playlists = useListeningStore((state) => state.playlists);
  const closePlaylistModal = useListeningStore(
    (state) => state.closePlaylistModal,
  );
  const createPlaylist = useListeningStore((state) => state.createPlaylist);
  const addSongToPlaylist = useListeningStore(
    (state) => state.addSongToPlaylist,
  );

  return (
    <PlaylistModal
      visible={visible}
      songToAdd={songToAdd}
      playlists={playlists}
      onClose={closePlaylistModal}
      onCreatePlaylist={(name, song) => createPlaylist(name, song || undefined)}
      onSelectPlaylist={(playlistId, song) => addSongToPlaylist(playlistId, song)}
    />
  );
}
