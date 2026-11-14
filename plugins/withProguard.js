const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withProguard(config) {
  return withDangerousMod(config, [
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
};

