import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '../../theme';
import { useUserStore } from '../../store';
import { RootStackParamList } from '../../navigation/types';
import { GlassMiniPlayer } from '../../components/global/GlassMiniPlayer';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => (
  <View className={`overflow-hidden rounded-3xl border border-glass-border bg-glass-tint ${className}`}>
    <BlurView
      style={StyleSheet.absoluteFill}
      blurType="light"
      blurAmount={25}
      overlayColor="transparent"
      reducedTransparencyFallbackColor={theme.colors.glass.fallback}
    />
    {children}
  </View>
);

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    selectedLanguages,
    selectedGenres,
    selectedArtists,
    resetPreferences,
  } = useUserStore();

  const handleRestartOnboarding = () => {
    resetPreferences();
    navigation.navigate('Onboarding');
  };

  return (
    <View className="flex-1 bg-background">
      {/* Background Gradient */}
      <LinearGradient
        colors={theme.gradients.app}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pt-4 px-5 pb-48"
        >
          {/* Profile Header Card */}
          <GlassCard className="p-5 mb-5 items-center">
            <View className="relative mb-3">
              <View className="w-24 h-24 rounded-full p-1 border-2 border-accent shadow-md shadow-accent/60">
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
                  }}
                  className="w-full h-full rounded-full"
                />
              </View>
              <View className="absolute bottom-0 right-1 h-6 w-6 rounded-full bg-accent items-center justify-center border-2 border-background">
                <Feather name="check" size={12} color={theme.colors.text.dark} />
              </View>
            </View>

            <Text className="text-xl font-extrabold text-white">Music Enthusiast</Text>
            <Text className="text-xs text-accent mt-0.5 font-semibold">PulseBeat Premium</Text>

            {/* Quick Stats Grid */}
            <View className="flex-row items-center justify-around w-full mt-5 pt-4 border-t border-glass-border">
              <View className="items-center">
                <Text className="text-lg font-bold text-accent">
                  {selectedLanguages.length || 3}
                </Text>
                <Text className="text-[11px] text-text-muted mt-0.5">Languages</Text>
              </View>
              <View className="h-7 w-[1px] bg-glass-border" />
              <View className="items-center">
                <Text className="text-lg font-bold text-accent">
                  {selectedGenres.length || 4}
                </Text>
                <Text className="text-[11px] text-text-muted mt-0.5">Genres</Text>
              </View>
              <View className="h-7 w-[1px] bg-glass-border" />
              <View className="items-center">
                <Text className="text-lg font-bold text-accent">
                  {selectedArtists.length || 5}
                </Text>
                <Text className="text-[11px] text-text-muted mt-0.5">Artists</Text>
              </View>
            </View>
          </GlassCard>

          {/* Your Music Taste Preferences */}
          <View className="mb-5">
            <Text className="text-sm font-bold text-accent uppercase tracking-wider mb-2.5">
              Listening Taste
            </Text>

            {/* Languages */}
            <GlassCard className="p-4 mb-3">
              <View className="flex-row items-center justify-between mb-2.5">
                <Text className="text-sm font-semibold text-white">Preferred Languages</Text>
                <Feather name="globe" size={16} color={theme.colors.accent.DEFAULT} />
              </View>
              <View className="flex-row flex-wrap gap-2">
                {(selectedLanguages.length > 0 ? selectedLanguages : ['English', 'Hindi', 'Punjabi']).map((lang) => (
                  <View
                    key={lang}
                    className="px-3 py-1 rounded-full border border-accent bg-accent/20"
                  >
                    <Text className="text-xs font-semibold text-accent capitalize">{lang}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            {/* Genres */}
            <GlassCard className="p-4 mb-3">
              <View className="flex-row items-center justify-between mb-2.5">
                <Text className="text-sm font-semibold text-white">Favorite Vibes</Text>
                <Feather name="music" size={16} color={theme.colors.accent.DEFAULT} />
              </View>
              <View className="flex-row flex-wrap gap-2">
                {(selectedGenres.length > 0 ? selectedGenres : ['Pop', 'Chill', 'Lo-Fi', 'Bollywood']).map((g) => (
                  <View
                    key={g}
                    className="px-3 py-1 rounded-full border border-glass-border bg-glass-tint"
                  >
                    <Text className="text-xs font-medium text-white capitalize">{g}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            {/* Followed Artists */}
            {selectedArtists.length > 0 && (
              <GlassCard className="p-4">
                <View className="flex-row items-center justify-between mb-2.5">
                  <Text className="text-sm font-semibold text-white">Artists You Follow</Text>
                  <Feather name="user-check" size={16} color={theme.colors.accent.DEFAULT} />
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {selectedArtists.map((artist) => (
                    <View
                      key={artist}
                      className="px-3 py-1 rounded-full border border-glass-border bg-glass-tint"
                    >
                      <Text className="text-xs font-medium text-white">{artist}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}
          </View>

          {/* Settings & Reset */}
          <View className="mb-6">
            <Text className="text-sm font-bold text-accent uppercase tracking-wider mb-2.5">
              Settings & Account
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleRestartOnboarding}
            >
              <GlassCard className="p-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-accent items-center justify-center">
                    <Feather name="sliders" size={18} color={theme.colors.text.dark} />
                  </View>
                  <View>
                    <Text className="text-sm font-semibold text-white">Update Music Preferences</Text>
                    <Text className="text-xs text-text-muted mt-0.5">Re-select languages, genres, & artists</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color={theme.colors.accent.DEFAULT} />
              </GlassCard>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Floating Glass Mini Player */}
      <GlassMiniPlayer />
    </View>
  );
};

export default ProfileScreen;
