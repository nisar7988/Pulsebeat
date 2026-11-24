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
