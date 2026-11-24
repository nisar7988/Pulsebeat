import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../../theme';

export interface PlayerControlsProps {
  isPlaying: boolean;
  artwork: string;
  liked?: boolean;
  isShuffle?: boolean;
  isRepeat?: boolean;
  accentColor?: string;
  orbGradient?: [string, string];
  glowColor?: string;
  fanColor?: string;
  ringColor?: string;
  onTogglePlayback: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleLike?: () => void;
  onToggleShuffle?: () => void;
  onToggleRepeat?: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  artwork,
  liked = false,
  isShuffle = false,
  isRepeat = false,
  accentColor = theme.colors.accent.DEFAULT,
  orbGradient = [...theme.gradients.orb],
  glowColor = theme.colors.accent.glow,
  fanColor: _fanColor = theme.colors.playerUi.fan,
  ringColor = theme.colors.playerUi.ring,
  onTogglePlayback,
  onPrevious,
  onNext,
  onToggleLike,
  onToggleShuffle,
  onToggleRepeat,
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Heart button */}
      <TouchableOpacity
        className="absolute top-[78px] self-center h-9 w-9 rounded-full border border-glass-border-light bg-glass-tint-light items-center justify-center"
        onPress={onToggleLike}
        activeOpacity={0.7}
      >
        <Feather
          name="heart"
          size={18}
          color={liked ? accentColor : theme.colors.text.DEFAULT}
        />
      </TouchableOpacity>

      {/* Shuffle */}
      <TouchableOpacity
        className="absolute top-[135px] left-7 h-[38px] w-[38px] rounded-full border border-glass-border-subtle bg-glass-tint items-center justify-center"
        style={
          isShuffle
            ? {
                borderColor: accentColor,
                backgroundColor: 'rgba(255,106,169,0.2)',
              }
            : undefined
        }
        onPress={onToggleShuffle}
        activeOpacity={0.7}
      >
        <Feather
          name="shuffle"
          size={17}
          color={isShuffle ? accentColor : theme.colors.text.DEFAULT}
        />
      </TouchableOpacity>

      {/* Repeat */}
      <TouchableOpacity
        className="absolute top-[135px] right-7 h-[38px] w-[38px] rounded-full border border-glass-border-subtle bg-glass-tint items-center justify-center"
        style={
          isRepeat
            ? {
                borderColor: accentColor,
                backgroundColor: 'rgba(255,106,169,0.2)',
              }
            : undefined
        }
        onPress={onToggleRepeat}
        activeOpacity={0.7}
      >
        <Feather
          name="repeat"
          size={17}
          color={isRepeat ? accentColor : theme.colors.text.DEFAULT}
        />
      </TouchableOpacity>

      {/* Bottom control cluster */}
      <View className="absolute top-[185px] left-6 right-6 h-[120px] items-center justify-center">
        {/* Skip Back blob */}
        <TouchableOpacity
          className="absolute top-7 left-0 w-[110px] h-16 rounded-[32px] bg-glass-pill items-center justify-center"
          onPress={onPrevious}
          activeOpacity={0.7}
        >
          <Feather
            name="skip-back"
            size={20}
            color={theme.colors.text.DEFAULT}
            className="mr-[18px]"
          />
        </TouchableOpacity>

        {/* Skip Forward blob */}
        <TouchableOpacity
          className="absolute top-7 right-0 w-[110px] h-16 rounded-[32px] bg-glass-pill items-center justify-center"
          onPress={onNext}
          activeOpacity={0.7}
        >
          <Feather
            name="skip-forward"
            size={20}
            color={theme.colors.text.DEFAULT}
            className="ml-[18px]"
          />
        </TouchableOpacity>

        {/* Dark ring + artwork orb */}
        <View
          className="w-[124px] h-[124px] rounded-full items-center justify-center"
          style={{ backgroundColor: ringColor }}
        >
          <View
            className="w-[100px] h-[100px] rounded-full overflow-hidden items-center justify-center"
            style={{
              shadowColor: glowColor,
              shadowOpacity: 0.8,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            <Image source={{ uri: artwork }} className="absolute inset-0 h-full w-full" />
            <LinearGradient
              colors={orbGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <TouchableOpacity
              className="w-[60px] h-[60px] rounded-full bg-white items-center justify-center"
              onPress={onTogglePlayback}
              activeOpacity={0.85}
            >
              <Feather
                name={isPlaying ? 'pause' : 'play'}
                size={26}
                color={theme.colors.text.dark}
                className={!isPlaying ? 'ml-[3px]' : undefined}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PlayerControls;
