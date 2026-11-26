import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../../theme';

export const AVATAR_PRESETS = [
  { id: 'neon-disc', icon: 'disc', label: 'Vinyl' },
  { id: 'headphones', icon: 'headphones', label: 'Studio' },
  { id: 'zap', icon: 'zap', label: 'Pulse' },
  { id: 'music', icon: 'music', label: 'Notes' },
  { id: 'radio', icon: 'radio', label: 'Wave' },
] as const;

interface EditProfileModalProps {
  visible: boolean;
  initialName: string;
  initialHandle: string;
  initialAvatarId: string;
  onClose: () => void;
  onSave: (data: {
    profileName: string;
    profileHandle: string;
    avatarId: string;
  }) => void;
}

export default function EditProfileModal({
  visible,
  initialName,
  initialHandle,
  initialAvatarId,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(initialName);
  const [handle, setHandle] = useState(initialHandle);
  const [avatarId, setAvatarId] = useState(initialAvatarId);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setHandle(initialHandle);
      setAvatarId(initialAvatarId);
    }
  }, [visible, initialName, initialHandle, initialAvatarId]);

  const handleSave = () => {
    const cleanName = name.trim() || 'PulseBeat Listener';
    const rawHandle = handle.trim().replace(/^@+/, '') || 'pulsebeat';
    onSave({
      profileName: cleanName,
      profileHandle: `@${rawHandle}`,
      avatarId,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-extrabold text-white">Edit Local Profile</Text>
            <TouchableOpacity
              onPress={onClose}
              className="h-8 w-8 rounded-full bg-white/10 items-center justify-center"
            >
              <Feather name="x" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs font-semibold text-text-muted mb-2">
            Choose Avatar Icon
          </Text>
          <View className="flex-row justify-between mb-4">
            {AVATAR_PRESETS.map((preset) => {
              const selected = avatarId === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => setAvatarId(preset.id)}
                  activeOpacity={0.8}
                  className={`items-center p-2 rounded-2xl border ${
                    selected
                      ? 'border-accent bg-accent/20'
                      : 'border-glass-border bg-white/5'
                  }`}
                  style={{ width: 54 }}
                >
                  <Feather
                    name={preset.icon}
                    size={20}
                    color={selected ? theme.colors.accent.DEFAULT : '#FFFFFF'}
                  />
                  <Text
                    className={`text-[10px] mt-1 font-semibold ${
                      selected ? 'text-accent' : 'text-text-muted'
                    }`}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="text-xs font-semibold text-text-muted mb-1.5">
            Display Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="PulseBeat Listener"
            placeholderTextColor="rgba(255,255,255,0.35)"
            maxLength={28}
            style={styles.input}
          />

          <Text className="text-xs font-semibold text-text-muted mb-1.5 mt-3">
            Handle
          </Text>
          <TextInput
            value={handle}
            onChangeText={setHandle}
            placeholder="@pulsebeat"
            placeholderTextColor="rgba(255,255,255,0.35)"
            autoCapitalize="none"
            maxLength={24}
            style={styles.input}
          />

          <View className="flex-row gap-3 mt-5">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              className="flex-1 py-3 rounded-xl border border-glass-border bg-white/5 items-center"
            >
              <Text className="text-sm font-semibold text-white">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.85}
              className="flex-1 py-3 rounded-xl bg-accent items-center"
            >
              <Text className="text-sm font-extrabold text-text-dark">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 4, 0.78)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#12200F',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(200, 249, 41, 0.25)',
    padding: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(200, 249, 41, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
