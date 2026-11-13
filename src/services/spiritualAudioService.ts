import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// Web Audio API Synthesizer for instant, zero-latency, 100% offline spiritual sound
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

  // Play a rich sacred temple bell / Tibetan singing bowl chime (घंटी)
  playTempleBell() {
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Fundamental frequencies of an auspicious temple brass bell
      const bellFreqs = [528, 1056, 1584, 2112]; // Solfeggio / brass harmonics
      bellFreqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Exponential decay for realistic bell resonance
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

  // Start continuous meditative Tanpura & Om chord drone (136.1 Hz Pranav Om frequency)
  startSacredDrone() {
    this.initContext();
    if (!this.ctx || this.isSynthesizing) return;

    try {
      const now = this.ctx.currentTime;
      this.isSynthesizing = true;
      this.oscillators = [];

      // Pranav Om fundamental (136.1 Hz) + Tanpura Pa-Sa harmonics (204.15 Hz, 272.2 Hz, 408.3 Hz)
      const droneHarmonics = [
        { freq: 136.1, type: 'triangle', vol: 0.2 },
        { freq: 204.15, type: 'sine', vol: 0.12 },
        { freq: 272.2, type: 'sine', vol: 0.08 },
        { freq: 408.3, type: 'sine', vol: 0.05 },
      ];

      // Subtle LFO for breathing drone effect
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.2, now); // 0.2 Hz slow meditative cycle
      lfoGain.gain.setValueAtTime(0.05, now);
      lfo.connect(lfoGain);
      lfo.start(now);

      droneHarmonics.forEach((h) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = h.type as OscillatorType;
        osc.frequency.setValueAtTime(h.freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(h.vol, now + 1.2); // Smooth gentle fade in

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

  // Stop sacred drone smoothly
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
  private sound: Audio.Sound | null = null;
  private isNative = Platform.OS !== 'web';
  private isPlaying = false;
  private isMuted = false;

  async init() {
    try {
      if (this.isNative) {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      }
    } catch (e) {
      console.warn('Audio initialization notice:', e);
    }
  }

  async play(audioUrl?: string) {
    this.isPlaying = true;

    if (Platform.OS === 'web') {
      if (audioUrl) {
        // If web URL is provided, try native Audio element
        try {
          const audio = new window.Audio(audioUrl);
          audio.play().catch(() => {
            // fallback to synth
            webAudioSynthesizer.startSacredDrone();
          });
          return;
        } catch {}
      }
      // Zero-latency meditative drone + temple bell chime
      webAudioSynthesizer.startSacredDrone();
      return;
    }

    // Native iOS/Android Audio playback
    try {
      if (audioUrl) {
        if (!this.sound) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true, isLooping: true }
          );
          this.sound = sound;
        } else {
          await this.sound.playAsync();
        }
      }
    } catch (e) {
      console.warn('Native audio play notice:', e);
    }
  }

  async pause() {
    this.isPlaying = false;
    if (Platform.OS === 'web') {
      webAudioSynthesizer.stopSacredDrone();
      return;
    }

    try {
      if (this.sound) {
        await this.sound.pauseAsync();
      }
    } catch (e) {
      console.warn('Native audio pause error:', e);
    }
  }

  ringTempleBell() {
    if (Platform.OS === 'web') {
      webAudioSynthesizer.playTempleBell();
    }
  }

  async stop() {
    this.isPlaying = false;
    if (Platform.OS === 'web') {
      webAudioSynthesizer.stopSacredDrone();
      return;
    }

    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (e) {
      console.warn('Native audio stop error:', e);
    }
  }
}

export const spiritualAudioService = new SpiritualAudioPlayer();

