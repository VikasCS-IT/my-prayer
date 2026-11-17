-- =====================================================================
-- My Prayer - Complete Supabase Database Schema & Storage Configuration
-- =====================================================================

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mobile TEXT,
    age INT,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Religions Table
CREATE TABLE IF NOT EXISTS public.religions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_hi TEXT NOT NULL,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Deities Table
CREATE TABLE IF NOT EXISTS public.deities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    religion_id UUID REFERENCES public.religions(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_hi TEXT NOT NULL,
    image_url TEXT,
    significance TEXT,
    display_order INT DEFAULT 1,
    is_popular BOOLEAN DEFAULT false,
    color TEXT DEFAULT '#FF6F00',
    associated_day_hi TEXT,
    associated_day_en TEXT,
    avatar_icon TEXT DEFAULT '🕉️',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Prayers Table
CREATE TABLE IF NOT EXISTS public.prayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deity_id UUID REFERENCES public.deities(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('chalisa', 'aarti', 'katha', 'mantra', 'stotra')),
    title_en TEXT NOT NULL,
    title_hi TEXT NOT NULL,
    subtitle_hi TEXT,
    subtitle_en TEXT,
    audio_url TEXT,
    duration_seconds INT DEFAULT 480,
    is_featured BOOLEAN DEFAULT false,
    significance TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Verses Table
CREATE TABLE IF NOT EXISTS public.verses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prayer_id UUID REFERENCES public.prayers(id) ON DELETE CASCADE,
    verse_number INT NOT NULL,
    text_hi TEXT NOT NULL,
    text_en TEXT,
    meaning_en TEXT,
    verse_type TEXT DEFAULT 'chaupai',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. App Metadata & Remote Config Table
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.religions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users Can Insert Own Profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users Can Update Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins Full Control Profiles" ON public.profiles FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Public Read-Only Access
CREATE POLICY "Public Read Religions" ON public.religions FOR SELECT USING (true);
CREATE POLICY "Public Read Deities" ON public.deities FOR SELECT USING (true);
CREATE POLICY "Public Read Prayers" ON public.prayers FOR SELECT USING (true);
CREATE POLICY "Public Read Verses" ON public.verses FOR SELECT USING (true);
CREATE POLICY "Public Read App Config" ON public.app_config FOR SELECT USING (true);

-- Authenticated Full Access for Admin
CREATE POLICY "Admin Full Religions" ON public.religions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Deities" ON public.deities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Prayers" ON public.prayers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Verses" ON public.verses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full App Config" ON public.app_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================================
-- SUPABASE STORAGE BUCKETS CONFIGURATION
-- =====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('deity-images', 'deity-images', true),
  ('prayer-audio', 'prayer-audio', true),
  ('app-assets', 'app-assets', true),
  ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access to storage buckets
CREATE POLICY "Public Access deity-images" ON storage.objects FOR SELECT USING (bucket_id = 'deity-images');
CREATE POLICY "Public Access prayer-audio" ON storage.objects FOR SELECT USING (bucket_id = 'prayer-audio');
CREATE POLICY "Public Access app-assets" ON storage.objects FOR SELECT USING (bucket_id = 'app-assets');
CREATE POLICY "Public Access profile-photos" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');

-- Upload access to storage buckets
CREATE POLICY "Admin Upload deity-images" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'deity-images') WITH CHECK (bucket_id = 'deity-images');
CREATE POLICY "Admin Upload prayer-audio" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'prayer-audio') WITH CHECK (bucket_id = 'prayer-audio');
CREATE POLICY "Admin Upload app-assets" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'app-assets') WITH CHECK (bucket_id = 'app-assets');
CREATE POLICY "Auth Upload profile-photos" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'profile-photos') WITH CHECK (bucket_id = 'profile-photos');
