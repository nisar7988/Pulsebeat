const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '../node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI/Runtime/Values/JavaScriptObject.swift'
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');

  // Swift 6.2 strict concurrency data-race fix for slot capture in assumeIsolated
  const oldPattern = `  try withUnsafeTemporaryAllocation(of: facebook.jsi.Value.self, capacity: 1) { buffer in
    // The isolated closure below runs synchronously on this thread.
    nonisolated(unsafe) let slot = buffer.baseAddress!
    expo.emplaceUndefined(slot)
    defer {
      expo.destroyValues(slot, 1)
    }
    // The runtime can't be deallocated during a call on its JavaScript thread, so it's borrowed without
    // a retain.
    try runtime._withUnsafeGuaranteedRef { runtime in
      try JavaScriptActor.assumeIsolated {
        try encode(JavaScriptValue.Slot(slot), runtime)
      }
    }
    body(slot.pointee)
  }`;

  const newReplacement = `  try withUnsafeTemporaryAllocation(of: facebook.jsi.Value.self, capacity: 1) { buffer in
    // The isolated closure below runs synchronously on this thread.
    let slotAddress = UInt(bitPattern: buffer.baseAddress!)
    let slot = buffer.baseAddress!
    expo.emplaceUndefined(slot)
    defer {
      expo.destroyValues(slot, 1)
    }
    // The runtime can't be deallocated during a call on its JavaScript thread, so it's borrowed without
    // a retain.
    try runtime._withUnsafeGuaranteedRef { runtime in
      try JavaScriptActor.assumeIsolated {
        let isolatedSlot = UnsafeMutablePointer<facebook.jsi.Value>(bitPattern: slotAddress)!
        try encode(JavaScriptValue.Slot(isolatedSlot), runtime)
      }
    }
    body(slot.pointee)
  }`;

  if (content.includes(oldPattern)) {
    content = content.replace(oldPattern, newReplacement);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-expo] Patched JavaScriptObject.swift for Swift 6.2 concurrency');
  }
}

// Fix react-native-css-interop crash when stringifying React Navigation context getters
const cssInteropFile = path.join(
  __dirname,
  '../node_modules/react-native-css-interop/dist/runtime/native/render-component.js'
);

if (fs.existsSync(cssInteropFile)) {
  let cssContent = fs.readFileSync(cssInteropFile, 'utf8');
  const oldStringify = `function stringify(object) {
    const seen = new WeakSet();
    return JSON.stringify(object, function replace(_, value) {
        if (!(value !== null && typeof value === "object")) {
            return value;
        }
        if (seen.has(value)) {
            return "[Circular]";
        }
        seen.add(value);
        const newValue = Array.isArray(value) ? [] : {};
        for (const entry of Object.entries(value)) {
            newValue[entry[0]] = replace(entry[0], entry[1]);
        }
        seen.delete(value);
        return newValue;
    }, 2);
}`;

  const safeStringify = `function stringify(object) {
    const seen = new WeakSet();
    try {
        return JSON.stringify(object, function replace(_, value) {
            if (!(value !== null && typeof value === "object")) {
                return value;
            }
            if (seen.has(value)) {
                return "[Circular]";
            }
            seen.add(value);
            const newValue = Array.isArray(value) ? [] : {};
            try {
                for (const entry of Object.entries(value)) {
                    try {
                        newValue[entry[0]] = replace(entry[0], entry[1]);
                    } catch {
                        newValue[entry[0]] = "[Unserializable]";
                    }
                }
            } catch {
                return "[Unserializable]";
            }
            seen.delete(value);
            return newValue;
        }, 2);
    } catch {
        return "[Unserializable]";
    }
}`;

  if (cssContent.includes(oldStringify)) {
    cssContent = cssContent.replace(oldStringify, safeStringify);
    fs.writeFileSync(cssInteropFile, cssContent, 'utf8');
    console.log('[patch-expo] Patched react-native-css-interop stringify for safe context inspection');
  }
}

// Fix react-native-track-player null safety in MusicModule.kt for React Native 0.88
const rntpModuleFile = path.join(
  __dirname,
  '../node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt'
);

if (fs.existsSync(rntpModuleFile)) {
  let rntpContent = fs.readFileSync(rntpModuleFile, 'utf8');
  let changed = false;

  const oldGetTrack = 'callback.resolve(Arguments.fromBundle(musicService.tracks[index].originalItem))';
  const newGetTrack = 'val item = musicService.tracks[index].originalItem\n            callback.resolve(item?.let { Arguments.fromBundle(it) })';

  const oldGetActiveTrack = `        callback.resolve(
            if (musicService.tracks.isEmpty()) null
            else Arguments.fromBundle(
                musicService.tracks[musicService.getCurrentTrackIndex()].originalItem
            )
        )`;
  const newGetActiveTrack = `        callback.resolve(
            if (musicService.tracks.isEmpty()) null
            else musicService.tracks[musicService.getCurrentTrackIndex()].originalItem?.let { Arguments.fromBundle(it) }
        )`;

  if (rntpContent.includes(oldGetTrack)) {
    rntpContent = rntpContent.replace(oldGetTrack, newGetTrack);
    changed = true;
  }
  if (rntpContent.includes(oldGetActiveTrack)) {
    rntpContent = rntpContent.replace(oldGetActiveTrack, newGetActiveTrack);
    changed = true;
  }

  // Fix TurboModule interop: @ReactMethod functions using `= scope.launch { ... }`
  // infer return type `Job` instead of `Unit` (void), crashing TurboModuleInteropUtils.
  const launchRegex = /(\)\s*)=\s*\n?\s*scope\.launch\s*\{/g;
  if (launchRegex.test(rntpContent)) {
    launchRegex.lastIndex = 0;
    let result = '';
    let lastIndex = 0;
    let match;
    while ((match = launchRegex.exec(rntpContent)) !== null) {
      const matchStart = match.index;
      const openBraceIndex = launchRegex.lastIndex - 1;
      let depth = 1;
      let i = openBraceIndex + 1;
      while (i < rntpContent.length && depth > 0) {
        const ch = rntpContent[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        i++;
      }
      if (depth === 0) {
        const closeBraceIndex = i - 1;
        const body = rntpContent.slice(openBraceIndex + 1, closeBraceIndex);
        result += rntpContent.slice(lastIndex, matchStart);
        result += `${match[1]}{\n        scope.launch {${body}}\n    }`;
        lastIndex = closeBraceIndex + 1;
      }
    }
    if (lastIndex > 0) {
      result += rntpContent.slice(lastIndex);
      rntpContent = result;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(rntpModuleFile, rntpContent, 'utf8');
    console.log('[patch-expo] Patched react-native-track-player MusicModule.kt');
  }
}

// Fix react-native-track-player MusicService.kt crash in RN 0.88 New Architecture
// (HeadlessJsTaskService provides `reactContext` for both Bridgeless and Legacy)
const rntpServiceFile = path.join(
  __dirname,
  '../node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/service/MusicService.kt'
);

if (fs.existsSync(rntpServiceFile)) {
  let serviceContent = fs.readFileSync(rntpServiceFile, 'utf8');
  const legacyAccessor = 'reactNativeHost.reactInstanceManager.currentReactContext';
  if (serviceContent.includes(legacyAccessor)) {
    serviceContent = serviceContent.replaceAll(legacyAccessor, 'reactContext');
    fs.writeFileSync(rntpServiceFile, serviceContent, 'utf8');
    console.log('[patch-expo] Patched react-native-track-player MusicService.kt to use reactContext');
  }
}

