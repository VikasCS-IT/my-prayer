const { withDangerousMod, withGradleProperties } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAndroidCustomizations(config) {
  // 1. Proguard / R8 missing class suppressions and keep rules for release builds
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const proguardFile = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );

      const customRules = `
# Proguard / R8 rules for Expo modules in release builds
-dontwarn expo.modules.**
-dontwarn com.facebook.react.**
-dontwarn androidx.**

# Keep Expo modules reflection & JNI interfaces
-keep class expo.modules.** { *; }
-keep interface expo.modules.** { *; }

# Keep React Native core & TurboModules
-keep class com.facebook.react.** { *; }
-keep class com.swmansion.** { *; }

# General keeps for annotations
-keepattributes *Annotation*
-keepclassmembers class * {
    @androidx.annotation.Keep *;
}
`;

      if (fs.existsSync(proguardFile)) {
        fs.appendFileSync(proguardFile, customRules);
      } else {
        fs.writeFileSync(proguardFile, customRules);
      }

      return config;
    },
  ]);

  // 2. Set Android SDK versions:
  // minSdkVersion 24 covers Android 7.0, 8.0, 9.0 (API 28), and 10.0 (API 29)
  // compileSdkVersion 37 satisfies modern AndroidX requirements (androidx.core 1.17.0 / androidx.transition 1.7.0)
  config = withGradleProperties(config, (config) => {
    const properties = config.modResults;
    const setProperty = (key, value) => {
      const existing = properties.find((p) => p.type === 'property' && p.key === key);
      if (existing) {
        existing.value = value;
      } else {
        properties.push({ type: 'property', key, value });
      }
    };

    setProperty('android.minSdkVersion', '24');
    setProperty('android.compileSdkVersion', '37');
    setProperty('android.targetSdkVersion', '34');

    return config;
  });

  return config;
};
