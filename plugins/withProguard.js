const { withDangerousMod, withGradleProperties } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAndroidCustomizations(config) {
  // 1. Proguard / R8 missing class suppressions for expo-av
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const proguardFile = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );

      const customRules = `
# Proguard / R8 missing class suppressions for expo-av
-dontwarn expo.modules.av.**
-dontwarn expo.modules.core.**
-dontwarn expo.modules.kotlin.**
-dontwarn expo.modules.core.interfaces.services.KeepAwakeManager
-dontwarn expo.modules.kotlin.types.AnyTypeProvider
-dontwarn expo.modules.kotlin.types.LazyKType

-keep class expo.modules.av.** { *; }
-keep class expo.modules.core.** { *; }
-keep class expo.modules.kotlin.** { *; }
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
  // compileSdkVersion 34 and targetSdkVersion 34 target stable Android 14
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
    setProperty('android.compileSdkVersion', '34');
    setProperty('android.targetSdkVersion', '34');

    return config;
  });

  return config;
};

