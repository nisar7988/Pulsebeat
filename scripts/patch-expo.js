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
