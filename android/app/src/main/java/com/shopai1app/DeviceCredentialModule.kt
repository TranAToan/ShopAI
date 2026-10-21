package com.shopai1app

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/** The OS verifies its own screen-lock credential; the app never receives the PIN. */
class DeviceCredentialModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private var pending: Promise? = null
  private var requestCode = 4200
  private var pendingCode = -1
  private var launchingActivity: Activity? = null
  private val listener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != pendingCode) return
      val request = pending ?: return
      pending = null
      pendingCode = -1
      launchingActivity = null
      request.resolve(resultCode == Activity.RESULT_OK)
    }
  }

  init { context.addActivityEventListener(listener) }
  override fun getName() = "ShopDeviceCredential"
  override fun getConstants(): Map<String, Any> = mapOf(
    "appEnvironment" to BuildConfig.SHOP_ENVIRONMENT,
    "apiBaseUrl" to BuildConfig.SHOP_API_URL,
    "firebaseConfigured" to BuildConfig.SHOP_FIREBASE_CONFIGURED,
    "updatesConfigured" to BuildConfig.SHOP_UPDATES_CONFIGURED
  )

  @ReactMethod
  fun deriveAppPin(pin: String, salt: String, promise: Promise) {
    if (!pin.matches(Regex("[0-9]{6}")) || !salt.matches(Regex("[a-f0-9]{48}"))) {
      promise.reject("INVALID_PIN", "Expected a six digit app PIN.")
      return
    }
    Thread {
      val spec = PBEKeySpec(pin.toCharArray(), salt.toByteArray(Charsets.UTF_8), 120000, 256)
      try {
        val bytes = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
        promise.resolve(bytes.joinToString("") { "%02x".format(it.toInt() and 255) })
      } catch (_: Exception) {
        promise.reject("PIN_UNAVAILABLE", "Could not verify app PIN.")
      } finally { spec.clearPassword() }
    }.start()
  }

  @ReactMethod
  fun authenticate(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      if (pending != null) {
        promise.reject("AUTH_BUSY", "An authentication prompt is already active.")
        return@runOnUiThread
      }
      val activity = context.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "No foreground activity.")
        return@runOnUiThread
      }
      val keyguard = context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
      if (!keyguard.isDeviceSecure) {
        promise.reject("NO_DEVICE_CREDENTIAL", "Configure a screen-lock PIN in Android Settings.")
        return@runOnUiThread
      }
      val intent = keyguard.createConfirmDeviceCredentialIntent(
        "Mở khóa ShopAI", "Nhập mã PIN khóa màn hình điện thoại của bạn."
      )
      if (intent == null) {
        promise.reject("AUTH_UNAVAILABLE", "Device authentication is unavailable.")
        return@runOnUiThread
      }
      requestCode = if (requestCode >= 60000) 4200 else requestCode + 1
      pendingCode = requestCode
      pending = promise
      launchingActivity = activity
      try { activity.startActivityForResult(intent, requestCode) }
      catch (_: Exception) {
        pending = null
        pendingCode = -1
        launchingActivity = null
        promise.reject("AUTH_UNAVAILABLE", "Could not open device authentication.")
      }
    }
  }

  @ReactMethod
  fun cancel(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      val request = pending
      val code = pendingCode
      val activity = launchingActivity
      pending = null
      pendingCode = -1
      launchingActivity = null
      request?.resolve(false)
      if (code >= 0) {
        try { activity?.finishActivity(code) } catch (_: Exception) { /* Already closed. */ }
      }
      promise.resolve(null)
    }
  }

  override fun invalidate() {
    context.removeActivityEventListener(listener)
    pending?.resolve(false)
    pending = null
    pendingCode = -1
    launchingActivity = null
    super.invalidate()
  }
}
