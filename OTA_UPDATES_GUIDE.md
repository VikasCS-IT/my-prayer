# Complete CI/CD & OTA Updates Guide for "My Prayer"

This project is set up with an automated CI/CD pipeline separating **Zero-Friction OTA Updates** from **Manual Native Builds**:

```
1. Push/Merge to 'dev' branch
   └──> 📲 Automated Dev OTA Update (eas update --branch dev)
        • Updates dev/testing devices instantly.

2. Push/Merge to 'master' branch
   └──> 📲 Automated Production OTA Update (eas update --branch production)
        • All production users receive new prayers, text, and UI changes
          completely automatically next time they open the app.
        • No APK download, no Play Store submission, and no reinstall needed!

3. Manual Native Build (Only when new native libraries/dependencies are added)
   └──> 🏗️ GitHub Actions Manual Trigger ("Run workflow")
        • Triggers EAS Build to compile a new APK/AAB for Android.
```

---

## 📲 How Users Receive OTA Updates Automatically

1. **Zero User Action Required**:
   - `checkAutomatically: "ON_LOAD"` and `fallbackToCacheTimeout: 0` are enabled in `app.json`.
   - When a user opens the app, it opens immediately from the local cache with 0 delay.
   - In the background, `expo-updates` checks for updates and downloads the new bundle.
   - The next time the user opens the app, the new bundle is **automatically active**!
2. **Instant Visual Banner (Optional Quick-Reload)**:
   - When the background download completes while the user is using the app, a gentle sacred banner appears:
     *"🌸 नया पावन संकलन स्वतः डाउनलोड हो चुका है (अगली बार ऐप खोलने पर स्वतः लागू हो जाएगा)"*
     with an *"अभी देखें"* button to reload right away if they want.

---

## 🏗️ When & How to Trigger a New Native Build (APK / AAB)

### When is a Native Build Needed?
- **NOT needed for**: Adding prayers, editing text, fixing styles, audio player tweaks, updating translation scripts. (Use regular Git push/merge for instant OTA!).
- **ONLY needed when**: You add a new native library with native code (e.g. native camera, Bluetooth, or upgrading React Native version).

### How to Trigger the Native Build:
1. Go to your **GitHub Repository ➔ Actions** tab.
2. Select **"Manual - Build Native App (APK / AAB)"** on the left.
3. Click **Run workflow**:
   - Select branch: `master`
   - Target platform: `android`
   - Build profile:
     - `preview`: generates an installable `.apk` file for direct testing on phones.
     - `production`: generates an optimized `.aab` for the Google Play Store.
4. Click the green **Run workflow** button!
