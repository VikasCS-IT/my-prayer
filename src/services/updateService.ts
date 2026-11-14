import { Platform } from 'react-native';
import * as Updates from 'expo-updates';

export interface UpdateStatus {
  isAvailable: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  isDownloaded: boolean;
  lastCheckedDate: Date | null;
  currentUpdateId: string | null;
  runtimeVersion: string | null;
  channel: string | null;
  isEmbeddedLaunch: boolean;
  errorMessage: string | null;
}

class UpdateService {
  private status: UpdateStatus = {
    isAvailable: false,
    isChecking: false,
    isDownloading: false,
    isDownloaded: false,
    lastCheckedDate: null,
    currentUpdateId: null,
    runtimeVersion: '1.0.0',
    channel: 'production',
    isEmbeddedLaunch: true,
    errorMessage: null,
  };

  getStatus(): UpdateStatus {
    try {
      return {
        ...this.status,
        currentUpdateId: Updates?.updateId || null,
        runtimeVersion: Updates?.runtimeVersion || '1.0.0',
        channel: Updates?.channel || 'production',
        isEmbeddedLaunch: Updates?.isEmbeddedLaunch ?? true,
      };
    } catch {
      return this.status;
    }
  }

  // Check if an update exists on your server
  async checkForUpdate(): Promise<{ hasUpdate: boolean; message: string }> {
    if (Platform.OS === 'web') {
      return {
        hasUpdate: false,
        message: 'वेब प्लेटफॉर्म पर हमेशा नवीनतम संस्करण लोड होता है।',
      };
    }

    if (__DEV__) {
      return {
        hasUpdate: false,
        message: 'विकास मोड (Development Mode) में लाइव रीलोड सक्रिय है।',
      };
    }

    try {
      if (!Updates.isEnabled) {
        return {
          hasUpdate: false,
          message: 'ओटीए अपडेट्स इस बिल्ड में सक्रिय नहीं हैं।',
        };
      }

      this.status.isChecking = true;
      this.status.errorMessage = null;

      const checkResult = await Updates.checkForUpdateAsync();
      this.status.lastCheckedDate = new Date();
      this.status.isChecking = false;

      if (checkResult?.isAvailable) {
        this.status.isAvailable = true;
        return {
          hasUpdate: true,
          message: 'नया अपडेट उपलब्ध है! डाउनलोड करने के लिए टैप करें।',
        };
      } else {
        this.status.isAvailable = false;
        return {
          hasUpdate: false,
          message: 'आपका ऐप पहले से ही नवीनतम संस्करण पर है।',
        };
      }
    } catch (error: any) {
      this.status.isChecking = false;
      this.status.errorMessage = error?.message || 'अपडेट सर्वर से संपर्क नहीं हो सका';
      return {
        hasUpdate: false,
        message: `अपडेट जांच में त्रुटि: ${this.status.errorMessage}`,
      };
    }
  }

  // Automatically check & download in background on app start without disturbing the user
  async autoCheckAndDownloadInBackground(): Promise<{ isNewDownloaded: boolean }> {
    try {
      if (Platform.OS === 'web' || __DEV__) return { isNewDownloaded: false };
      if (!Updates.isEnabled) return { isNewDownloaded: false };

      const checkResult = await Updates.checkForUpdateAsync();
      if (checkResult?.isAvailable) {
        const fetchResult = await Updates.fetchUpdateAsync();
        if (fetchResult?.isNew) {
          this.status.isDownloaded = true;
          return { isNewDownloaded: true };
        }
      }
      return { isNewDownloaded: false };
    } catch {
      // Safe catch - NEVER throw or crash the app on launch
      return { isNewDownloaded: false };
    }
  }

  // Download the update from your server and immediately reload the app
  async downloadAndApplyUpdate(): Promise<{ success: boolean; message: string }> {
    if (Platform.OS === 'web' || __DEV__) {
      return {
        success: false,
        message: 'Development मोड में अपडेट डाउनलोड लागू नहीं किया जा सकता।',
      };
    }

    try {
      if (!Updates.isEnabled) {
        return {
          success: false,
          message: 'ओटीए अपडेट्स इस बिल्ड में सक्रिय नहीं हैं।',
        };
      }

      this.status.isDownloading = true;
      const fetchResult = await Updates.fetchUpdateAsync();
      this.status.isDownloading = false;

      if (fetchResult?.isNew) {
        this.status.isDownloaded = true;
        await this.reloadApp();
        return {
          success: true,
          message: 'अपडेट सफलतापूर्वक लागू हो गया है!',
        };
      } else {
        return {
          success: true,
          message: 'ऐप पहले से ही अद्यतित है।',
        };
      }
    } catch (error: any) {
      this.status.isDownloading = false;
      return {
        success: false,
        message: `अपडेट डाउनलोड में त्रुटि: ${error?.message || 'अज्ञात त्रुटि'}`,
      };
    }
  }

  // Reload the app to apply the newly downloaded update immediately
  async reloadApp(): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.reload();
        return;
      }
      await Updates.reloadAsync();
    } catch (error: any) {
      console.warn('Reload notice:', error);
    }
  }
}

export const updateService = new UpdateService();
