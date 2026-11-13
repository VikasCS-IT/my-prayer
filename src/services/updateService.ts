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
    currentUpdateId: Updates.updateId || null,
    runtimeVersion: Updates.runtimeVersion || '1.0.0',
    channel: Updates.channel || 'production',
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    errorMessage: null,
  };

  getStatus(): UpdateStatus {
    return {
      ...this.status,
      currentUpdateId: Updates.updateId || null,
      runtimeVersion: Updates.runtimeVersion || '1.0.0',
      channel: Updates.channel || 'production',
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    };
  }

  // Check if an update exists on your server (EAS or Self-Hosted server)
  async checkForUpdate(): Promise<{ hasUpdate: boolean; message: string }> {
    if (Platform.OS === 'web') {
      return {
        hasUpdate: false,
        message: 'वेब प्लेटफॉर्म पर हमेशा नवीनतम संस्करण लोड होता है (Web always runs latest bundle).',
      };
    }

    if (__DEV__) {
      return {
        hasUpdate: false,
        message: 'विकास मोड (Development Mode) में लाइव रीलोड सक्रिय है। ओटीए अपडेट्स केवल प्रोडक्शन बिल्ड (APK/AAB) में सक्रिय होते हैं।',
      };
    }

    try {
      this.status.isChecking = true;
      this.status.errorMessage = null;

      const checkResult = await Updates.checkForUpdateAsync();
      this.status.lastCheckedDate = new Date();
      this.status.isChecking = false;

      if (checkResult.isAvailable) {
        this.status.isAvailable = true;
        return {
          hasUpdate: true,
          message: 'नया अपडेट उपलब्ध है! डाउनलोड करने के लिए टैप करें।',
        };
      } else {
        this.status.isAvailable = false;
        return {
          hasUpdate: false,
          message: 'आपका ऐप पहले से ही नवीनतम संस्करण पर है। कोई नया अपडेट नहीं मिला।',
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

  // Download the update from your server and immediately reload the app
  async downloadAndApplyUpdate(): Promise<{ success: boolean; message: string }> {
    if (Platform.OS === 'web' || __DEV__) {
      return { success: false, message: 'ओटीए अपडेट केवल प्रोडक्शन ऐप (APK/AAB) पर लागू होता है।' };
    }

    try {
      this.status.isDownloading = true;
      const fetchResult = await Updates.fetchUpdateAsync();

      this.status.isDownloading = false;
      this.status.isDownloaded = true;

      if (fetchResult.isNew) {
        // Reload app with newly fetched JS bundle & assets without reinstalling APK
        await Updates.reloadAsync();
        return {
          success: true,
          message: 'अपडेट सफलतापूर्वक लागू किया गया! ऐप पुनः लोड हो रहा है...',
        };
      } else {
        return {
          success: false,
          message: 'नया बंडल उपलब्ध नहीं है।',
        };
      }
    } catch (error: any) {
      this.status.isDownloading = false;
      this.status.errorMessage = error?.message || 'डाउनलोड विफल रहा';
      return {
        success: false,
        message: `अपडेट डाउनलोड में त्रुटि: ${this.status.errorMessage}`,
      };
    }
  }
}

export const updateService = new UpdateService();

