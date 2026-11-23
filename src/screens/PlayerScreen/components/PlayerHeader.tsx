import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

export interface PlayerHeaderProps {
  title?: string;
  onBack: () => void;
  onRightPress?: () => void;
  rightIconName?: string;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  title = 'Now Playing',
  onBack,
  onRightPress,
  rightIconName = 'bell',
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={onBack}
        activeOpacity={0.7}
      >
        <Feather name="chevron-left" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={onRightPress}
        activeOpacity={0.7}
      >
        <Feather name={rightIconName} size={19} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default PlayerHeader;

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 55,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
