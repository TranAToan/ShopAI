// SDK 57 compatibility with the existing AGP 9.2.1. Library targetSdk was
// removed from AGP's DSL; the application's targetSdk remains configured in app.
package expo.modules.plugin.android

import com.android.build.gradle.LibraryExtension

@Suppress("UNUSED_PARAMETER")
internal fun LibraryExtension.applySDKVersions(compileSdk: Int, minSdk: Int, targetSdk: Int) {
  this.compileSdk = compileSdk
  defaultConfig { this@defaultConfig.minSdk = minSdk }
}

internal fun LibraryExtension.applyLinterOptions() {
  lintOptions.isAbortOnError = false
}

internal fun LibraryExtension.applyPublishingVariant() {
  publishing { publishing ->
    publishing.singleVariant("release") { withSourcesJar() }
  }
}
