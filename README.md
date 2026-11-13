# My Prayer (माय प्रेयर) - Multi-Faith Spiritual Companion

A cross-platform mobile application built with **React Native (Expo SDK 58, TypeScript)** and **Expo Router**, designed to provide an authentic, serene, and distraction-free daily prayer experience.

Initially launched with a **rich Hinduism dataset** (Chalisas, Aartis, Vrat Kathas, and Mantras), the app's architecture is fully modularized to seamlessly support **Sikhism, Islam, Christianity, Jainism, and Buddhism**.

---

## 🏛️ Project Architecture & Directory Structure

```
my-prayer/
├── app/                                 # Expo Router File-based Navigation
│   ├── _layout.tsx                      # Root navigation, theme provider & onboarding guard
│   ├── onboarding.tsx                   # Religion & language onboarding modal
│   ├── (tabs)/                          # Bottom 4-Tab Navigation
│   │   ├── _layout.tsx                  # Tab bar configuration & spiritual styling
│   │   ├── index.tsx                    # Home Screen (Greetings, Search, Categories, Hero, Deities, Lists)
│   │   ├── deities.tsx                  # Deities Screen (Full 6 deities with mantras, days, and filters)
│   │   ├── bookmarks.tsx                # Saved Prayers Screen (Instant offline bookmarks)
│   │   └── settings.tsx                 # Settings (Faith picker, language, font size, themes, dark mode)
│   ├── deity/
│   │   └── [id].tsx                     # Deity Detail Screen (Header banner, significance, prayer filter tabs)
│   └── prayer/
│       └── [id].tsx                     # Prayer Reader Screen (Parchment canvas, stanzas, mini audio player)
│
├── src/
│   ├── components/                      # Reusable Spiritual UI Components
│   │   ├── HeaderGreeting.tsx           # Time-based greetings (Suprabhat, etc.) & daily deity highlight
│   │   ├── SearchBar.tsx                # Real-time search across Hindi & English titles
│   │   ├── CategoryFilter.tsx           # Horizontal pill filters (All, Chalisa, Aarti, Katha, Mantra)
│   │   ├── FeaturedPrayerCard.tsx       # Daily hero prayer card with quotes & quick actions
│   │   ├── DeityAvatarList.tsx          # Circular deity avatars with associated fast days
│   │   ├── PrayerCard.tsx               # Vertical list card with category pills & bookmark buttons
│   │   ├── MiniAudioPlayer.tsx          # Sticky audio player with seek, rewind/forward & loop chanter
│   │   └── index.ts
│   │
│   ├── context/
│   │   ├── AppContext.tsx               # App state & AsyncStorage persistence (Religion, Lang, Font, Bookmarks)
│   │   └── index.ts
│   │
│   ├── data/
│   │   ├── hinduismData.ts              # Authentic starter dataset (6 Deities + Full authentic verses)
│   │   └── index.ts                     # Filter, search & lookup utility helpers
│   │
│   ├── theme/
│   │   ├── colors.ts                    # Saffron (#FF6F00), Maroon (#4A0E0E), Cream (#FFFBF5), Gold (#D4AF37)
│   │   ├── spacing.ts                   # Screen padding, card radii & pill geometries
│   │   ├── typography.ts                # Cross-platform Devanagari typography
│   │   └── index.ts
│   │
│   └── types/
│       ├── prayer.ts                    # TypeScript models for Religion, Deity, PrayerItem, VerseItem
│       └── index.ts
│
├── app.json                             # Expo app configuration & scheme
├── package.json                         # Dependencies & entrypoint (`expo-router/entry`)
└── tsconfig.json                        # Strict TypeScript configuration
```

---

## 🎨 Spiritual Color Palette & Design System

The app utilizes warm, traditional sacred tones optimized for contemplation and prayer:

| Token | Hex Code | Purpose |
|---|---|---|
| **Saffron (भगवा)** | `#FF6F00` / `#E65100` | Primary accents, buttons, active tabs, chant indicators |
| **Deep Maroon (मैरून)** | `#4A0E0E` / `#7A1C1C` | Dignified card headers, auspicious borders, hero backgrounds |
| **Parchment / Cream (क्रीम)** | `#FFFBF5` / `#FDF6EC` | Distraction-free reading canvas mimicking ancient manuscripts |
| **Sacred Gold (स्वर्ण)** | `#D4AF37` / `#FFE57F` | Doha / Chaupai indicators, quotes, highlights |
| **Dark Contemplation** | `#140E0A` / `#221913` | Low-light night mode for dawn (Brahma Muhurta) & evening meditation |

