import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface SongInfoProps {
  title: string;
  artist: string;
  bottomOffset?: number;
}

export const SongInfo: React.FC<SongInfoProps> = ({
  title,
  artist,
  bottomOffset = 340 + 18,
}) => {
  return (
    <View style={[styles.songInfo, { bottom: bottomOffset }]}>
      <Text style={styles.songTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {artist}
      </Text>
    </View>
  );
};

export default SongInfo;

const styles = StyleSheet.create({
  songInfo: {
    position: 'absolute',
    left: 28,
    right: 28,
  },
  songTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  artist: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    marginTop: 4,
  },
});
