# Over-The-Air (OTA) Updates Guide for "My Prayer"

Over-The-Air (OTA) updates allow you to fix bugs, add new prayers, update UI colors, and deploy features **instantly** to users' devices **without** submitting a new APK/AAB to Google Play or asking users to reinstall the application.

---

## ⚡ How OTA Updates Work in React Native / Expo

A compiled React Native app consists of two layers:
1. **The Native Binary (`.apk` / `.aab` / `.ipa`)**: Native C++/Java/Kotlin/Swift modules, permissions, app icons, and the native bridge/runtime.
2. **The JavaScript & Asset Bundle (`index.js` + images/fonts)**: All your screens (`app/`), components (`src/components/`), datasets (`src/data/`), business logic, and styling.

When an OTA update is published:
- Only the **JavaScript bundle & assets** are updated.
- The user's installed app contacts your update server, downloads the new bundle in the background, and immediately reloads into the latest code!

---

## 🛠️ Two Ways to Host & Deploy OTA Updates

### Option 1: Expo Application Services (EAS) Update (Managed, Recommended)

EAS Update is the global, multi-region CDN solution maintained by Expo.

#### Step 1: Install EAS CLI and Log In
```bash
npx eas-cli@latest login
```

#### Step 2: Configure EAS Update in Your Project
```bash
npx eas-cli@latest update:configure
```

This creates an `eas.json` configuration file and automatically adds your `projectId` and `updates.url` to `app.json`.

#### Step 3: Publish an Instant OTA Update
Whenever you edit code or add new prayers:
```bash
# Publish to production users instantly:
npx eas-cli@latest update --branch production --message "Added new Durga Stotra & fixed audio"
```

Users on the `production` channel will receive this update on their next app start!

---

### Option 2: Self-Hosted OTA Update Server (Your Own Server / S3 / Nginx)

You can host updates on your own VPS, Node.js server, AWS S3 bucket, or Firebase Hosting without paying for any third-party service.

#### Step 1: Export the Update Bundle
Run the Expo export command:
```bash
npx expo export --platform android
# or export for both platforms:
npx expo export
```
This generates a `dist/` directory containing:
- `dist/_expo/static/js/...`: The minified JavaScript bundle.
- `dist/assets/...`: Exported static assets.
- `dist/metadata.json`: The manifest containing bundle hashes and file list.

#### Step 2: Configure Your Server URL in `app.json`
Point `updates.url` in `app.json` to your server's endpoint:
```json
{
  "expo": {
    "updates": {
      "enabled": true,
      "url": "https://updates.yourdomain.com/api/manifest",
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

#### Step 3: Implement the Manifest Endpoint (Node.js Express Example)
Expo expects your server to respond to `GET /api/manifest` with the manifest generated in `dist/`:

```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Serve static assets from exported dist/ directory
app.use('/assets', express.static(path.join(__dirname, 'dist/assets')));
app.use('/_expo', express.static(path.join(__dirname, 'dist/_expo')));

// Manifest endpoint
app.get('/api/manifest', (req, res) => {
  const protocolVersion = req.headers['expo-protocol-version'] || '0';
  const platform = req.headers['expo-platform'] || 'android';
  const runtimeVersion = req.headers['expo-runtime-version'] || '1.0.0';

  // Read metadata.json from dist
  const metadataPath = path.join(__dirname, 'dist/metadata.json');
  if (!fs.existsSync(metadataPath)) {
    return res.status(404).send('No update found');
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const fileMetadata = metadata.fileMetadata[platform];

  const manifest = {
    id: metadata.version || 'update-' + Date.now(),
    createdAt: new Date().toISOString(),
    runtimeVersion: runtimeVersion,
    launchAsset: {
      key: 'bundle',
      contentType: 'application/javascript',
      url: `https://updates.yourdomain.com/${fileMetadata.bundle}`
    },
    assets: fileMetadata.assets.map(asset => ({
      key: asset.path,
      contentType: asset.ext.endsWith('png') ? 'image/png' : 'application/octet-stream',
      url: `https://updates.yourdomain.com/assets/${asset.path}`
    }))
  };

  res.setHeader('expo-protocol-version', protocolVersion);
  res.setHeader('content-type', 'application/json');
  res.json(manifest);
});

app.listen(3000, () => console.log('OTA Server running on port 3000'));
```

---

## 📱 How the App Checks for Updates

In the app, updates are handled by `src/services/updateService.ts` and visible in `Settings > Over-The-Air (OTA) Updates`:

1. **Automatic Check on Launch (`checkAutomatically: "ON_LOAD"`)**:
   - Every time the user opens "My Prayer", the app checks the update server.
   - If an update is detected, it downloads silently in the background and is applied on the next start.
2. **Manual Check in Settings**:
   - Users can tap **"अपडेट जांचें • Check for Updates"** in Settings.
   - If an update is ready, a **"नया अपडेट लागू करें • Apply & Reload"** button appears, letting them refresh to the latest bundle in 2 seconds.

---

## ⚠️ When is a New APK/AAB Required? (Native Changes)

You only need to build and distribute a new APK/AAB when:
- You add a new native library that modifies Android/iOS native code (e.g. adding camera or Bluetooth permissions).
- You change the `runtimeVersion` or minimum OS version in `app.json`.

All UI changes, new prayers, new audio files, translations, themes, and business logic can be shipped **100% through OTA updates**!

