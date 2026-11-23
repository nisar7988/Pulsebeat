import { useEffect, useState } from 'react';
import { FlatList, StyleSheet} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import getSongBySearch from '../../service/music';
import { Song } from '../../types/song';
import SongCard from './components/SongCard';

function HomeScreen() {
  const [songs, setSongs] = useState<Song[]>([]);

  const fetchSongBySearch = async (songName: string) => {
    try {
      const response = await getSongBySearch(songName);
      if (!response) throw new Error('failed to fetch songs');
      setSongs(response?.data?.results ?? []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSongBySearch('');
  }, []);

  return (
    <SafeAreaView
     className="flex-1">
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SongCard song={item} />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 16,
    paddingBottom: 110,
  },
});

export default HomeScreen;