---

## ✨ Features Implemented

### 1. Religion-First Onboarding & Switching
- First-launch screen with interactive cards for:
  - **Hinduism** (Active & complete)
  - **Sikhism, Islam, Christianity, Jainism, Buddhism** (Showcased with clear "Coming Soon" indicators)
- Language preference selector: **Hindi Devanagari**, **English Transliteration**, or **Both (Recommended)**.

### 2. Home Screen
- Dynamic time-based greeting (*Suprabhat*, *Shubh Sandhya*, etc.).
- **Today's Hindu Weekday Highlight** (e.g., Tuesday: *Lord Hanuman Ji - Courage & Obstacle Removal*, Monday: *Lord Shiva*, Wednesday: *Lord Ganesha*).
- Real-time search filtering simultaneously across English and Hindi titles.
- Quick horizontal category pills: *All*, *Chalisa*, *Aarti*, *Vrat Katha*, *Mantra*.
- Hero "Featured Daily Prayer" card.
- Circular avatar deities list.
- "Recently Read" & "Popular Chalisas & Aartis" cards with direct bookmarking.

### 3. Deity Detail Screen (`/deity/[id]`)
- Deity identity banner with sacred avatar, significance, and associated day.
- Category tabs (Chalisa, Aarti, Katha, Mantra) specifically for that deity.
- One-tap navigation to prayer reader.

### 4. Distraction-Free Prayer Reader (`/prayer/[id]`)
- Dedicated reading canvas with theme toggle (Parchment Cream, Sepia, Night Dark, Clean White).
- Dynamic font scaling (`A-` and `A+`).
- Language mode switcher (*हिन्दी*, *English Transliteration*, *Both*).
- Stanza classification:
  - **Doha** (दोहा): Highlighted with saffron left accent.
  - **Chaupai** (चौपाई): Numbered verse cards.
  - **Chorus & Stanza**: For Aartis like *Om Jai Jagdish Hare*.
  - **Chapter Storytelling**: Narrative format for Vrat Kathas.
  - **Mantra & Shloka**: Chanting layout with Rigvedic translation.
- **Sticky Mini Audio Player**:
  - Play / Pause simulation.
  - 10-second skip forward / rewind.
  - Progress bar with elapsed & remaining time.
  - **Chant Counter / Loop**: `1x`, `11x`, `21x`, `108x`, or continuous `∞` loop.

### 5. Rich Starter Dataset (`src/data/hinduismData.ts`)
- **6 Major Deities**: Lord Hanuman, Lord Shiva, Lord Ganesha, Goddess Durga, Lord Krishna, Goddess Lakshmi.
- Complete authentic content for:
  1. **Shri Hanuman Chalisa** (Full opening Dohas, Chaupais, and closing Doha)
  2. **Om Jai Jagdish Hare** (Full Aarti verses)
  3. **Jai Ganesh Deva** (Ganesha Aarti)
  4. **Om Namah Shivaya & Maha Mrityunjaya Mantra** (Rigvedic healing mantra)
  5. **Satyanarayan Vrat Katha** (Structured chapter summary)
  6. **Brihaspativar (Thursday) Vrat Katha** (Story of Devaguru Brihaspati)
  7. **Jai Ambe Gauri** (Durga Aarti)
  8. **Om Jai Lakshmi Mata** (Lakshmi Aarti)

### 6. Offline Persistence & Settings
- All preferences, bookmarks, and recent reading logs are stored offline using `@react-native-async-storage/async-storage`.
- Native sharing support via React Native `Share.share` API.
- Full reset preferences option.

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+)
- Expo CLI (`npm install -g expo-cli` or via `npx expo`)

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm start
# or
npm run android   # to run on Android emulator or physical device
npm run ios       # to run on iOS simulator (macOS)
npm run web       # to run on web browser
```

