import { useCallback, useOptimistic, useTransition } from 'react';
import { Song } from '../types/song';
import { useCurrentSongStore } from '../store/useCurrentSongStore';
import { pauseSong, playSong, resumeSong } from '../service/player';

export function useOptimisticPlayback(fallbackSong?: Song | null) {
  const storeIsPlaying = useCurrentSongStore((state) => state.isPlaying);
  const currentSong = useCurrentSongStore((state) => state.currentSong);
  const [optimisticPlaying, setOptimisticPlaying] = useOptimistic(
    storeIsPlaying,
    (_current: boolean, next: boolean) => next,
  );
  const [, startTransition] = useTransition();

  const togglePlayback = useCallback(
    (hasActiveTrack = true) => {
      const nextPlaying = !optimisticPlaying;
      startTransition(async () => {
        setOptimisticPlaying(nextPlaying);
        try {
          if (nextPlaying) {
            const target = currentSong || fallbackSong;
            if (!hasActiveTrack && target) {
              useCurrentSongStore.getState().setCurrentSong(target);
              await playSong(target);
            } else {
              await resumeSong();
            }
          } else {
            await pauseSong();
          }
        } catch (err) {
          console.log('Playback toggle error:', err);
        }
      });
    },
    [currentSong, fallbackSong, optimisticPlaying, setOptimisticPlaying],
  );

  return {
    isPlaying: optimisticPlaying,
    togglePlayback,
  };
}
