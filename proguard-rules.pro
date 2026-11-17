# Proguard / R8 rules for Expo & React Native

# Suppress missing class warnings for all Expo modules and React Native
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
