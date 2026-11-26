import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { useUserStore } from '../../store';
import {
  LANGUAGES,
  GENRES,
  ARTISTS as DEFAULT_ARTISTS,
  LanguageOption,
  GenreOption,
  ArtistOption,
} from './data';
import {
  getPopularArtists,
  searchArtistsForOnboarding,
} from '../../service/music';

export const OnboardingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Live artist data & search states
  const [artists, setArtists] = useState<ArtistOption[]>(DEFAULT_ARTISTS);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ArtistOption[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    selectedLanguages,
    toggleLanguage,
    selectedGenres,
    toggleGenre,
    selectedArtists,
    toggleArtist,
    completeOnboarding,
  } = useUserStore();

  // Fetch popular artists from API matching user's selected languages
  useEffect(() => {
    let isMounted = true;
    const fetchArtists = async () => {
      setIsLoadingArtists(true);
      try {
        const apiArtists = await getPopularArtists(selectedLanguages);
        if (isMounted && apiArtists.length > 0) {
          setArtists(apiArtists);
        }
      } catch (e) {
        console.log('Failed to fetch artists from API:', e);
      } finally {
        if (isMounted) setIsLoadingArtists(false);
      }
    };

    fetchArtists();
    return () => {
      isMounted = false;
    };
  }, [selectedLanguages]);

  // Handle live search with debouncing
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchArtistsForOnboarding(text.trim());
        setSearchResults(results);
      } catch (err) {
        console.log('Artist search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setIsSearching(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleFinish = () => {
    completeOnboarding();
    navigation.replace('MainTabs');
  };

  const stepMeta = {
    1: {
      badge: 'STEP 1 OF 3',
      title: 'Choose Music',
      highlight: 'Languages',
      subtitle: 'Pick the languages you love listening to (select at least 1)',
      count: selectedLanguages.length,
      cta: `Continue (${selectedLanguages.length} selected)`,
      canContinue: selectedLanguages.length > 0,
    },
    2: {
      badge: 'STEP 2 OF 3',
      title: 'Select Your',
      highlight: 'Music Taste',
      subtitle: 'Choose genres that match your mood & daily vibe',
      count: selectedGenres.length,
      cta: selectedGenres.length > 0 ? `Continue (${selectedGenres.length} selected)` : 'Continue',
      canContinue: true,
    },
    3: {
      badge: 'STEP 3 OF 3',
      title: 'Pick Favorite',
      highlight: 'Artists',
      subtitle: 'Follow artists to tailor your personalized daily mix',
      count: selectedArtists.length,
      cta: 'Finish & Start Listening',
      canContinue: true,
    },
  }[currentStep];

  const displayedArtists = searchResults !== null ? searchResults : artists;

  return (
    <View className="flex-1 bg-background">
      {/* High-contrast gradient background */}
      <LinearGradient
        colors={theme.gradients.app}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Top Header */}
        <View className="px-5 pt-2 pb-2 z-10 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <View className="h-9 w-9 rounded-xl border border-glass-border bg-glass-tint items-center justify-center">
              <Feather name="headphones" size={18} color={theme.colors.accent.DEFAULT} />
            </View>
            <Text className="text-xl font-bold tracking-tight text-white">
              Pulse<Text className="text-accent">Beat</Text>
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleFinish}
            className="rounded-full border border-glass-border bg-glass-tint px-4 py-1.5"
          >
            <Text className="text-xs font-semibold text-white/80">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Line */}
        <View className="px-5 py-2">
          <View className="h-1.5 w-full bg-glass-tint border border-glass-border/40 rounded-full overflow-hidden">
            <View
              className={`h-full bg-accent rounded-full transition-all ${
                currentStep === 1 ? 'w-1/3' : currentStep === 2 ? 'w-2/3' : 'w-full'
              }`}
            />
          </View>
        </View>

        {/* Step Title Header */}
        <View className="px-5 pt-2 pb-2">
          <View className="self-start rounded-full bg-accent/20 border border-accent/40 px-3 py-1 mb-2">
            <Text className="text-[11px] font-bold tracking-wider text-accent uppercase">
              {stepMeta.badge}
            </Text>
          </View>
          <Text className="text-2xl font-extrabold text-white leading-tight">
            {stepMeta.title}{' '}
            <Text className="text-accent">{stepMeta.highlight}</Text>
          </Text>
          <Text className="text-xs text-white/70 mt-1 leading-relaxed">
            {stepMeta.subtitle}
          </Text>
        </View>

        {/* Step Content */}
        <View className="flex-1 px-5 pt-1">
          {currentStep === 1 && (
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperClassName="gap-3 justify-between"
              contentContainerClassName="gap-3 pb-4 pt-1"
              showsVerticalScrollIndicator={false}
              className="flex-1"
              renderItem={({ item }: { item: LanguageOption }) => {
                const selected = selectedLanguages.some(
                  (l) => l.toLowerCase() === item.name.toLowerCase(),
                );
                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleLanguage(item.name)}
                    className={`flex-1 p-3.5 rounded-2xl border overflow-hidden relative ${
                      selected
                        ? 'border-accent bg-accent/25'
                        : 'border-glass-border bg-glass-tint'
                    }`}
                  >
                    <BlurView
                      style={StyleSheet.absoluteFill}
                      blurType="dark"
                      blurAmount={20}
                      overlayColor="transparent"
                      reducedTransparencyFallbackColor={theme.colors.glass.fallback}
                    />
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 mr-2">
                        <Text
                          className="text-base font-bold text-white"
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text className="text-xs text-white/70 mt-0.5" numberOfLines={1}>
                          {item.nativeName}
                        </Text>
                      </View>
                      <View
                        className={`h-6 w-6 rounded-full items-center justify-center border ${
                          selected
                            ? 'border-accent bg-accent'
                            : 'border-glass-border bg-glass-tint'
                        }`}
                      >
                        {selected ? (
                          <Feather name="check" size={14} color={theme.colors.text.dark} />
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {currentStep === 2 && (
            <FlatList
              data={GENRES}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperClassName="gap-3 justify-between"
              contentContainerClassName="gap-3 pb-4 pt-1"
              showsVerticalScrollIndicator={false}
              className="flex-1"
              renderItem={({ item }: { item: GenreOption }) => {
                const selected = selectedGenres.some(
                  (g) => g.toLowerCase() === item.canonical.toLowerCase(),
                );
                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleGenre(item.canonical)}
                    className={`flex-1 p-3.5 rounded-2xl border overflow-hidden relative ${
                      selected
                        ? 'border-accent bg-accent/25'
                        : 'border-glass-border bg-glass-tint'
                    }`}
                  >
                    <BlurView
                      style={StyleSheet.absoluteFill}
                      blurType="dark"
                      blurAmount={20}
                      overlayColor="transparent"
                      reducedTransparencyFallbackColor={theme.colors.glass.fallback}
                    />
                    <View className="flex-row items-center justify-between mb-2">
                      <View
                        className={`h-9 w-9 rounded-xl items-center justify-center ${
                          selected ? 'bg-accent' : 'bg-glass-tint border border-glass-border'
                        }`}
                      >
                        <Feather
                          name={item.icon}
                          size={18}
                          color={selected ? theme.colors.text.dark : 'white'}
                        />
                      </View>
                      <View
                        className={`h-5 w-5 rounded-full items-center justify-center border ${
                          selected
                            ? 'border-accent bg-accent'
                            : 'border-glass-border bg-glass-tint'
                        }`}
                      >
                        {selected ? (
                          <Feather name="check" size={12} color={theme.colors.text.dark} />
                        ) : null}
                      </View>
                    </View>
                    <Text
                      className="text-sm font-semibold text-white"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {currentStep === 3 && (
            <View className="flex-1">
              {/* Live Artist Search Bar */}
              <View className="flex-row items-center gap-2.5 h-11 px-3.5 rounded-2xl border border-glass-border bg-glass-tint mb-3">
                <Feather name="search" size={16} color="rgba(255,255,255,0.7)" />
                <TextInput
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  placeholder="Search any artist (e.g. Arijit, Taylor, Drake)..."
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  className="flex-1 text-xs text-white py-0"
                  returnKeyType="search"
                />
                {isSearching ? (
                  <ActivityIndicator size="small" color={theme.colors.accent.DEFAULT} />
                ) : searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={handleClearSearch} hitSlop={6}>
                    <Feather name="x-circle" size={16} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Artist List or Loading / Empty */}
              {isLoadingArtists && displayedArtists.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" color={theme.colors.accent.DEFAULT} />
                  <Text className="text-xs text-white/70 mt-2">Loading artists...</Text>
                </View>
              ) : displayedArtists.length === 0 ? (
                <View className="flex-1 items-center justify-center py-10">
                  <Feather name="music" size={32} color="rgba(255,255,255,0.4)" />
                  <Text className="text-sm text-white/80 mt-2">
                    No artists found for "{searchQuery}"
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={displayedArtists}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  columnWrapperClassName="gap-3 justify-between"
                  contentContainerClassName="gap-3 pb-4 pt-1"
                  showsVerticalScrollIndicator={false}
                  className="flex-1"
                  renderItem={({ item }: { item: ArtistOption }) => {
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
                        className={`flex-1 p-2.5 rounded-2xl border items-center overflow-hidden relative ${
                          selected
                            ? 'border-accent bg-accent/25'
                            : 'border-glass-border bg-glass-tint'
                        }`}
                      >
                        <BlurView
                          style={StyleSheet.absoluteFill}
                          blurType="dark"
                          blurAmount={20}
                          overlayColor="transparent"
                          reducedTransparencyFallbackColor={theme.colors.glass.fallback}
                        />
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
                              color={selected ? theme.colors.text.dark : 'rgba(255,255,255,0.7)'}
                            />
                          </View>
                        </View>
                        <Text
                          className="text-xs font-bold text-center text-white"
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text
                          className="text-[10px] text-white/70 text-center mt-0.5"
                          numberOfLines={1}
                        >
                          {item.genre || item.role || 'Artist'}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          )}
        </View>

        {/* Bottom Action Footer */}
        <View className="px-5 pt-3 pb-3 flex-row items-center justify-between gap-3">
          {currentStep > 1 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBack}
              className="h-13 w-13 rounded-full border border-glass-border bg-glass-tint items-center justify-center"
            >
              <Feather
                name="chevron-left"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!stepMeta.canContinue}
            onPress={handleNext}
            className={`flex-1 h-15 rounded-full overflow-hidden items-center justify-center relative shadow-md shadow-accent/40 ${
              !stepMeta.canContinue ? 'opacity-50' : ''
            }`}
          >
            <LinearGradient
              colors={theme.gradients.lime}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-extrabold text-text-dark tracking-wide">
                {stepMeta.cta}
              </Text>
              <Feather
                name={currentStep === 3 ? 'play' : 'arrow-right'}
                size={18}
                color={theme.colors.text.dark}
              />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default OnboardingScreen;
