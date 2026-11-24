import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

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
    <View className="px-5 pt-2 pb-3">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-xs font-semibold text-accent uppercase tracking-wider">
            {getGreeting()}
          </Text>
          <Text className="text-2xl font-extrabold text-white tracking-tight">
            Pulse<Text className="text-accent">Beat</Text>
          </Text>
        </View>

        {onOpenSearch && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenSearch}
            className="h-10 w-10 rounded-full border border-white/20 bg-white/10 items-center justify-center"
          >
            <Feather name="search" size={18} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Language Filter Pills */}
      {languages.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 py-1"
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
                    ? 'border-accent bg-accent/30'
                    : 'border-white/15 bg-white/10'
                }`}
              >
                <Text
                  className={`text-xs capitalize ${
                    isActive ? 'font-bold text-white' : 'font-medium text-white/70'
                  }`}
                >
                  {lang}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

export default HomeHeader;
