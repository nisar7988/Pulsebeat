import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Feather from 'react-native-vector-icons/Feather';

const { width: W } = Dimensions.get('window');
const PANEL_H = 340;

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
  accentColor = '#ff6aa9',
  orbGradient = ['rgba(255,80,220,0.75)', 'rgba(110,60,255,0.75)'],
  glowColor = '#ff66ff',
  fanColor = 'rgba(20,10,90,0.28)',
  ringColor = 'rgba(25,10,80,0.45)',
  onTogglePlayback,
  onPrevious,
  onNext,
  onToggleLike,
  onToggleShuffle,
  onToggleRepeat,
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Darker fan shape from heart down to the orb */}
      <Svg width={W} height={PANEL_H} style={StyleSheet.absoluteFill}>
       
      </Svg>

      {/* Heart button */}
      <TouchableOpacity
        style={styles.heartButton}
        onPress={onToggleLike}
        activeOpacity={0.7}
      >
        <Feather name="heart" size={18} color={liked ? accentColor : 'white'} />
      </TouchableOpacity>

      {/* Shuffle / Repeat */}
      <TouchableOpacity
        style={[
          styles.smallButton,
          styles.shuffleButton,
          isShuffle && [styles.activeSmallButton, { borderColor: accentColor }],
        ]}
        onPress={onToggleShuffle}
        activeOpacity={0.7}
      >
        <Feather
          name="shuffle"
          size={17}
          color={isShuffle ? accentColor : 'white'}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.smallButton,
          styles.repeatButton,
          isRepeat && [styles.activeSmallButton, { borderColor: accentColor }],
        ]}
        onPress={onToggleRepeat}
        activeOpacity={0.7}
      >
        <Feather
          name="repeat"
          size={17}
          color={isRepeat ? accentColor : 'white'}
        />
      </TouchableOpacity>

      {/* Bottom control cluster */}
      <View style={styles.cluster}>
        {/* Skip Back blob */}
        <TouchableOpacity
          style={[styles.sideBlob, styles.leftBlob]}
          onPress={onPrevious}
          activeOpacity={0.7}
        >
          <Feather
            name="skip-back"
            size={20}
            color="white"
            style={styles.skipBackIcon}
          />
        </TouchableOpacity>

        {/* Skip Forward blob */}
        <TouchableOpacity
          style={[styles.sideBlob, styles.rightBlob]}
          onPress={onNext}
          activeOpacity={0.7}
        >
          <Feather
            name="skip-forward"
            size={20}
            color="white"
            style={styles.skipForwardIcon}
          />
        </TouchableOpacity>

        {/* Dark ring + artwork orb */}
        <View style={[styles.ring, { backgroundColor: ringColor }]}>
          <View style={[styles.orbArt, { shadowColor: glowColor }]}>
            <Image source={{ uri: artwork }} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={orbGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <TouchableOpacity
              style={styles.playBtn}
              onPress={onTogglePlayback}
              activeOpacity={0.85}
            >
              <Feather
                name={isPlaying ? 'pause' : 'play'}
                size={26}
                color="#1d1040"
                style={!isPlaying ? styles.playIconOffset : undefined}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PlayerControls;

const styles = StyleSheet.create({
  heartButton: {
    position: 'absolute',
    top: 78,
    alignSelf: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButton: {
    position: 'absolute',
    top: 135,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shuffleButton: {
    left: 28,
  },
  repeatButton: {
    right: 28,
  },
  activeSmallButton: {
    borderColor: 'rgba(255,106,169,0.6)',
    backgroundColor: 'rgba(255,106,169,0.2)',
  },
  cluster: {
    position: 'absolute',
    top: 185,
    left: 24,
    right: 24,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBlob: {
    position: 'absolute',
    top: 28,
    width: 110,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftBlob: {
    left: 0,
  },
  rightBlob: {
    right: 0,
  },
  skipBackIcon: {
    marginRight: 18,
  },
  skipForwardIcon: {
    marginLeft: 18,
  },
  ring: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: 'rgba(25,10,80,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbArt: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff66ff',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconOffset: {
    marginLeft: 3,
  },
});
