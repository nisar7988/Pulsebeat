import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Song } from '../../../types/song';
import { playSong } from '../../../service/player';
import PlayCircleIcon from '../../../components/ui/PlayButton';
import { RootStackParamList } from '../../../navigation/types';

export interface SongCardProps {
  song: Song;
  onPlay?: (song: Song) => void;
  onPause?: () => void;
  onResume?: () => void;
}

export default function SongCard({
  song,
  onPlay,
}: SongCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const imageUrl = song.image?.[1]?.url || song.image?.[0]?.url;
  const primaryArtist = song.artists?.primary?.[0];
  const artistName =
    primaryArtist?.name ||
    song.artists?.all?.[0]?.name ||
    'Unknown Artist';

  const handlePlay = async () => {
    try {
      if (onPlay) {
        onPlay(song);
      } else {
        await playSong(song);
      }
    } catch (error) {
      console.log('Error playing song:', error);
    }
    navigation.navigate('Player', { song });
  };

  return (
    <View style={styles.cardContainer} className="mx-4 my-2">
      {/* Glass blur background */}
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="light"
        blurAmount={25}
        overlayColor="transparent"
        reducedTransparencyFallbackColor="#6f5df0"
      />
      {/* Glass tint overlay */}
      <View style={styles.tint} />

      {/* Card Content */}
      <View className="flex-row items-center justify-between p-3.5">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePlay}
          className="flex-row items-center gap-3 flex-1 mr-2"
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
            />
          ) : null}

          <View className="flex-1 justify-center">
            <Text
              className="text-white font-semibold text-base"
              numberOfLines={1}
            >
              {song.name}
            </Text>
            <Text
              className="text-white/70 text-xs mt-0.5"
              numberOfLines={1}
            >
              {artistName}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlay}
          activeOpacity={0.7}
          className="p-1 items-center justify-center"
        >
          <PlayCircleIcon color="white" size={32} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  tint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
});
