# My Prayer - Enterprise Web Admin Dashboard

A secure, modern SaaS admin dashboard built with **Next.js (App Router)** and **Tailwind CSS**, connected directly to the **Supabase** backend of the My Prayer mobile application.

## Features

1. **Strict Admin Authentication**:
   - Secure Supabase Auth verification.
   - Enforces `role = 'admin'` from the `profiles` table. Unauthorized users are blocked.

2. **Dashboard Overview**:
   - Real-time count of registered users/devotees, religions, deities, and prayers.
   - Quick action shortcuts.

3. **Religions Manager**:
   - Add, edit, and delete spiritual traditions.
   - Toggle active status and manage icons/slugs.

4. **Deities Manager**:
   - Add/edit deities with significance, titles, and display order.
   - Toggle "Popular" status for home screen visibility.
   - Direct image upload & replace via Supabase Storage (`deity-images` bucket).

5. **Prayers & Audio Manager**:
   - Create and edit Chalisas, Aartis, Kathas, Mantras, and Stotras.
   - Upload and delete `.mp3` audio files to the `prayer-audio` bucket with audio playback preview.
   - Manage verse-by-verse content (Doha, Chaupai, Stanza, English transliteration, and meaning).

6. **App Metadata & Branding**:
   - Remote control for App Title, App Icon URL, Splash Screen URL, and announcement banner.

## Running the Web Admin

```bash
cd admin-web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
Log in with your administrator credentials:
- **Email**: `prayer@myprayer.com`
- **Password**: `Admin@123`
