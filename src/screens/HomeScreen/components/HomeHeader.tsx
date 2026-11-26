import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../../theme';

export interface HomeHeaderProps {
  languages: string[];
  activeLanguage: string;
  onSelectLanguage: (lang: string) => void;
  onOpenSearch?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  languages,
  activeLanguage,
  onSelectLanguage,
  onOpenSearch,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View className="px-4 pt-1 pb-2">
      {/* Liquid Glass Island Container */}
      <View className="overflow-hidden rounded-[28px] border border-white/20 p-4 relative shadow-2xl shadow-black/60 bg-glass-tint">
        {/* Specular Liquid Gradient Sheen */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.22)',
            'rgba(200, 249, 41, 0.08)',
            'rgba(16, 28, 13, 0.70)',
          ]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient Neon Glow Blob in Corner */}
        <View className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-accent/20 blur-2xl" />

        {/* Top Header Row */}
        <View className="flex-row items-center justify-between mb-3.5">
          {/* Logo & Dynamic Greeting */}
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-2xl bg-accent/25 border border-accent/60 items-center justify-center shadow-lg shadow-accent/50">
              <Feather name="activity" size={22} color={theme.colors.accent.DEFAULT} />
            </View>

            <View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xl font-black tracking-tight text-white">
                  Pulse<Text className="text-accent">Beat</Text>
                </Text>
                <View className="h-2 w-2 rounded-full bg-accent animate-pulse shadow-sm shadow-accent/60" />
              </View>
              <Text className="text-[10px] font-extrabold text-accent uppercase tracking-widest mt-0.5">
                {getGreeting()} • Live Stream
              </Text>
            </View>
          </View>

          {/* Action Cluster (Hi-Res Audio Tag + Search Bubble) */}
          <View className="flex-row items-center gap-2">
            <View className="hidden sm:flex flex-row items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1">
              <Feather name="disc" size={11} color={theme.colors.accent.DEFAULT} />
              <Text className="text-[10px] font-extrabold text-accent">320K</Text>
            </View>

            {onOpenSearch && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onOpenSearch}
                className="h-10 w-10 rounded-full border border-white/25 bg-white/10 items-center justify-center shadow-sm shadow-black/40"
              >
                <Feather name="search" size={17} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Divider Glow Line */}
        <View className="h-[1px] w-full bg-white/10 mb-3" />

        {/* Liquid Language Pills Carousel */}
        {languages.length > 0 && (
          <View className="flex-row items-center">
            <View className="mr-2 h-7 w-7 rounded-full bg-white/10 border border-white/15 items-center justify-center">
              <Feather name="globe" size={13} color={theme.colors.accent.DEFAULT} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 py-0.5 items-center"
            >
              {languages.map((lang) => {
                const isActive =
                  lang.toLowerCase() === activeLanguage.toLowerCase();
                return (
                  <TouchableOpacity
                    key={lang}
                    activeOpacity={0.75}
                    onPress={() => onSelectLanguage(lang)}
                    className={`px-3.5 py-1.5 rounded-full border ${
                      isActive
                        ? 'border-accent bg-accent shadow-md shadow-accent/60'
                        : 'border-white/15 bg-white/10'
                    }`}
                  >
                    <Text
                      className={`text-xs capitalize ${
                        isActive
                          ? 'font-extrabold text-black'
                          : 'font-semibold text-white/80'
                      }`}
                    >
                      {lang}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

export default HomeHeader;
