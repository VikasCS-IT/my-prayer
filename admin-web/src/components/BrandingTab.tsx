import React, { useState, useEffect } from 'react';
import { Settings, UploadCloud, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { apiGetAppConfig, apiUpdateAppConfig, apiUploadFile } from '../lib/api-client';

interface BrandingTabProps {
  showToast: (type: 'success' | 'error', message: string) => void;
}

export const BrandingTab: React.FC<BrandingTabProps> = ({ showToast }) => {
  const [appTitle, setAppTitle] = useState('My Prayer • Daily Devotional Chants');
  const [appIconUrl, setAppIconUrl] = useState('');
  const [splashImageUrl, setSplashImageUrl] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<'icon' | 'splash' | null>(null);

  useEffect(() => {
    async function loadConfig() {
      setIsLoading(true);
      try {
        const config = await apiGetAppConfig();
        if (config.app_title) setAppTitle(config.app_title);
        if (config.app_icon_url) setAppIconUrl(config.app_icon_url);
        if (config.splash_image_url) setSplashImageUrl(config.splash_image_url);
        if (config.announcement_banner) setAnnouncement(config.announcement_banner);
      } catch (err) {
        console.warn('Error loading config:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'icon' | 'splash'
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setUploadingTarget(type);
    try {
      const publicUrl = await apiUploadFile('app-assets', file);
      if (type === 'icon') {
        setAppIconUrl(publicUrl);
        showToast('success', 'App icon uploaded successfully via API!');
      } else {
        setSplashImageUrl(publicUrl);
        showToast('success', 'Splash screen image uploaded successfully via API!');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Image upload failed');
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiUpdateAppConfig({
        app_title: appTitle.trim(),
        app_icon_url: appIconUrl.trim(),
        splash_image_url: splashImageUrl.trim(),
        announcement_banner: announcement.trim(),
      });
      showToast('success', 'App branding and remote metadata saved successfully via API!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save config');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
          App Metadata & Remote Branding
        </h2>
        <p className="text-sm text-stone-500 mt-1">
          Remotely customize mobile app titles, icon URLs, splash screen visuals, and announcements without requiring a new APK release
        </p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm space-y-6">
          {/* App Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
              Mobile Application Title
            </label>
            <input
              type="text"
              required
              value={appTitle}
              onChange={(e) => setAppTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              placeholder="e.g. My Prayer • Daily Devotional Chants"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Displayed prominently on the app header and welcome screens
            </p>
          </div>

          {/* App Icon */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
              Remote App Icon URL
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <input
                type="text"
                value={appIconUrl}
                onChange={(e) => setAppIconUrl(e.target.value)}
                placeholder="https://.../icon.png"
                className="flex-1 w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
              />
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold shadow-sm transition-colors flex-shrink-0">
                {uploadingTarget === 'icon' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                ) : (
                  <UploadCloud className="w-4 h-4 text-orange-600" />
                )}
                <span>Upload New Icon</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'icon')}
                  disabled={uploadingTarget !== null}
                />
              </label>
            </div>
            {appIconUrl && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={appIconUrl}
                  alt="App Icon Preview"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-stone-200 shadow-sm"
                />
                <span className="text-xs text-stone-500">Live Icon Preview</span>
              </div>
            )}
          </div>

          {/* Splash Screen Image */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
              Remote Splash Screen Image URL
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <input
                type="text"
                value={splashImageUrl}
                onChange={(e) => setSplashImageUrl(e.target.value)}
                placeholder="https://.../splash.png"
                className="flex-1 w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
              />
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold shadow-sm transition-colors flex-shrink-0">
                {uploadingTarget === 'splash' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                ) : (
                  <UploadCloud className="w-4 h-4 text-orange-600" />
                )}
                <span>Upload Splash Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'splash')}
                  disabled={uploadingTarget !== null}
                />
              </label>
            </div>
            {splashImageUrl && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={splashImageUrl}
                  alt="Splash Preview"
                  className="h-28 w-20 rounded-xl object-cover border-2 border-stone-200 shadow-sm"
                />
                <span className="text-xs text-stone-500">Live Splash Preview</span>
              </div>
            )}
          </div>

          {/* Announcement Banner */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
              Daily Announcement / Blessing Banner
            </label>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              placeholder="e.g. Wishing you peace, clarity and spiritual strength this auspicious day"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-950/20 disabled:opacity-50 transition-all"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save App Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
