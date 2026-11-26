import { NativeModules, Platform } from 'react-native';

interface LockScreenNativeModule {
  setShowWhenLocked(enabled: boolean): void;
  isDeviceLocked(): Promise<boolean>;
  requestDismissKeyguard(): Promise<boolean>;
}

const nativeLockScreen = NativeModules.LockScreenModule as
  | LockScreenNativeModule
  | undefined;

export function setShowPlayerOnLockScreen(enabled: boolean): void {
  if (Platform.OS !== 'android') return;
  nativeLockScreen?.setShowWhenLocked(enabled);
}

export async function isDeviceLocked(): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeLockScreen) return false;
  try {
    return await nativeLockScreen.isDeviceLocked();
  } catch {
    return false;
  }
}

export async function requestUnlockToLeavePlayer(): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeLockScreen) return true;
  try {
    return await nativeLockScreen.requestDismissKeyguard();
  } catch {
    return false;
  }
}
