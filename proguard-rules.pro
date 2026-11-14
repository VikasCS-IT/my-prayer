# Proguard / R8 rules for Expo & React Native

# expo-av reflection and keep-awake compatibility
-dontwarn expo.modules.av.**
-dontwarn expo.modules.core.**
-dontwarn expo.modules.kotlin.**
-dontwarn expo.modules.core.interfaces.services.KeepAwakeManager

-keep class expo.modules.av.** { *; }
-keep class expo.modules.core.** { *; }
-keep class expo.modules.kotlin.** { *; }
-keep class expo.modules.core.interfaces.services.** { *; }

# General React Native and Expo JNI keeps
-keepattributes *Annotation*
-keepclassmembers class * {
    @androidx.annotation.Keep *;
}

