import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { useApp } from '../context';
import { spiritualAudioService } from '../services/spiritualAudioService';

interface MiniAudioPlayerProps {
  title: string;
  subtitle?: string;
  durationSeconds?: number;
  audioUrl?: string;
}

export const MiniAudioPlayer: React.FC<MiniAudioPlayerProps> = ({
  title,
  subtitle = 'पवित्र जप एवं तानपुरा श्रवण (Sacred Sound)',
  durationSeconds = 480, // 8 mins default
  audioUrl,
}) => {
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const [loopCountIndex, setLoopCountIndex] = useState<number>(0); // 0: 1x, 1: 11x, 2: 21x, 3: 108x, 4: ∞
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const loopOptions = ['1x', '11x', '21x', '108x', '∞'];

  const timerRef = useRef<any>(null);

  // Initialize Audio
  useEffect(() => {
    spiritualAudioService.init();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      spiritualAudioService.stop();
    };
  }, []);

  // Playback timer & loop control
  useEffect(() => {
    if (isPlaying) {
      if (!isMuted) {
        spiritualAudioService.play(audioUrl);
      }

      timerRef.current = setInterval(() => {
        setCurrentPosition((prev) => {
          if (prev >= durationSeconds) {
            // Ring sacred temple bell on completion/loop
            spiritualAudioService.ringTempleBell();

            // Check loop
            if (loopCountIndex > 0) {
              return 0; // restart loop
            } else {
              setIsPlaying(false);
              spiritualAudioService.pause();
              return durationSeconds;
            }
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      spiritualAudioService.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, durationSeconds, loopCountIndex, isMuted, audioUrl]);

  const togglePlayPause = () => {
    if (currentPosition >= durationSeconds) {
      setCurrentPosition(0);
    }
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (!nextState) {
      spiritualAudioService.pause();
    }
  };

  const rewind10 = () => {
    setCurrentPosition((prev) => Math.max(0, prev - 10));
  };

  const forward10 = () => {
    setCurrentPosition((prev) => Math.min(durationSeconds, prev + 10));
  };

  const cycleLoop = () => {
    setLoopCountIndex((prev) => (prev + 1) % loopOptions.length);
    spiritualAudioService.ringTempleBell();
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      spiritualAudioService.pause();
    } else if (isPlaying) {
      spiritualAudioService.play(audioUrl);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = Math.min(100, (currentPosition / durationSeconds) * 100);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#1F1713' : '#FFFFFF',
          borderColor: isDarkMode ? '#3D2A1C' : '#E8D7C3',
        },
      ]}
    >
      {/* Progress Line */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.playerInner}>
        <View style={styles.trackInfo}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
              {isPlaying ? '▶ ' : '⏸ '}{title}
            </Text>
            {isPlaying && (
              <View style={styles.soundIndicatorBadge}>
                <Text style={styles.soundIndicatorText}>🔊 Audio Live</Text>
              </View>
            )}
          </View>
          <View style={styles.metaTimeRow}>
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>
              {formatTime(currentPosition)} / {formatTime(durationSeconds)}
            </Text>
            <Text style={[styles.timeDot, { color: theme.textMuted }]}>•</Text>
            <Text style={[styles.subtitle, { color: theme.accent }]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          {/* Mute/Sound Toggle */}
          <TouchableOpacity
            onPress={toggleMute}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Ionicons
              name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
              size={20}
              color={isMuted ? '#D32F2F' : theme.textPrimary}
            />
          </TouchableOpacity>

          {/* Loop Chanting Button */}
          <TouchableOpacity
            onPress={cycleLoop}
            style={[
              styles.loopButton,
              {
                backgroundColor: loopCountIndex > 0 ? Colors.saffron : isDarkMode ? '#2D2018' : '#F5EBE1',
              },
            ]}
          >
            <Text
              style={[
                styles.loopText,
                { color: loopCountIndex > 0 ? '#FFFFFF' : theme.textPrimary },
              ]}
            >
              {loopOptions[loopCountIndex]}
            </Text>
          </TouchableOpacity>

          {/* Rewind 10s */}
          <TouchableOpacity
            onPress={rewind10}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Ionicons name="play-back" size={18} color={theme.textPrimary} />
            <Text style={[styles.seekBadge, { color: theme.textSecondary }]}>10</Text>
          </TouchableOpacity>

          {/* Main Play/Pause Button */}
          <TouchableOpacity
            onPress={togglePlayPause}
            style={[styles.playBtn, { backgroundColor: Colors.saffron }]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={22}
              color="#FFFFFF"
              style={{ marginLeft: isPlaying ? 0 : 2 }}
            />
          </TouchableOpacity>

          {/* Forward 10s */}
          <TouchableOpacity
            onPress={forward10}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Ionicons name="play-forward" size={18} color={theme.textPrimary} />
            <Text style={[styles.seekBadge, { color: theme.textSecondary }]}>10</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 0,
    paddingBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.saffron,
  },
  playerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm + 2,
  },
  trackInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '75%',
  },
  soundIndicatorBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  soundIndicatorText: {
    color: '#2E7D32',
    fontSize: 9,
    fontWeight: '700',
  },
  metaTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeDot: {
    fontSize: 11,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loopButton: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loopText: {
    fontSize: 11,
    fontWeight: '700',
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekBadge: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: -2,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.saffron,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
