import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../theme';
import {
  ApiArtist,
  getPopularArtists,
  searchArtistsForOnboarding,
} from '../../../service/music';
import { useUserStore } from '../../../store';

interface EditArtistsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EditArtistsModal({
  visible,
  onClose,
}: EditArtistsModalProps) {
  const {
    selectedLanguages,
    selectedArtists,
    toggleArtist,
  } = useUserStore();

  const [query, setQuery] = useState('');
  const [suggested, setSuggested] = useState<ApiArtist[]>([]);
  const [searchResults, setSearchResults] = useState<ApiArtist[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const loadSuggested = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getPopularArtists(selectedLanguages);
      setSuggested(list);
    } catch (e) {
      console.log('EditArtistsModal loadSuggested error:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedLanguages]);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setSearchResults(null);
      loadSuggested();
    }
  }, [visible, loadSuggested]);

  useEffect(() => {
    if (!visible) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchArtistsForOnboarding(trimmed);
        setSearchResults(res);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, visible]);

  const data = searchResults !== null ? searchResults : suggested;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <LinearGradient
          colors={theme.gradients.app}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <View className="px-5 py-3 flex-row items-center justify-between border-b border-glass-border">
            <TouchableOpacity
              onPress={onClose}
              className="h-10 w-10 rounded-full border border-glass-border bg-glass-tint items-center justify-center"
            >
              <Feather name="chevron-down" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="items-center">
              <Text className="text-base font-extrabold text-white">
                Favorite Artists
              </Text>
              <Text className="text-[11px] text-accent font-semibold">
                {selectedArtists.length} selected
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="h-10 px-3.5 rounded-full bg-accent items-center justify-center"
            >
              <Text className="text-xs font-extrabold text-text-dark">Done</Text>
            </TouchableOpacity>
          </View>

          <View className="px-5 pt-3 pb-2">
            <View className="h-11 flex-row items-center gap-2.5 rounded-2xl border border-glass-border bg-glass-tint px-3.5">
              <Feather name="search" size={16} color={theme.colors.accent.DEFAULT} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search any artist to follow..."
                placeholderTextColor={theme.colors.text.muted}
                className="flex-1 py-0 text-sm text-white"
                autoCorrect={false}
              />
              {searching ? (
                <ActivityIndicator size="small" color={theme.colors.accent.DEFAULT} />
              ) : query.length > 0 ? (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Feather name="x-circle" size={16} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {loading && data.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={theme.colors.accent.DEFAULT} />
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              numColumns={3}
              columnWrapperClassName="gap-2.5 justify-start"
              contentContainerClassName="px-5 py-3 pb-12 gap-3"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = selectedArtists.includes(item.id);
                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      toggleArtist(item.id, {
                        name: item.name,
                        avatar: item.avatar,
                        role: item.role || item.genre,
                      })
                    }
                    className={`flex-1 max-w-[32%] p-2.5 rounded-2xl border items-center ${
                      selected
                        ? 'border-accent bg-accent/20'
                        : 'border-glass-border bg-glass-tint'
                    }`}
                  >
                    <View className="relative mb-2">
                      <Image
                        source={{ uri: item.avatar }}
                        className={`w-16 h-16 rounded-full border-2 ${
                          selected ? 'border-accent' : 'border-glass-border'
                        }`}
                      />
                      <View
                        className={`absolute bottom-0 right-0 h-5 w-5 rounded-full items-center justify-center border ${
                          selected
                            ? 'border-accent bg-accent'
                            : 'border-glass-border bg-card'
                        }`}
                      >
                        <Feather
                          name={selected ? 'check' : 'plus'}
                          size={12}
                          color={selected ? theme.colors.text.dark : 'rgba(255,255,255,0.75)'}
                        />
                      </View>
                    </View>
                    <Text
                      className="text-xs font-bold text-white text-center"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}
