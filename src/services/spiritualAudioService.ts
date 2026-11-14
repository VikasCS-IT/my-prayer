import { Platform } from 'react-native';

// Safe module loading for expo-audio (modern Expo SDK) and expo-av (legacy)
let ExpoAudioModule: any = null;
let LegacyAudioModule: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoAudioModule = require('expo-audio');
} catch {
  // expo-audio not available
}

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const av = require('expo-av');
  LegacyAudioModule = av?.Audio || null;
} catch {
  // expo-av not available
}

// Local offline sound assets
const SOUND_OM_DRONE = require('../../assets/sounds/om_drone.wav');
const SOUND_TEMPLE_BELL = require('../../assets/sounds/temple_bell.wav');

// Web Audio API Synthesizer for web browsers
class WebSpiritualSynthesizer {
  private ctx: any = null;
  private masterGain: any = null;
  private oscillators: any[] = [];
  private isSynthesizing = false;

  private initContext() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.ctx && AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  playTempleBell() {
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bellFreqs = [528, 1056, 1584, 2112];
      bellFreqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const initialVol = 0.25 / (idx + 1);
        gain.gain.setValueAtTime(initialVol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5 + idx * 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);

        osc.start(now);
        osc.stop(now + 3.0);
      });
    } catch (e) {
      console.warn('Temple bell play error:', e);
    }
  }

  startSacredDrone() {
    this.initContext();
    if (!this.ctx || this.isSynthesizing) return;

    try {
      const now = this.ctx.currentTime;
      this.isSynthesizing = true;
      this.oscillators = [];

      const droneHarmonics = [
        { freq: 136.1, type: 'triangle', vol: 0.2 },
        { freq: 204.15, type: 'sine', vol: 0.12 },
        { freq: 272.2, type: 'sine', vol: 0.08 },
        { freq: 408.3, type: 'sine', vol: 0.05 },
      ];

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.2, now);
      lfoGain.gain.setValueAtTime(0.05, now);
      lfo.connect(lfoGain);
      lfo.start(now);

      droneHarmonics.forEach((h) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = h.type as OscillatorType;
        osc.frequency.setValueAtTime(h.freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(h.vol, now + 1.2);

        lfoGain.connect(gain.gain);
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);

        osc.start(now);
        this.oscillators.push({ osc, gain });
      });

      this.playTempleBell();
    } catch (e) {
      console.warn('Drone start error:', e);
    }
  }

  stopSacredDrone() {
    if (!this.ctx || !this.isSynthesizing) return;

    try {
      const now = this.ctx.currentTime;
      this.oscillators.forEach(({ osc, gain }) => {
        try {
          gain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
          osc.stop(now + 0.7);
        } catch {}
      });
      this.oscillators = [];
      this.isSynthesizing = false;
    } catch (e) {
      console.warn('Drone stop error:', e);
    }
  }

  setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }
}

export const webAudioSynthesizer = new WebSpiritualSynthesizer();

export class SpiritualAudioPlayer {
  private player: any = null; // expo-audio player
  private legacySound: any = null; // expo-av sound
  private bellPlayer: any = null;
  private isNative = Platform.OS !== 'web';
  private isPlaying = false;
  private isMuted = false;

  async init() {
    try {
      if (this.isNative) {
        if (ExpoAudioModule?.setAudioModeAsync) {
          await ExpoAudioModule.setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
          });
        } else if (LegacyAudioModule?.setAudioModeAsync) {
          await LegacyAudioModule.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
          });
        }
      }
    } catch (e) {
      console.warn('Audio init notice:', e);
    }
  }

  async play(audioUrl?: string) {
    this.isPlaying = true;

    // Web Browser execution
    if (Platform.OS === 'web') {
      if (audioUrl) {
        try {
          const audio = new window.Audio(audioUrl);
          audio.play().catch(() => {
            webAudioSynthesizer.startSacredDrone();
          });
          return;
        } catch {}
      }
      webAudioSynthesizer.startSacredDrone();
      return;
    }

    // Modern expo-audio (Native Android / iOS inside Expo Go & APK)
    if (ExpoAudioModule?.createAudioPlayer) {
      try {
        const source = audioUrl ? { uri: audioUrl } : SOUND_OM_DRONE;

        if (!this.player) {
          this.player = ExpoAudioModule.createAudioPlayer(source);
          this.player.loop = true;
        }

        this.player.volume = this.isMuted ? 0 : 1.0;
        this.player.play();
        return;
      } catch (err) {
        console.warn('expo-audio player error:', err);
      }
    }

    // Legacy expo-av fallback
    if (LegacyAudioModule?.Sound) {
      try {
        const source = audioUrl ? { uri: audioUrl } : SOUND_OM_DRONE;
        if (!this.legacySound) {
          const { sound } = await LegacyAudioModule.Sound.createAsync(
            source,
            { shouldPlay: true, isLooping: true, volume: this.isMuted ? 0 : 1.0 }
          );
          this.legacySound = sound;
        } else {
          await this.legacySound.playAsync();
        }
        return;
      } catch (err) {
        console.warn('legacy expo-av error:', err);
      }
    }

    // Fallback synthesizer
    webAudioSynthesizer.startSacredDrone();
  }

  async pause() {
    this.isPlaying = false;

    if (Platform.OS === 'web') {
      webAudioSynthesizer.stopSacredDrone();
      return;
    }

    try {
      if (this.player) {
        this.player.pause();
      }
      if (this.legacySound) {
        await this.legacySound.pauseAsync();
      }
    } catch (e) {
      console.warn('Audio pause notice:', e);
    }
  }

  ringTempleBell() {
    if (Platform.OS === 'web') {
      webAudioSynthesizer.playTempleBell();
      return;
    }

    // Native temple bell chime
    if (ExpoAudioModule?.createAudioPlayer) {
      try {
        const bell = ExpoAudioModule.createAudioPlayer(SOUND_TEMPLE_BELL);
        bell.volume = 0.9;
        bell.play();
        setTimeout(() => {
          try {
            bell.release();
          } catch {}
        }, 4000);
        return;
      } catch {}
    }

    if (LegacyAudioModule?.Sound) {
      try {
        LegacyAudioModule.Sound.createAsync(
          SOUND_TEMPLE_BELL,
          { shouldPlay: true, isLooping: false, volume: 0.9 }
        ).then(({ sound }: any) => {
          setTimeout(() => {
            try {
              sound.unloadAsync();
            } catch {}
          }, 4000);
        });
        return;
      } catch {}
    }

    webAudioSynthesizer.playTempleBell();
  }

  async stop() {
    this.isPlaying = false;

    if (Platform.OS === 'web') {
      webAudioSynthesizer.stopSacredDrone();
      return;
    }

    try {
      if (this.player) {
        this.player.pause();
        try {
          this.player.seekTo(0);
          this.player.release();
        } catch {}
        this.player = null;
      }
      if (this.legacySound) {
        await this.legacySound.stopAsync();
        await this.legacySound.unloadAsync();
        this.legacySound = null;
      }
    } catch (e) {
      console.warn('Audio stop notice:', e);
    }
  }

  setVolume(volume: number) {
    if (this.player) {
      this.player.volume = volume;
    }
    if (this.legacySound) {
      this.legacySound.setVolumeAsync(volume);
    }
    webAudioSynthesizer.setVolume(volume);
  }
}

export const spiritualAudioService = new SpiritualAudioPlayer();
