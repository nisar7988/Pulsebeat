import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { restart, useStallionUpdate } from 'react-native-stallion';
import { useAppTheme } from '../../theme';

export default function StallionUpdateModal() {
  const { isRestartRequired, newReleaseBundle } = useStallionUpdate();
  const { theme, themeVars } = useAppTheme();
  const [dismissedBundleId, setDismissedBundleId] = useState<string | null>(null);

  const bundleId = newReleaseBundle?.id || 'pending-ota';
  const isMandatory = Boolean(newReleaseBundle?.isMandatory);

  useEffect(() => {
    if (!isRestartRequired) {
      setDismissedBundleId(null);
    }
  }, [isRestartRequired]);

  const visible =
    isRestartRequired && (isMandatory || dismissedBundleId !== bundleId);

  if (!visible) return null;

  const releaseNote =
    newReleaseBundle?.releaseNote?.trim() ||
    'A fresh PulseBeat update has been downloaded and is ready to apply.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isMandatory) {
          setDismissedBundleId(bundleId);
        }
      }}
    >
      <View style={[styles.backdrop, themeVars]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.background.card,
              borderColor: theme.colors.glass.borderHeavy,
            },
          ]}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2.5">
              <View className="h-10 w-10 rounded-2xl bg-accent/20 border border-accent/50 items-center justify-center">
                <Feather
                  name="download-cloud"
                  size={20}
                  color={theme.colors.accent.DEFAULT}
                />
              </View>
              <View>
                <Text className="text-base font-extrabold text-white">
                  Update Ready
                </Text>
                <Text className="text-[11px] font-semibold text-accent">
                  {isMandatory ? 'Required OTA Update' : 'Over-the-Air Update'}
                </Text>
              </View>
            </View>

            {!isMandatory && (
              <TouchableOpacity
                onPress={() => setDismissedBundleId(bundleId)}
                className="h-8 w-8 rounded-full bg-white/10 items-center justify-center"
              >
                <Feather name="x" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          <Text className="text-xs text-text-muted leading-5 mb-5">
            {releaseNote}
          </Text>

          <View className="flex-row gap-3">
            {!isMandatory && (
              <TouchableOpacity
                onPress={() => setDismissedBundleId(bundleId)}
                activeOpacity={0.8}
                className="flex-1 py-3 rounded-xl border border-glass-border bg-white/5 items-center"
              >
                <Text className="text-sm font-semibold text-white">Later</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => restart()}
              activeOpacity={0.85}
              className="flex-1 py-3 rounded-xl bg-accent flex-row items-center justify-center gap-2"
            >
              <Feather
                name="refresh-cw"
                size={15}
                color={theme.colors.text.dark}
              />
              <Text className="text-sm font-extrabold text-text-dark">
                Restart Now
              </Text>
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
    backgroundColor: 'rgba(5, 10, 4, 0.8)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
});
