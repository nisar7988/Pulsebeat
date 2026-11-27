package com.pulsebeat.lockscreen

import android.content.Context
import android.media.AudioManager
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class AudioInterruptionModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var modeChangedListener: AudioManager.OnModeChangedListener? = null
  private var lastInterrupted = false

  override fun getName(): String = "AudioInterruptionModule"

  private fun getAudioManager(): AudioManager? =
    reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

  private fun isInterruptionMode(mode: Int): Boolean =
    mode == AudioManager.MODE_RINGTONE ||
      mode == AudioManager.MODE_IN_CALL ||
      mode == AudioManager.MODE_IN_COMMUNICATION

  private fun emitInterruptionEvent(active: Boolean, mode: Int) {
    if (!reactApplicationContext.hasActiveReactInstance()) return
    val payload = Arguments.createMap().apply {
      putBoolean("active", active)
      putInt("mode", mode)
    }
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(EVENT_NAME, payload)
  }

  override fun initialize() {
    super.initialize()
    val audioManager = getAudioManager() ?: return
    lastInterrupted = isInterruptionMode(audioManager.mode)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val listener = AudioManager.OnModeChangedListener { mode ->
        val interrupted = isInterruptionMode(mode)
        if (interrupted != lastInterrupted) {
          lastInterrupted = interrupted
          emitInterruptionEvent(interrupted, mode)
        }
      }
      modeChangedListener = listener
      audioManager.addOnModeChangedListener(reactApplicationContext.mainExecutor, listener)
    }
  }

  override fun invalidate() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val listener = modeChangedListener
      if (listener != null) {
        getAudioManager()?.removeOnModeChangedListener(listener)
        modeChangedListener = null
      }
    }
    super.invalidate()
  }

  @ReactMethod
  fun isInterruptionActive(promise: Promise) {
    try {
      val mode = getAudioManager()?.mode ?: AudioManager.MODE_NORMAL
      promise.resolve(isInterruptionMode(mode))
    } catch (_: Exception) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required by React Native NativeEventEmitter
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required by React Native NativeEventEmitter
  }

  companion object {
    const val EVENT_NAME = "AudioInterruption"
  }
}
