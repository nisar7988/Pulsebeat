package com.pulsebeat.widget

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import com.pulsebeat.MainActivity
import com.reactnativeandroidwidget.RNWidgetProvider

class PulseBeatPlayer : RNWidgetProvider() {
  private fun isAppTaskActive(context: Context): Boolean {
    val am = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
    return am?.appTasks?.isNotEmpty() == true
  }

  private fun launchMainActivity(context: Context) {
    val launchIntent = Intent(context, MainActivity::class.java).apply {
      action = Intent.ACTION_MAIN
      addCategory(Intent.CATEGORY_LAUNCHER)
      addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_SINGLE_TOP,
      )
    }
    context.startActivity(launchIntent)
  }

  override fun onReceive(context: Context, intent: Intent) {
    if ("${context.packageName}.WIDGET_CLICK" == intent.action) {
      val clickAction = intent.getStringExtra("clickAction")
      if (clickAction == null || clickAction == "OPEN_APP" || !isAppTaskActive(context)) {
        launchMainActivity(context)
        return
      }
    }
    super.onReceive(context, intent)
  }
}
