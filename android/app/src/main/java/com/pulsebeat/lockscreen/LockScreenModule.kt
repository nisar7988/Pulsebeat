package com.pulsebeat.lockscreen

import android.app.ActivityManager
import android.app.KeyguardManager
import android.content.Context
import android.os.Build
import android.view.WindowManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class LockScreenModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "LockScreenModule"

  @ReactMethod
  fun setShowWhenLocked(enabled: Boolean) {
    val activity = reactApplicationContext.currentActivity ?: return
    activity.runOnUiThread {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        activity.setShowWhenLocked(enabled)
      } else {
        @Suppress("DEPRECATION")
        if (enabled) {
          activity.window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED)
        } else {
          activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED)
        }
      }
    }
  }

  @ReactMethod
  fun isAppRunning(promise: Promise) {
    try {
      val am = reactApplicationContext.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
      val hasTask = am?.appTasks?.isNotEmpty() == true
      promise.resolve(hasTask)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun isDeviceLocked(promise: Promise) {
    try {
      val km = reactApplicationContext.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
      promise.resolve(km?.isKeyguardLocked ?: false)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun requestDismissKeyguard(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.resolve(false)
      return
    }
    val km = reactApplicationContext.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
    if (km == null || !km.isKeyguardLocked) {
      promise.resolve(true)
      return
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      activity.runOnUiThread {
        km.requestDismissKeyguard(
          activity,
          object : KeyguardManager.KeyguardDismissCallback() {
            override fun onDismissSucceeded() {
              promise.resolve(true)
            }

            override fun onDismissCancelled() {
              promise.resolve(false)
            }

            override fun onDismissError() {
              promise.resolve(false)
            }
          },
        )
      }
    } else {
      promise.resolve(false)
    }
  }
}
