import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Song } from '../../types/song';
import { useAppTheme } from '../../theme';
import { ensureVividAccent, hexToRgba } from '../../theme/songPalette';
import { useDownloadStore } from '../../store/useDownloadStore';
import {
  cancelDownload,
  downloadSong,
  removeDownloadedSong,
} from '../../service/download';
import { getSongTitle } from '../../service/player';

export interface DownloadButtonProps {
  song: Song;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'glass' | 'ghost';
  accentColor?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: { box: 'h-8 w-8', icon: 15 },
  md: { box: 'h-9 w-9', icon: 16 },
  lg: { box: 'h-10 w-10', icon: 18 },
} as const;

export const DownloadButton: React.FC<DownloadButtonProps> = React.memo(({
  song,
  size = 'md',
  variant = 'glass',
  accentColor,
  className = '',
}) => {
  const { theme } = useAppTheme();
  const resolvedAccentColor = accentColor
    ? ensureVividAccent(accentColor, theme.colors.accent.DEFAULT)
    : theme.colors.accent.DEFAULT;
  const isDownloaded = useDownloadStore((state) =>
    Boolean(state.downloads[song.id]),
  );
  const isDownloading = useDownloadStore((state) =>
    Boolean(state.activeDownloads[song.id]),
  );

  const dims = SIZE_MAP[size];

  const handlePress = useCallback(() => {
    if (isDownloading) {
      cancelDownload(song.id);
      return;
    }

    if (isDownloaded) {
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
  }, [isDownloaded, isDownloading, song]);

  const containerStyle =
    variant === 'ghost'
      ? isDownloaded
        ? 'bg-accent/15 border border-accent/40'
        : ''
      : isDownloaded
      ? 'border border-accent/55 bg-accent/20'
      : 'border border-glass-border-light bg-glass-tint';

  const customDownloadedStyle =
    isDownloaded && accentColor
      ? {
          borderColor: hexToRgba(resolvedAccentColor, 0.55),
          backgroundColor: hexToRgba(resolvedAccentColor, 0.2),
        }
      : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={
        isDownloading
          ? 'Cancel download'
          : isDownloaded
          ? 'Remove downloaded song'
          : 'Download song'
      }
      style={customDownloadedStyle}
      className={`${dims.box} rounded-full items-center justify-center ${containerStyle} ${className}`}
    >
      {isDownloading ? (
        <ActivityIndicator size="small" color={resolvedAccentColor} />
      ) : (
        <Feather
          name={isDownloaded ? 'check-circle' : 'download'}
          size={dims.icon}
          color={isDownloaded ? resolvedAccentColor : theme.colors.text.DEFAULT}
        />
      )}
    </TouchableOpacity>
  );
});

export default DownloadButton;
